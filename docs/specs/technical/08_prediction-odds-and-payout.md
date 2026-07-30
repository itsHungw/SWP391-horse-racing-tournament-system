# Prediction — Odds & Payout Specification

Status: authoritative spec for the spectator prediction (betting) feature. It documents
the money model, the exact odds/payout formulas, the settlement algorithm, and the
risk analysis. It is written so a reviewer can reproduce every number by hand.

Money unit everywhere is **VND** (real cash wallet, see `08`/wallet specs). All money
columns are `bigint`; all odds/probabilities are `numeric` / `BigDecimal`. No `int`,
no `double`, in any money path (see §9).

---

## 1. Markets (what a user can bet on)

A *market* is one independent betting question on a race. Each market has mutually
exclusive *outcomes*; exactly one outcome wins after the result is published.

**Live markets** (the only ones the UI exposes — `PredictionModeSelector`):

| Market | Code | Outcomes | Winning rule |
|---|---|---|---|
| Exact position | `EXACT_POSITION` | each participant × position `j` | participant finishes exactly in position `j` |
| Head-to-head | `HEAD_TO_HEAD` | participant A vs B (+handicap) | A's handicapped time beats B |
| Streak (accumulator) | streak | 2+ legs, each a Win pick | every leg wins |

Single-race markets (`EXACT_POSITION`, `HEAD_TO_HEAD`) are settled per race. Streak is a
parlay across several races in one tournament.

**Removed market — `TOP3`:** fully removed end-to-end. The UI never offered it after the
cockpit redesign; the backend type/validation/settlement branches are gone, the API now
rejects any `TOP3` submission (only `EXACT_POSITION` / `HEAD_TO_HEAD` are accepted), and the
`predicted_second_id` / `predicted_third_id` columns were dropped in `V18`.

**Deprecated type — `WINNER`:** not offered in the UI; the entity constant and settlement
branch are kept only to settle any historical `WINNER` rows. New submissions are rejected.
This spec does not define odds for either.

---

## 2. Money model & invariants

Symbols used throughout:

| Symbol | Meaning |
|---|---|
| `s` | stake (wager) of one bet, VND, `s ≥ MIN_WAGER` |
| `t` | takeout rate (house margin), e.g. `0.15` (15%) |
| `P` | gross pool of a market = Σ of all stakes in that market |
| `P_net` | `P × (1 − t)` — amount returned to winners |
| `S_win` | Σ stakes placed on the outcome that actually won |
| `O` | decimal odds (payout multiplier, **stake-inclusive**) |

**House-safety invariant (the property the whole design is built to guarantee):**

```
For every market and every outcome:  Σ payouts ≤ P_net = P × (1 − t) ≤ P
```

If this holds, the house pays winners only out of money players already put in, keeps
exactly `t · P`, and **can never lose** on a market. §3 picks a model that satisfies it
by construction. §4 shows the current code does *not* satisfy it.

---

## 3. Recommended model — Parimutuel (pool) betting

This is the model used by real tote / horse-racing boards precisely because it carries
**zero house risk** while staying dynamic and exciting. We recommend it as the target.

### 3.1 Pooling

All stakes in a market join one pool `P`. The house immediately earmarks takeout `t·P`.
The distributable pool is `P_net = P · (1 − t)`.

### 3.2 Odds & payout

For an outcome `o`, let `S_o` = Σ stakes on `o`. Its **decimal odds** are

```
O_o = P_net / S_o            (stake-inclusive; payout already includes the stake back)
```

When outcome `o*` wins, a bet of stake `s` on `o*` pays

```
payout(s) = s · O_o*  = s · P_net / S_win
```

Because `Σ over winning bets of s = S_win`, the total paid is

```
Σ payout = S_win · P_net / S_win = P_net = P · (1 − t)
```

→ the invariant in §2 holds with **equality**. The house always keeps exactly `t·P`,
no matter who wins or how big anyone bet. This is the formal answer to "can a whale
drain us?": **no — total payout is mathematically pinned to the pool.**

### 3.3 Provisional vs final odds (important behavioral rule)

In a pool model the odds of a bet are **not known until the pool closes**, because they
depend on the *final* pool. Therefore:

- While the race is `SCHEDULED`, the UI shows **provisional odds** `O_o = P_net / S_o`
  recomputed from the live pool. They are indicative only.
- At lock time (race leaves `SCHEDULED`) the pool is frozen; **final odds** are computed
  once from the frozen pool and stored in `locked_odds` as the settled multiplier.
- Payout at settlement uses the frozen `locked_odds`.

This differs from the current code, which freezes odds at *bet* time (a fixed-odds /
sportsbook behaviour — see §4/§7). Moving the freeze to *pool-close* is what removes
house risk.

### 3.4 Edge cases

1. **Nobody bet the winning outcome** (`S_win = 0`): there is no one to divide the pool
   among. Rule: **refund every bet in the market** (status `REFUNDED`, `BET_REFUND`).
   House keeps 0; nobody loses. (Alternative: roll `P_net` into the next race's pool —
   not used; refund is simpler and auditable.)
2. **Single participant in the market**: market is void → refund.
3. **A participant withdraws**: bets on the withdrawn participant are refunded; the pool
   excludes them before computing odds.
4. **Rounding leftover** (see §8): any sub-VND remainder after rounding payouts down stays
   with the house (favaurs the invariant; never creates a shortfall).

### 3.5 Worked example — normal race

`t = 0.15`. EXACT_POSITION, position 1 market. Stakes:

| Bet | Horse | Stake |
|---|---|---|
| u1 | A | 200,000 |
| u2 | A | 100,000 |
| u3 | B |  50,000 |
| u4 | C |  50,000 |

`P = 400,000`, `P_net = 340,000`. Provisional odds:

```
O_A = 340,000 / 300,000 = 1.1333
O_B = 340,000 /  50,000 = 6.8000
O_C = 340,000 /  50,000 = 6.8000
```

If **B** finishes 1st: `S_win = 50,000`. Payout to u3 = `50,000 × 6.8 = 340,000`.
Total paid = 340,000 = `P_net`. House keeps 60,000 (= `t·P`). ✔ invariant holds.

### 3.6 Worked example — the whale attack (proves it is closed)

Whale bets `W = 50,000,000` on A (position 1). Attacker (2nd account) bets `X` on B.
Pool now `P = 50,000,000 + X`, `P_net = 0.85·P`.

- Provisional `O_B = P_net / X = 0.85(50,000,000 + X)/X` — yes, this looks huge for small
  `X` (the "x1000" the audit flagged). **But it is harmless here**, because:
- If B wins, payout to attacker `= X · O_B = 0.85(50,000,000 + X)`. The whale's 50M is a
  *loss* that funds it. Cartel net `= payout − W − X = 0.85(50M + X) − 50M − X
  = −0.15·(50M) − 0.15X = −(7.5M + 0.15X) < 0`.
- House net is `+ t·P = +(7.5M + 0.15X) ≥ 0` on **every** outcome.

The inflated-looking odds never let total payout exceed the pool. Compare §4.

---

## 4. Why the current implementation is unsafe (audit finding #1)

Current code (`OddsCalculationService.calculateOdds`) is a *virtual-liquidity AMM*, not a
pool:

```
O = (vPool + totalRealBets) · rMargin / (vHorse + realBetsOnHorse)
    vPool = 100,000 (virtual, house-funded)   rMargin = 0.85
    totalRealBets = Σ real stakes on the position (ALL horses)
    realBetsOnHorse = real stakes on THIS horse only
```

Two structural problems:

1. **Numerator/denominator asymmetry.** `totalRealBets` (all horses on the position) sits
   in the numerator of *every* horse, but only that horse's stake is in the denominator.
   A big bet on horse A therefore inflates the odds of *every other* horse on that
   position without bound. With `W = 50,000,000` and `vHorse ≈ 10,000`,
   `O_other ≈ 50,000,000·0.85 / 10,000 ≈ 4,258`.
2. **Payout is funded from house cash, not a pool.** Settlement does
   `payout = wager × locked_odds` and credits it via `walletService.adjust(BET_PAYOUT)`
   (`PredictionSettlementScheduler` ~L200). There is no pool accounting tying payouts to
   collected stakes, and the virtual `vPool` is house-funded. So the §2 invariant does
   **not** hold: there exist outcomes where `Σ payout > P` and the house pays the
   difference out of its own balance.

   Concrete house-loss outcome: a single bettor stakes `s = 100,000` on a longshot with
   `vHorse = 10,000`; `O = (100,000+100,000)·0.85 / (10,000+100,000) = 1.545`. If that
   horse wins, the house collected 100,000 and pays 154,500 → **loses 54,500** on that
   market. Over many bets the 15% margin usually covers it, but any actor able to predict
   or influence a result (jockeys/owners exist on this very platform) bets the +EV side
   and extracts cash.

The fix is structural: adopt the §3 pool model, OR, if a fixed-odds feel is required,
keep odds-at-bet but enforce the §6 caps and accept bounded (non-zero) risk.

---

## 5. Probability estimation (display & seeding only — never funds payout)

Historical win/position probabilities are still useful to (a) show "form" to users and
(b) optionally seed a tiny starting pool so early odds are not absurd. They must **not**
drive payout in the pool model.

Per horse, per position `j`, with Laplace (add-one) smoothing over `N` participants:

```
p(j) = (count_j + 1) / (totalRaces + N)
```

Normalised across horses for a column: `p̂(j) = p(j) / Σ_horses p(j)`. This is the basis of
`base_win_probability` and the AI form hints. Smoothing avoids 0/∞ for new horses.

If a virtual seed is used for display only, seed each outcome with a **fixed, house-capped**
virtual stake `v_o = SEED · p̂_o` that is excluded from real payout division (it only
smooths the *provisional* number shown pre-pool); the realised payout in §3.2 uses real
stakes only, preserving zero risk.

---

## 6. Safety bounds (apply to every model)

These are cheap, independent guardrails. They bound exposure even if a formula is wrong.

| Bound | Purpose | Suggested |
|---|---|---|
| `MIN_WAGER` | dust / spam | 10,000 VND (current) |
| `MAX_WAGER` per bet | cap single-bet influence & overflow | e.g. 50,000,000 VND |
| `MAX_ODDS` cap | clamp absurd multipliers | e.g. 100.0 |
| `MAX_PAYOUT` per ticket | hard ceiling on any single payout | e.g. 1,000,000,000 VND |
| `MAX_MARKET_LIABILITY` | total house exposure per market (fixed-odds only) | configurable |
| overround `Σ(1/O_o) > 1` | guarantees a house edge in fixed-odds | enforce on publish |

All limits live under `app.prediction.*` runtime configuration — not hard-coded constants
like the old `vPool = 100000`, `rMargin = 0.85` display model.

---

## 7. Settlement algorithm (per race)

Triggered by a `prediction_settlement_jobs` row after the result is published. Idempotent
and crash-safe.

```
for each market on the race:
    freeze pool P, compute P_net = P · (1 − t)           # pool model
    determine winning outcome o* from official result
    S_win = Σ stakes on o*
    if S_win == 0:  refund all bets in market;  continue
    O_final = clamp( P_net / S_win , 0, MAX_ODDS )       # store in locked_odds
    for each winning bet b:
        payout = floor( b.stake × O_final )              # BigDecimal, HALF_DOWN to integer VND
        payout = min(payout, MAX_PAYOUT)
        b.reward_points = payout
        wallet.adjust(b.user, +payout, BET_PAYOUT, REF_RACE_PREDICTION, b.id, ...)   # idempotent by (ref,id,type)
    for each losing bet b:  b.status = INCORRECT; b.reward_points = 0
```

Properties:
- **Idempotency**: every credit is keyed by `(referenceType, referenceId, transactionType)`
  with a DB unique index, so re-running a job never double-pays (`WalletService.adjust`).
- **Atomicity**: a per-bet failure is caught, counted in `failed_count`, and does not abort
  peers; a whole-job failure refunds via `markJobAsFailed`.
- **No overflow**: stake, payout, reward all `bigint`/`BigDecimal` after migration `V17`
  (see §9). `payout` is computed with `BigDecimal` then `longValueExact()` into a `long`
  field and a `bigint` column — no truncation, no "integer out of range".

---

## 8. Streak / accumulator (bounded fixed-odds)

Parlays are inherently fixed-odds (you can't pool a cross-race combination cleanly), so
streak stays fixed-odds but is bounded so house risk is small and capped:

- Leg odds are the §3 / §5 odds for each leg's Win pick, **locked at bet time** per leg.
- Ticket multiplier: current code **sums** leg odds (`Σ O_leg`). True parlays *multiply*
  (`Π O_leg`); summing is intentionally lower-variance and lower-liability — keep it, and
  document the choice. Either way:
  - cap `total_odds ≤ MAX_TOTAL_ODDS` (currently 1000 — recommend lowering, e.g. 100);
  - cap final payout `min(wager × total_odds, MAX_PAYOUT)`;
  - apply `MAX_WAGER`.
- A losing or void leg: ticket `LOST`; refund only if a leg is voided (withdrawal/cancel).
- Reward computed with `BigDecimal`, stored `bigint` (V17).

Residual house risk for streak = bounded by `MAX_PAYOUT` per ticket × ticket count; track
`MAX_MARKET_LIABILITY` per tournament if stricter control is needed.

---

## 9. Data types & precision (audit finding #2 — implemented in `V17`)

Before: prediction money columns were `int` while the wallet is `bigint`; the Java field
`rewardPoints` was `long` over an `int` column (type mismatch). A bet or a payout above
`2,147,483,647` VND overflowed → Postgres `integer out of range` → the settlement of a
*winning* bet threw and the user was never paid.

`V17__widen_prediction_money_to_bigint.sql` widens:

| Table.column | Before | After |
|---|---|---|
| `race_predictions.wager_amount` | `int` | `bigint` |
| `race_predictions.entry_cost_points` | `int` | `bigint` |
| `race_predictions.reward_points` | `int` | `bigint` |
| `race_predictions.locked_odds` | `numeric(10,2)` | `numeric(18,4)` |
| `streak_predictions.wager_amount` | `int` | `bigint` |
| `streak_predictions.reward_points` | `int` | `bigint` |
| `streak_predictions.total_odds` | `numeric(10,2)` | `numeric(18,4)` |
| `streak_prediction_legs.locked_odds` | `numeric(10,2)` | `numeric(18,4)` |

Java entities/DTOs/requests updated `Integer → Long` accordingly. Rules going forward:

- **Money: `bigint` / `long`.** Range to ~9.2×10¹⁸ VND — never overflows for VND.
- **Odds/probability: `numeric(18,4)` / `BigDecimal`.** No `double` in any money path
  (eliminates floating-point drift in payouts). The legacy `double` AMM math in
  `OddsCalculationService` should be ported to `BigDecimal` when §3 is implemented.
- **Rounding policy**: payout rounded to integer VND with `RoundingMode.DOWN` (house keeps
  the sub-unit remainder; never round up — that would break the §2 invariant).

---

## 10. Status & rollout

| Item | State |
|---|---|
| Type widening (§9) | **Done** — `V17` + entity/DTO changes |
| Safety caps (§6) | **Done** — `app.prediction.*` config; min/max wager enforced at submit; max odds/payout at settlement |
| Parimutuel settlement (§3, §12.1, §12.2) | **Done** — `PredictionSettlementScheduler` pays EXACT_POSITION + HEAD_TO_HEAD from pools (`payout = stake·P_net/S_win`); zero house risk; fixes B1–B4, B7. H2H is straight-up (handicap dropped); ties/DNF/no-winner → refund. |
| Streak parlay (§12.3) | **Diverges from spec.** As built (2026-07-30) the ticket multiplier is the **sum** of the legs' fair odds (`Σ O_leg`) with **no** `t_parlay` end-margin; only `max-total-odds`/`max-payout` bound it. Void leg contributes nothing and all-void ⇒ refund (B5 fixed), but the multiplicative single-margin formula in §12.3 is **not** implemented (B6 open) — see the as-built note there. |
| Live **provisional** odds display (§3.3, §4) | **Pending** — `OddsCalculationService` still shows the old AMM number at bet time; payout is pool-based so this is a display-only mismatch (B1 in display, B8 `double`). Should show `P_net/S_o` and "final at close". |
| Prediction edit/re-price path | **Closed by policy** — `PUT /api/v1/predictions/{id}` is disabled and returns method-not-allowed behavior; users place a new wager instead of editing an existing one. |

The pooled markets (EXACT_POSITION, HEAD_TO_HEAD) carry zero house risk and are complete.
The streak market is bounded by caps but currently takes **no margin at all** — its liability
is capped, not priced (see the §12.3 as-built note). Remaining work is the bet-time **display**
of pool-provisional odds (UX); prediction editing is intentionally disabled.

---

## 11. Anticipated review questions (defense crib)

- **"How do you stop a whale from manipulating odds to drain money?"** Pool model: total
  payout is `P·(1−t)`, mathematically ≤ the pool, on every outcome (§3.2, §3.6). The house
  keeps a fixed cut and cannot lose. Inflated-looking provisional odds are funded entirely
  by the inflating bet's own stake.
- **"What was wrong before?"** Two things (§4): the AMM odds formula inflates other horses'
  odds via a numerator that sums all bets while the denominator is per-horse; and payouts
  were paid from house cash with no pool cap, so some outcomes are house-negative.
- **"What happens on an overflow / very large bet?"** Can't happen after `V17`: all money
  is `bigint`/`BigDecimal`; payout uses `BigDecimal` then exact `long` (§9).
- **"Why not lock odds when the user bets?"** That is fixed-odds and carries house risk;
  pool odds must be read at pool-close to stay self-funding (§3.3).
- **"Is it still fun if odds aren't fixed?"** Yes — provisional odds move live, longshots
  still pay large multipliers; this is exactly how real tote betting works.

---

## 12. Per-market formulas, cases & bug catalog

This section is the detailed, board-facing design for each of the three live markets:
the **current** formula, every economic hole and settlement bug, the **recommended**
house-safe formula, and a complete case table. Notation from §2 (`t`, `P`, `P_net`,
`S_o`, `O`). Worked numbers use `t = 0.15`.

> One rule underlies everything below: **single-race markets become pools (zero house
> risk); the parlay stays fixed-odds but bounded.** A pool can never pay out more than it
> took in (§2 invariant), so every "manipulation" below evaporates the moment the market
> is a pool.

### 12.1 EXACT_POSITION

A bet predicts "participant `h` finishes in exactly position `j`". For a given position
column `j`, the outcomes are mutually exclusive (exactly one horse occupies position `j`),
so column `j` is a clean parimutuel market on its own.

**Current formula** (`OddsCalculationService.calculatePositionOddsMatrix`):

```
vPool = 100000 ; rMargin = 0.85
vHorse(h,j)   = vPool · p̂(h,j)                 # p̂ = Laplace hist prob, normalised per column
O(h,j) = (vPool + totalRealBets_j) · 0.85 / (vHorse(h,j) + realBets(h,j))
payout = wager · O(h,j)   (locked at bet time, paid from house funds)
```

**Economic holes**

1. **Numerator inflation (whale).** `totalRealBets_j` (sum over *all* horses in column `j`)
   sits in every horse's numerator; only `realBets(h,j)` is in horse `h`'s denominator. A
   50,000,000 bet on horse A at `j` pushes every *other* horse's odds to
   `≈ (100000 + 50,000,000)·0.85 / vHorse ≈ 4,250×`. A colluding second account then locks
   that 4,250× on a longshot. Because odds are **locked** and paid from **house cash**, the
   house is liable for the inflated payout even if the whale's bet is later refunded
   (race cancel / withdrawal, §12.1 cases) — that is the actual drain path.
2. **No overround / under-round arbitrage.** The odds are built independently per horse, so
   nothing forces `Σ_h 1/O(h,j) > 1`. When it dips **below 1**, backing *every* horse in
   column `j` (one each, sized ∝ `1/O`) returns more than it costs **whatever the result** —
   risk-free profit, i.e. guaranteed house loss. Manipulation (hole 1) drives it under 1.
3. **Laplace on thin history mis-prices.** A new/low-history horse gets `p̂ ≈ 1/N` for every
   position regardless of true ability; a sharp who knows it is strong (or weak) bets it at
   generic odds for positive expected value against the house.
4. **`vPool` is house-funded liquidity.** With small real pools the house is the de-facto
   counterparty and pays winners from its own balance; only the 15% margin protects it, and
   holes 1–3 defeat the margin.

**Recommended formula (parimutuel per `(race, position j)`)**

```
P_j      = Σ stakes on column j (all horses)
P_j_net  = P_j · (1 − t)
winner   = the horse that actually finished position j ; S_win = Σ stakes on (winner, j)
O(h,j)   = P_j_net / S(h,j)              # provisional, recomputed live; frozen at lock
payout   = stake · P_j_net / S_win        # only bets on (winner, j) are paid
```

**House-safety:** `Σ payouts = S_win · P_j_net / S_win = P_j_net = P_j·(1−t) ≤ P_j`. Zero
risk, every outcome. Holes 1–4 all vanish: the whale's inflating stake *funds* the inflated
odds and is forfeited when its horse loses; there is no `vPool` subsidy; under-round is
impossible (payout is pinned to the pool).

**Worked example.** Column `j=1`, `t=0.15`. Stakes: A=200k, A=100k, B=50k, C=50k →
`P=400k`, `P_net=340k`. Provisional `O_A=340k/300k=1.13`, `O_B=O_C=340k/50k=6.80`. If **B**
wins position 1: the single B bettor gets `50k·6.80 = 340k = P_net`; house keeps `60k = t·P`.

**Cases**

| Case | Rule |
|---|---|
| Nobody bet the actual position-`j` horse (`S_win=0`) | refund every bet in column `j` |
| Only one horse backed in column `j` | void column → refund |
| Predicted horse **withdrawn** before race | refund its bets; exclude from the column pool |
| Horse does not finish / position `j` not reached | that horse's bets lose normally; if column has no winner, refund column |
| Rounding | payout floored to integer VND (`RoundingMode.DOWN`); remainder kept by house |

**Settlement bug today:** withdrawal refund only fires on `ResultFinishStatus.WITHDRAWN`
(`PredictionSettlementScheduler` L114). A horse that is a non-starter under any *other*
status, or a column with no finisher, is **not** refunded — those bettors lose unfairly.

### 12.2 HEAD_TO_HEAD

A bet picks A (vs B) to "win" a 2-horse matchup, optionally with a time handicap.

**Current formula** (`calculateH2HMatchups`):

```
pairs sorted by historical win-rate ; vA = vB = vPool·0.5
O_A = (vPool + betsA + betsB)·0.85 / (vA + betsA)   (and symmetrically O_B)
handicap = avg_finish_time(B) − avg_finish_time(A), capped ±10s
win condition: timeA + handicap < timeB
```

**Economic holes**

1. **Numerator inflation** — identical to §12.1 (betsA+betsB in both numerators) → whale/
   colluder drain.
2. **Fixed 50/50 prior ignores the real gap.** `vA=vB` makes `O_A≈O_B≈1.7` even for a
   lopsided pair; the favourite then wins the handicapped matchup far more than 50% →
   backing the favourite is systematically +EV for the bettor (house −EV).
3. **Handicap from raw average finish time is meaningless across races** of different
   distances/conditions; the resulting line is noise a knowledgeable bettor exploits.
4. **Deterministic public pairing** (sorted by win-rate) lets bettors pre-identify and
   target the most mis-priced pair.

**Recommended formula (2-outcome parimutuel per matchup)**

```
P       = stakesA + stakesB ; P_net = P·(1 − t)
winner  = A or B per the (handicapped) result
O_A = P_net / stakesA ; O_B = P_net / stakesB   (provisional, frozen at lock)
payout  = stake · P_net / S_win
```

The pool **auto-prices skill**: money flows to the favourite → its odds shorten, the
underdog lengthens — no virtual 50/50 prior and no dubious time-handicap needed for the
*odds*. The handicap (if kept) only sets the sporting *win condition*, and must use a
**comparable** metric — average **speed** `distance / finish_time` (or a rating), not raw
time — capped, and clearly documented. **Simplest robust option: drop the handicap and make
H2H straight "who finishes ahead"; the pool already encodes the skill gap in the price.**

**House-safety:** 2-outcome pool ⇒ `Σ payout = P_net ≤ P`. Zero risk.

**Cases**

| Case | Rule |
|---|---|
| A and B both finish, `effTimeA < timeB` | A wins |
| Exact tie (`effTimeA == timeB`) | **push** → refund both sides |
| One of A/B has no finish time (DNF/DNS) but the other finished | the finisher wins |
| Both DNF / either withdrawn | void matchup → refund |
| `S_win = 0` (nobody backed the winner) | refund matchup |

**Settlement bugs today** (`PredictionSettlementScheduler` L150-158):
- If `timeA` **or** `timeB` is null the bet is marked **INCORRECT (lose)**, never refunded —
  a bettor on the horse that *did* finish loses when the opponent DNFs. Should refund/award.
- Exact ties make A lose (`compareTo < 0`); should be a **push** (refund).

### 12.3 STREAK (accumulator / parlay)

Pick `k ≥ 2` "Win" legs across races in one tournament; the ticket wins only if **all**
legs win. Parlays combine independent fixed-odds legs, so a parlay cannot be pooled cleanly —
it stays **fixed-odds but strictly bounded**.

**Current formula** (`StreakPredictionService` + scheduler):

```
legOdds_i = Win odds for leg i (from §12.1 matrix, position 1)
totalOdds = Σ legOdds_i           # ADDITIVE, capped at MAX_TOTAL_ODDS = 1000
payout    = wager · totalOdds      # if every leg wins
```

**Economic holes & bugs**

1. **Additive odds is mathematically wrong and *unattractive*.** To win you must hit the
   **joint** event (probability `Π p_i`, small) but you are paid the **sum** `Σ legOdds`.
   Example: 4 legs, each true `p=0.30`, fair leg odds `1/0.30≈3.33`. Player risk =
   `Π p = 0.0081`. Additive pays `Σ = 13.3×` → expected return `0.0081·13.3 = 0.108` → the
   house keeps **~89%**. That is not a margin, it is confiscation; nobody will play. A true
   parlay multiplies: `Π(1/p)=123×`.
2. **Compounding per-leg margin (if you just multiply the current leg odds) over-charges
   too.** Each leg already carries the 15% takeout; `(1−t)^4 = 0.52` ⇒ ~48% hold. Also
   unattractive.
3. **Void-leg overpay bug** (`PredictionSettlementScheduler` L247-248): a `REFUNDED` leg is
   **added** to `totalOdds` at its full locked odds, and `allFinished` stays true, so a
   ticket with a voided leg settles **WON and pays the voided leg's odds**. A void leg must
   instead **drop out** (contribute ×1, not its odds).
4. Inherits every §12.1 leg-odds manipulation, **amplified** because legs are multiplied.

**Recommended formula (bounded fair-odds parlay, single margin)**

```
p_i        = fair win probability of leg i (model/pool-implied, NO per-leg margin)
rawOdds    = Π (1 / p_i)
totalOdds  = min( rawOdds · (1 − t_parlay) , MAX_TOTAL_ODDS )     # ONE margin, e.g. t_parlay = 0.20
payout     = min( wager · totalOdds , MAX_PAYOUT )
```

- **Multiplicative** (real parlay → big, attractive multipliers) with **one** end-margin
  (not compounded) keeps it both exciting *and* a controlled ~20% hold.
- **Bounded house risk** (this is the one fixed-odds market): `MAX_TOTAL_ODDS`,
  `MAX_PAYOUT` per ticket, `MAX_WAGER`, and an optional `MAX_TICKET_LIABILITY` per tournament.
- **Void leg** (withdrawal/cancel): set that leg's factor to `1.0`, recompute
  `totalOdds = Π over remaining legs`; if `<2` legs remain, degrade to a single Win bet or
  refund per policy. Never add a voided leg's odds.

**Cases**

| Case | Rule |
|---|---|
| All legs win | pay `min(wager·Π·(1−t_parlay), MAX_PAYOUT)` |
| Any leg loses | ticket LOST, no payout |
| A leg is voided (withdrawal/race cancel) | leg factor = 1.0, recompute product on remaining |
| All legs but one voided | degrade to single Win bet (or refund) |
| `< 2` legs at submit | reject (a streak needs ≥ 2) |

**As built (2026-07-30) — the code does NOT follow the formula above**

The shipped implementation sums the legs instead of multiplying them, and applies no
`t_parlay` margin:

```
totalOdds = min( Σ O_leg , MAX_TOTAL_ODDS )      # no (1 − t_parlay) factor
payout    = min( wager · totalOdds , MAX_PAYOUT )
```

Three call sites agree on this: `StreakPredictionService.createStreakPrediction`,
`PredictionService.lockRacePredictions`, and `PredictionSettlementScheduler` (settlement).
The frontend `computeStreakOdds` sums with the same cap, so display and settlement match.
`app.prediction.streak-takeout` is still configured but no longer read by the payout path.

**Known consequence — the streak market has no house hold.** Summing is *less* generous than
multiplying for long-priced legs, but *more* generous for short-priced ones, because
`Σ O > Π O` whenever the legs sit near 1.0. A ticket of 5 favourites at fair odds 1.10
(≈62% chance all five land) pays `5 × 1.10 = 5.5×` against a fair price of `1.1⁵ = 1.61×`,
i.e. an expected return of ~3.4× stake. Accepted deliberately for the current build; revisit
before this market runs on real money at scale.

### 13. Cross-market bug catalog (current code → fix)

| # | Where | Bug | Fix |
|---|---|---|---|
| B1 | `OddsCalculationService.calculateOdds` | numerator uses all-horse total, denominator per-horse → unbounded odds inflation | pool model (§12.1/§12.2) |
| B2 | all odds | no overround check ⇒ under-round arbitrage | pool model pins `Σpayout=P_net` |
| B3 | settlement | EXACT_POSITION refund only on `WITHDRAWN`; other non-starters lose | refund any non-finisher column / unraced bet |
| B4 | settlement L150-158 | H2H with a null finish time → lose (not refund); tie → A loses | refund on missing time / treat tie as push |
| B5 | streak L247-248 | voided leg **added** to multiplier; ticket settles WON with void leg | void leg ⇒ ×1, recompute product |
| B6 | streak odds | additive `Σ` (and compounded margin) ⇒ unplayable | **Open** — the compounded per-leg margin is gone, but the ticket still sums (`Σ`) and now carries no end-margin at all. See the §12.3 as-built note. |
| B7 | all | payout `wager·lockedOdds` from house funds, odds locked at bet time, bets refundable ⇒ lock-then-refund drain | pool model removes fixed liability; streak bounded by caps |
| B8 | `OddsCalculationService` | `double` arithmetic on money | `BigDecimal` end-to-end |
| B9 | all | no MAX_WAGER / MAX_ODDS / MAX_PAYOUT / market-liability caps | use `app.prediction.*` config (§6) |
| B10 | prediction edit endpoint | editing a placed wager would need a wager-delta settlement path | keep edit disabled; `PUT /api/v1/predictions/{id}` returns method-not-allowed behavior |

### 14. Implementation checklist

1. **EXACT_POSITION** → parimutuel per `(race, position)`; provisional odds live, frozen at
   lock; payout = `stake · P_net / S_win`; refund column when `S_win=0` or no finisher.
2. **HEAD_TO_HEAD** → 2-outcome parimutuel per matchup; drop the 50/50 prior; handicap
   either removed or based on a comparable speed metric; fix tie/DNF to push/refund.
3. **STREAK** → *as built:* summed fair-odds (`Σ`), no end-margin, hard caps; void leg contributes
   nothing. The multiplicative single-margin parlay below is the recommendation, not the code.
4. **Cross-cutting** → `BigDecimal` money math; caps in `app.prediction.*`; idempotent,
   pool-funded settlement; keep placed predictions immutable unless a future edit workflow settles wager deltas.

---

## Tóm tắt cho hội đồng (VN)

- **Vấn đề 1 (thao túng odds):** công thức cũ cho phép một cú cược lớn thổi phồng tỷ lệ của
  các ngựa khác (x1000) và payout trả từ tiền nhà cái → có kết cục nhà cái lỗ. Giải pháp đề
  xuất: mô hình **parimutuel (chia pool)** — nhà cái thu phí cố định `t` (vd 15%), người
  thắng chia phần còn lại của pool. **Chứng minh:** tổng chi trả = `P·(1−t) ≤ pool` với mọi
  kết quả → nhà cái **không bao giờ lỗ**, rủi ro = 0, mà vẫn hấp dẫn (tỷ lệ động, longshot
  trả cao). Xem §3.2 và ví dụ whale §3.6.
- **Vấn đề 2 (tràn kiểu dữ liệu):** các cột tiền của prediction là `int` (tràn ở 2,147 tỷ),
  field `long` ghi vào cột `int` → payout lớn làm settlement lỗi, người thắng không nhận
  được tiền. Đã sửa bằng `V17`: tất cả về `bigint` + `numeric(18,4)`, không dùng `double`
  cho tiền (§9).
- Bổ sung các **trần an toàn** (max cược, trần odds, trần payout) ở §6 để chặn rủi ro kể cả
  khi công thức sai.
