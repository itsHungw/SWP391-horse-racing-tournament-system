# Wallet Fintech Redesign Design

## Status

Approved direction: **Big-fintech wallet** — slim balance hero + Stripe-style money-states + **Performance equity curve (Robinhood/Revolut)** + **single-screen withdraw (Cash App / Revolut, NOT a wizard)**.

This redesign keeps the existing `/wallet` route, `ClientHeader`, `ClientFooter`, the client cinematic theme ("Night at the Races"), and **all existing backend contracts and `walletApi` functions**. It redesigns the page body and the withdraw surface, and adds one new client-only chart component. No backend or API changes are required for the MVP (all data already exists).

Owner of this spec: UX/UI redesign of `frontend/src/pages/wallet/`. Implementer: a separate agent. Read this spec **and** the paired plan `docs/superpowers/plans/2026-06-23-wallet-fintech-redesign.md` before starting.

## Why

The shipped wallet page (`frontend/src/pages/wallet/WalletPage.tsx`, commit `d9ea40a`) is the *pre-redesign* version. It:

1. **Ignores backend work that already exists.** `GET /wallet/me/summary` (returns `balance / inPlay / pendingWithdrawal`), bank-account CRUD, `cancelWithdrawal`, and the `CANCELLED` status are all implemented and already wired into `walletApi.ts` + `types/wallet.ts` — but the page never calls them. It recomputes a weaker summary client-side from the transaction list and never surfaces **in-play** money.
2. **Uses a weak inline withdraw form** (one free-text `"Name - account number - bank"` field) even though a polished bank-account flow already exists in the repo (`WithdrawSheet.tsx`, `BankSelect.tsx`, `banks.ts` — currently untracked and unused).
3. **Has no sense of time / trend** — it is all flat cards plus one table. There is no answer to "how am I doing?".
4. **Shows fake decorative data** in the hero ("Holder: Racing member", "Pass tier: Champion") and marketing copy on an authenticated account screen.

The user also explicitly **rejects the 3-step withdraw wizard** in the current `WithdrawSheet.tsx` and wants a withdraw surface modeled on big platforms.

## Goals

- Make `/wallet` feel like a premium fintech account screen (Apple Wallet / Stripe / Wise / Revolut DNA) while staying inside the existing cinematic theme.
- Surface the **authoritative** money states from `/wallet/me/summary`: **Available (withdrawable)**, **In play**, **Pending withdrawal**.
- Add a **Performance equity curve** (cumulative net result over time) with a range toggle — the meaningful "trend" chart for a predictions product.
- Replace the wizard withdraw with a **single-screen** withdraw surface (no Next/Next pagination) using saved bank accounts.
- Add **cancel** for pending withdrawals and a **status timeline** per request.
- Allow **custom top-up amount** in addition to presets.

## Non-Goals

- No new backend endpoints, entities, migrations, or DTO changes for the MVP. (One *optional* future endpoint is noted in "Future / optional".)
- No change to the `/wallet` route, route protection, auth, or VNPay top-up flow.
- No rename of wallet entities/services or transaction types.
- No change to admin withdrawal screens beyond what already exists (`AdminWithdrawalsPage.tsx` already handles `CANCELLED`).
- Not a candlestick/price chart. A wallet has no market price; candlesticks are the wrong metaphor and are explicitly out.

## Vocabulary Guard (compliance — mandatory)

The wallet now moves **real money (VND)**, but the client UI keeps the non-gambling framing used across the public site. In all **visible** wallet copy:

- **Do not use:** Bet, Betting, Wager, Odds, Stake, Gambling, P&L, Profit/Loss (as gambling terms).
- **Use instead:** Prediction, Entry, Payout, Winnings, Performance, Net result, Top-up, Withdrawal.
- Chart title is **"Performance"** (subtitle "Net results over time"), never "P&L" or "Profit".
- Amounts render as `1,234,567 VND` (thousands separators, space, `VND` suffix) — matches the rest of the site. Negative amounts use a leading `-`, positives a leading `+` only in the ledger amount column and chart delta.

## Existing Context (read these files first)

| Concern | File | Notes |
|---|---|---|
| Page (to rewrite) | `frontend/src/pages/wallet/WalletPage.tsx` | Current pre-redesign version |
| Page test (to update) | `frontend/src/pages/wallet/WalletPage.test.tsx` | Asserts old anchors — **will break**, see "Test Plan" |
| Withdraw sheet (to refactor) | `frontend/src/pages/wallet/WithdrawSheet.tsx` | 3-step wizard — de-wizard it; reuse its logic/a11y |
| Bank picker (reuse as-is) | `frontend/src/pages/wallet/BankSelect.tsx`, `banks.ts` | Dropdown + monograms; 18 VN banks |
| API client (already complete) | `frontend/src/api/walletApi.ts` | Has `getSummary`, bank CRUD, `cancelWithdrawal` |
| Types (already complete) | `frontend/src/types/wallet.ts` | Has `WalletSummary`, `BankAccount`, `CANCELLED` |
| Count-up primitive | `frontend/src/components/client/CountUp.tsx` | Use for balance |
| Theme tokens | `frontend/src/styles.css` | `turf-*`, `gold-*`, `ivory*`, `emerald-soft`, `.font-display/.font-data`, `.text-foil`, `.grain` |

### Data sources (all already implemented — do not change)

| Data | Call | Shape |
|---|---|---|
| Balance + status | `walletApi.getMyWallet()` | `Wallet { userId, balance, status }` |
| **Money states** | `walletApi.getSummary()` | `WalletSummary { balance, status, inPlay, pendingWithdrawal }` |
| Ledger | `walletApi.getMyTransactions()` | `WalletTransaction[]` (signed `amount`, `balanceAfter`, `createdAt`) |
| Withdrawals | `walletApi.getMyWithdrawals()` | `Withdrawal[]` (status incl. `CANCELLED`) |
| Cancel withdrawal | `walletApi.cancelWithdrawal(id)` | refunds the hold |
| Saved banks | `walletApi.getBankAccounts() / addBankAccount() / deleteBankAccount()` | `BankAccount[]` |
| Top-up | `walletApi.createTopUp(amount)` | `{ paymentUrl }` → redirect |

**Derived value — define once and reuse:**
```
availableToWithdraw = max(0, summary.balance - summary.inPlay - summary.pendingWithdrawal)
```
The withdraw surface caps the amount at `availableToWithdraw` (the current sheet incorrectly receives the full balance).

---

## Target Layout (IA)

Single primary column on `/wallet` (the existing 2-column grid may stay; the right rail becomes "Saved accounts" + "Guardrails"). Top → bottom:

### 1. Balance hero (slimmed, real data)
- Eyebrow "Available balance" (kept), big balance number via `CountUp` (keep `.text-foil` / gold treatment), `VND wallet` caption.
- Status pill: **Active** (emerald) / **Locked** (rose) driven by `summary.status` / `wallet.status`.
- **Two primary actions inline in the hero**: `Add money` (scrolls to / opens top-up) and `Withdraw` (opens the withdraw sheet). These are the only two CTAs above the fold.
- **Remove** the marketing paragraph and the fake "Holder / Pass tier" block. If a holder line is wanted, use the real authenticated user's name from the existing auth context; otherwise drop it. Keep the card/hero aesthetic (gradient, grain, race image at low opacity) — just stop showing invented data.
- Keep parallax/tilt only if trivial; it is optional and must respect `prefers-reduced-motion`.

### 2. Money-states row (Stripe-style) — 3 tiles
From `getSummary()`:
- **Available** — `availableToWithdraw`, emerald accent, caption "Ready to withdraw".
- **In play** — `summary.inPlay`, gold accent, caption "Locked in open predictions". (This is brand-new to the UI and is the most valuable missing state.)
- **Pending withdrawal** — `summary.pendingWithdrawal`, sky/amber accent, caption "Awaiting payout".

Each tile: label, value (`font-data`), small icon, skeleton while loading. Replaces the current 4-card "Total received / Total used / Pending / Ledger rows" block (those summary stats may move into the chart header as secondary stats, or be dropped — keep only what is meaningful).

### 3. Performance chart (the equity curve) — see full spec below.

### 4. Quick top-up
- Presets `50,000 / 100,000 / 200,000 / 500,000` (kept) **plus a custom-amount input** with a `Top up` button. Custom amount validates `> 0` and a sane max (e.g. ≤ 50,000,000 — confirm against any BE limit; if none, client-guard only). Each preset/custom calls `createTopUp` → redirect to `paymentUrl`.
- Keep the existing `?topup=success|failed` banner handling.

### 5. Ledger (Stripe/Binance table)
- Keep the existing table columns (Type / Description / Date / Amount / Balance).
- **Add filter chips** by transaction group: `All · Top-ups · Predictions · Payouts · Withdrawals` (map to `WalletTransactionType` sets). Client-side filter over the already-loaded list.
- Keep skeleton, empty state, and horizontal scroll on narrow screens.
- Pagination is optional (nice-to-have); if the list is long, cap initial render to ~25 rows with a "Show more".

### 6. Payout queue (withdrawal requests)
- List each request with amount, masked bank info, status badge.
- **Add the `CANCELLED` badge** (the current `WITHDRAWAL_BADGE` map is missing it). Suggested: `border-white/15 bg-white/5 text-ivory-dim`.
- **Add a `Cancel` action** on requests with status `REQUESTED` (and `APPROVED` only if backend allows — verify `WithdrawalService.cancel` rules; default to `REQUESTED` only). On click → `walletApi.cancelWithdrawal(id)` → refresh. Confirm with a small inline confirm (no full modal needed).
- **Add a status timeline** per request (Requested → Approved → Paid, with Rejected/Cancelled as terminal branches) using the timestamps already on `Withdrawal` (`requestedAt`, `reviewedAt`, `paidAt`) and `reviewNote`. A compact horizontal stepper or vertical dot-rail.

### Right rail (optional)
- **Saved bank accounts** (read from `getBankAccounts`) with add/remove — gives users a place to manage destinations outside the withdraw flow. Reuse `BankSelect` + monograms.
- **Guardrails** card may stay but trim copy; update "Currency model: Virtual points" → it is now real VND, so reword to something accurate and compliant (e.g. "Real funds · manual payout review") without using banned vocabulary.

---

## Performance Chart Spec (Equity Curve)

A hand-rolled SVG area+line chart. **No charting library** (the project has none installed; do not add recharts/visx). Full theme control + zero dependency + animatable with the existing `framer-motion@12`.

**Component:** `frontend/src/pages/wallet/PerformanceChart.tsx`. Self-contained; receives transactions + range and renders. Keep any reusable path-math in the same file unless a second chart appears.

### Data model
Compute purely client-side from `getMyTransactions()`:

1. **Result events** = transactions whose `type ∈ { BET_PLACED, BET_PAYOUT, BET_REFUND }`. These are the only types that represent prediction outcomes. (`amount` is already signed: `BET_PLACED` negative, `BET_PAYOUT`/`BET_REFUND` positive. A refunded entry nets to zero, which is correct — neither won nor lost.)
2. Sort ascending by `createdAt`.
3. Build a cumulative series: `point[i].value = Σ amount` for all result events up to and including `i`. `point[i].t = createdAt`.
4. This `value` is the **cumulative net result** (winnings minus entries). It can go negative.

### Range toggle
`1W · 1M · 3M · All` (default `All`, or `1M` if there is ≥1 month of data). Filtering clips the X domain to `createdAt >= cutoff`. Keep the **absolute cumulative value** on Y (do not rebase to zero) so the curve reads as true standing; the header delta describes movement *within* the selected range.

### Header (above the plot)
- Title **"Performance"**, subtitle "Net results over time".
- Big headline = current cumulative value (latest point), `font-data`, emerald if `>= 0` else rose.
- Delta chip = change across the selected range: `Δ = lastValueInRange - firstValueInRange`, shown as `+X VND (▲ n%)` / `-X VND (▼ n%)`. Percent is optional if the baseline is 0 (then show only absolute).

### Rendering
- `viewBox` responsive; maintain aspect ~ `16:6` desktop, taller on mobile.
- A horizontal **zero baseline** (dashed, `white/10`) when the series crosses zero.
- **Area fill** = vertical gradient from accent → transparent. Accent = `emerald-soft` when the ending value ≥ 0, `rose-300` when negative. (Gold gradient acceptable as an alternative neutral accent — pick one and be consistent; emerald/rose semantic coloring is preferred for a results curve.)
- **Line** = same accent, ~2px, round caps.
- Last point = a small filled dot + subtle glow.
- **Animation:** animate the line draw via `pathLength` (framer-motion) and fade the area in. Must no-op under `prefers-reduced-motion` (use `useReducedMotion`).
- **Hover/scrub tooltip** (value + date at cursor) is a **nice-to-have** — mark optional; ship without it if time-constrained.

### Empty / low-data states
- `< 2` result events → render an empty state inside the chart card: icon + "Your performance curve appears after your first settled prediction." Do not render a misleading flat line.
- Loading → skeleton block sized like the chart.

### Accessibility
- Wrap in a labelled region (`role="img"` with `aria-label` summarizing current value + range, e.g. "Performance: net result +120,000 VND over all time"). Provide the underlying numbers in the header text so the chart is not the only source of truth.

### Future / optional (NOT in MVP)
If transaction volume grows, add `GET /wallet/me/performance?range=` that returns a downsampled `{ t, value }[]` server-side. Not needed now; the client computation is fine for realistic volumes.

---

## Withdraw Redesign — Single Screen (de-wizard)

**Decision:** keep a **right slide-over sheet** (good a11y + premium feel; reuse the container, focus trap, ESC handling, and body-scroll-lock already in `WithdrawSheet.tsx`) but **collapse the 3 steps into one scrollable screen**. Model: Cash App "Cash Out" / Revolut transfer / Binance withdraw — everything visible at once, with a **persistent live summary**.

Rejected: the current `Amount → Bank → Review` paged wizard (Next/Next/Next). The user does not want it.

### Single-screen structure (top → bottom)
1. **Header:** "Withdraw" + close button. No stepper.
2. **Amount block:** large amount input (`font-data`, autofocus), `VND` suffix, `Max` button (= `availableToWithdraw`), and quick chips (`25% · 50% · 100%` of available, or the same preset amounts). Inline validation: must be `> 0` and `<= availableToWithdraw`; show the exceed/invalid message immediately.
3. **Destination block:** saved accounts as selectable rows (radio semantics, masked number `•••• 1234`, monogram, holder). "Add bank account" expands an inline form (reuse `BankSelect` + account number + holder, save via `addBankAccount`) and collapses back on save. Remove account via trash affordance. If no saved accounts, the add form is shown by default.
4. **Live summary (sticky footer, always visible):** Amount · Fee (`Free`) · **You receive** · **Balance after** = `availableToWithdraw - amount`. This replaces the wizard's separate Review step — the review is always on screen.
5. **Primary button (sticky):** label shows the concrete action — `Withdraw 150,000 VND` — disabled until amount valid **and** a destination is selected. On submit → `createWithdrawal(amount, bankInfo)` where `bankInfo` is composed from the selected account (keep the existing format `"{holder} · {accountNumber} · {bankName} ({bankCode})"`). On success → `onSubmitted()` (refresh page data) + close.
6. **Trust line:** short note "Reviewed manually before payout — usually 1–2 business days. The amount is held from your available balance until paid or rejected." (compliant copy, no banned words).

A separate confirm dialog is **not** required because the full summary is always visible and the button states the amount. If the implementer prefers an extra guard, a single lightweight confirm dialog is acceptable — but **no multi-step wizard**.

### Props (keep compatible with the page)
```ts
WithdrawSheet({
  open: boolean;
  available: number;          // pass availableToWithdraw, NOT full balance
  onClose: () => void;
  onSubmitted: () => void;
})
```
The page opens it from the hero `Withdraw` CTA and (optionally) from a money-states "Available" tile action.

---

## Visual / Theme Rules

- Surface = client cinematic theme. Use `turf-*` backgrounds (`#04140f`/`#06201a`/`turf-900`/`turf-950`), `gold-*` accents (`gold-400 #d4af37`), `ivory` text, `emerald-soft` for positive/live, `rose-300` for negative/alert.
- Fonts: `.font-display` (Fraunces) for headings, `.font-data` (Geist Mono) for all numbers/eyebrows, body via `.client-theme` wrapper (Hanken Grotesk).
- Reuse `.grain`, `.text-foil`, gold rules where they already appear. All motion respects `prefers-reduced-motion`.
- Keep the existing a11y quality: labelled sections (`aria-labelledby`), focus-visible rings, `role="status"/"alert"` on banners, min 44px tap targets.
- `lucide-react` is **v1.16** — brand icons are unavailable; stick to generic icons already imported on the page.

---

## Test Plan (mandatory — current test will break)

`WalletPage.test.tsx` currently asserts old anchors that this redesign removes: heading `racing pass`, region `money movement`, heading `withdrawal desk`, heading `platform guardrails`, inline labels `withdraw amount` / `bank account details`, table `cashflow ledger`. **Update the test** to the new structure and:

1. Extend the `vi.mock("../../api/walletApi", ...)` to also mock `getSummary`, `getBankAccounts`, `cancelWithdrawal` (and `addBankAccount`/`deleteBankAccount` if the sheet is rendered). The current mock omits them → the page will throw once it calls them.
2. Provide a `getSummary` resolved value with non-zero `inPlay` and `pendingWithdrawal` and assert the three money-state tiles render those numbers.
3. Assert the **Performance** chart region renders (by `aria-label`/role) and that with the seeded result events the headline net value is correct (`+25,000 - 10,000 = +15,000 VND`). Seed enough result events for a non-empty curve, or assert the empty state with the default seed.
4. Assert the ledger still shows `Race payout` / `+25,000 VND`.
5. Assert the Withdraw CTA opens the sheet (amount label, destination, and a button reading `Withdraw …`).
6. Keep test names descriptive; the redesigned page is still "a platform-grade racing wallet".

Run wallet tests in isolation (see Verification).

## Acceptance Criteria

- [ ] Money-states (Available / In play / Pending) render from `getSummary()`; `availableToWithdraw` is computed and used as the withdraw cap.
- [ ] Performance equity curve renders from transactions with a working `1W/1M/3M/All` toggle, correct headline + delta, emerald/rose semantics, empty + loading states, reduced-motion safe, labelled for a11y.
- [ ] Withdraw is a **single-screen** sheet (no wizard) with saved accounts, inline add-account, `Max`, live "you receive / balance after", and an amount-on-button CTA; capped at `availableToWithdraw`.
- [ ] Pending withdrawals show a `Cancel` action (REQUESTED) wired to `cancelWithdrawal`, a `CANCELLED` badge, and a status timeline.
- [ ] Custom top-up amount works alongside presets.
- [ ] No backend changes; no banned vocabulary in visible copy; amounts formatted `… VND`.
- [ ] `tsc` clean (frontend toolchain) and wallet vitest green.

## Verification (environment gotchas — from prior sessions)

- **Type-check:** `node frontend/node_modules/typescript/bin/tsc -b frontend --force`. Do **not** use `npx tsc` (resolves to a squatter package).
- **Wallet test:** `node frontend/node_modules/vitest/vitest.mjs run src/pages/wallet` (from `frontend/`). Do not run the full suite single-fork (breaks isolation); use `--maxWorkers=2 --minWorkers=1` if running broadly.
- **Preview screenshots wedge** on these animated client pages (infinite CSS animations never idle). Verify via `preview_eval` DOM queries / snapshot instead, and restart the preview server if a screenshot hangs.
- `/wallet` is auth-gated (`RequireAuthRoute`) and needs the backend on SQL Server; pure-browser preview of live data is hard. Prefer the vitest mocks for behavior proof.
