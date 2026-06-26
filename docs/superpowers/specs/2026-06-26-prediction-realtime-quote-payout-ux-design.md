# Prediction Realtime Quote and Responsible Payout UX Design

Date: 2026-06-26
Status: approved design direction

## Goal

Make the real-money VND prediction experience understandable, responsible, and economically bounded.

The product must stop presenting grid odds as if they were fixed payout promises. Users should see a clear payout estimate receipt driven by a backend quote: stake, pool state, estimated return, profit, loss, house fee, market support, maximum supported stake, quote expiry, and the reminder that final payout is calculated at lock.

## Core Decisions

1. Single-race prediction markets use a hybrid parimutuel model.
2. The parimutuel pool remains the base settlement model.
3. Low-liquidity markets may receive limited house support so a correct user does not win less than their stake.
4. House support is capped and checked before accepting a stake.
5. The frontend never calculates final payout from grid odds.
6. The user's stake is user-controlled and never auto-changed by market movement.
7. Quote values are provisional, expire quickly, and are recomputed by the backend at confirmation.

## Markets

For the MVP, the quote layer applies to single-race money markets:

- `EXACT_POSITION`
- `HEAD_TO_HEAD`

`WINNER` remains deprecated and should not be offered. `TOP3` remains removed.

`WINNING_STREAK` can use the same receipt UI language, but it is a capped parlay rather than a parimutuel pool. It should be quoted separately in a follow-up slice if needed.

## Atomic Market Keys

Support caps and pool state are tracked per atomic market:

- `EXACT_POSITION`: `(raceId, predictionType, predictedPosition)`
- `HEAD_TO_HEAD`: `(raceId, predictionType, lowerParticipantId, higherParticipantId)`

This prevents one position column or matchup from consuming support intended for unrelated markets.

## Money Policy

Recommended MVP defaults:

- House fee: `15%`
- Minimum stake: `10,000 VND`
- Minimum winning return: `1.10x stake`
- Support cap: `500,000 VND per atomic market`
- Quote expiry: `10-15 seconds`
- Material quote movement threshold: `5-10% projected return change`

All money remains `bigint` or `long`. All odds, ratios, and percentages use decimal math on the backend.

## Quote Math

For a selected outcome and proposed stake, the backend simulates the market after adding the proposed stake.

Definitions:

- `grossPool`: total active stake in the atomic market after the proposed stake
- `netPool`: `grossPool * (1 - houseFeePercent)`
- `outcomePool`: total active stake on the selected outcome after the proposed stake
- `userStake`: proposed user stake
- `poolPayout`: `userStake / outcomePool * netPool`
- `minimumProtectedReturn`: `userStake * minimumReturnMultiplier`
- `supportNeeded`: `max(0, minimumProtectedReturn - poolPayout)`
- `projectedReturn`: `poolPayout + supportNeeded`, only if support is available
- `estimatedProfit`: `projectedReturn - userStake`
- `estimatedAfterStake`: `projectedReturn / userStake`

If support is not available for the requested stake, the backend returns `STAKE_TOO_HIGH` with `maxSupportedStake`. If `maxSupportedStake < minimumStake`, the market returns `DISABLED`.

## Support Reservation

Support must not be checked only at settlement. The backend must check or reserve support before accepting a stake.

MVP rule:

1. Quote computes `supportNeeded`.
2. Confirm recomputes quote inside the transaction.
3. If the latest required support fits the remaining cap, the bet is accepted.
4. If not, the bet is rejected with `STAKE_TOO_HIGH` or `DISABLED`.

The first implementation can avoid a separate reservation table by recomputing worst-case support from active accepted bets on every quote and confirm. If concurrency becomes a problem, add a market support reservation row locked with `SELECT FOR UPDATE`.

## Liquidity States

The backend returns one of these states:

- `POOL_ACTIVE`: pool is deep enough; no support is needed for the requested stake.
- `LOW_LIQUIDITY_PROTECTED`: pool is thin; support is included and still within cap.
- `STAKE_TOO_HIGH`: requested stake exceeds supported exposure; return `maxSupportedStake`.
- `DISABLED`: market cannot support the minimum stake safely.

The frontend uses these states for copy and controls, not for independent money math.

## Quote API

Endpoint shape:

```http
POST /api/v1/prediction-quotes
```

Request:

```json
{
  "raceId": 81,
  "predictionType": "EXACT_POSITION",
  "predictedWinnerId": 205,
  "predictedPosition": 1,
  "stakeAmount": 100000
}
```

`HEAD_TO_HEAD` includes the selected participant and lets the backend derive the matchup from the active matchup table or current pairing rules.

Response:

```json
{
  "accepted": true,
  "liquidityState": "LOW_LIQUIDITY_PROTECTED",
  "selectionLabel": "Crimson Dynasty to finish 1st",
  "stakeAmount": 100000,
  "currentPoolEstimate": "50.00",
  "estimatedAfterStake": "1.10",
  "projectedReturn": 110000,
  "estimatedProfit": 10000,
  "potentialLoss": 100000,
  "poolPayout": 85000,
  "marketSupport": 25000,
  "minimumProtectedReturn": 110000,
  "minimumReturnMultiplier": "1.10",
  "houseFeePercent": 15,
  "maxSupportedStake": 120000,
  "quoteExpiresAt": "2026-06-26T14:55:30+07:00",
  "message": "Final payout is calculated at betting lock."
}
```

Rejected response:

```json
{
  "accepted": false,
  "liquidityState": "STAKE_TOO_HIGH",
  "stakeAmount": 500000,
  "maxSupportedStake": 120000,
  "message": "Maximum supported stake for this selection is 120,000 VND."
}
```

## Submit Flow

Submit and update endpoints must recompute the quote inside the backend transaction before deducting wallet balance.

Flow:

1. Validate race is open.
2. Validate market and outcome are active.
3. Validate stake bounds.
4. Recompute quote with the requested stake.
5. Reject if quote is expired, unsupported, or materially changed beyond allowed tolerance.
6. Save prediction ticket.
7. Deduct wallet stake with idempotent ledger entry.
8. Store quote snapshot fields for audit:
   - quoted pool payout
   - quoted support amount
   - quoted effective odds
   - quote liquidity state
   - quote timestamp

The stored quote snapshot is not a fixed final payout promise for parimutuel markets. It is an audit trail showing what the user reviewed at placement time.

## Settlement Flow

Settlement remains pool-based:

1. Freeze the active market pool at lock.
2. Compute final `netPool`.
3. Determine the winning outcome from official results.
4. Compute each winner's `poolPayout`.
5. Apply minimum-return support only within the accepted support policy.
6. Floor payouts to integer VND.
7. Credit wallet payouts idempotently.
8. Refund voided/cancelled markets.

The settlement algorithm must never use `stake * gridOdds`.

## Frontend Structure

Replace or evolve the current `PayoutReceipt` into `PayoutEstimatePanel`.

Desktop layout:

- Left: odds grid or matchup selector
- Right: sticky `PayoutEstimatePanel`

Mobile layout:

- Odds grid first
- Payout panel as a bottom sheet or fixed action panel after selection

The odds grid is preview-only. Selected cells are highlighted, but high odds should not be styled as a guaranteed "best deal."

## Payout Estimate Panel Copy

Low-liquidity state:

```text
Payout Estimate
LOW LIQUIDITY | PROTECTED

Your stake
100,000 VND

Estimated after your stake
1.10

If correct
Estimated return: 110,000 VND
Estimated profit: +10,000 VND

Breakdown
Pool payout: 85,000 VND
Market support: 25,000 VND
House fee: 15% included

If incorrect
You lose: 100,000 VND

Max supported stake
120,000 VND

Final payout is calculated at betting lock.
Updated 3s ago
```

Active pool state:

```text
Payout Estimate
POOL ACTIVE | PROVISIONAL

Your stake
100,000 VND

Estimated after your stake
3.10

If correct
Estimated return: 310,000 VND
Estimated profit: +210,000 VND

Breakdown
Pool payout: 310,000 VND
Market support: 0 VND
House fee: 15% included

If incorrect
You lose: 100,000 VND
```

Stake-too-high state:

```text
Stake exceeds available market support

Maximum supported stake
120,000 VND

Reduce your stake to keep minimum return protection.
```

Disabled state:

```text
Temporarily unavailable

This market cannot support the minimum protected return right now.
Please choose another selection or check back later.
```

Required disclaimer:

```text
Your stake stays fixed. Estimated return may move with the market until betting locks.
```

## Quote Movement UX

The panel keeps the previous accepted quote and compares it with the latest quote.

If projected return changes materially before confirmation:

1. Disable confirm.
2. Show the old and new projected return.
3. Require the user to review the latest quote before confirming.

Copy:

```text
Quote updated

Projected return changed:
500,000 VND -> 420,000 VND

Please review before confirming.
```

Stake must never be auto-adjusted when odds move.

Optional later mode:

- Target return mode: user enters desired return, UI suggests required stake.
- This remains opt-in and never silently changes stake.

## Realtime Behavior

MVP uses REST polling, not WebSocket or SSE.

- Stake changes: debounce `300-500ms`, then quote.
- Selection changes: quote immediately.
- Active payout panel: refresh every `3-5s`.
- Odds grid: refresh every `5-10s`.
- Quote expiry: disable confirm or auto-refresh.
- Confirm: backend recomputes quote one final time.

The UI should not mimic a crypto trading terminal with flashing colors and charts. Use restrained status labels and clear money rows.

## Odds Grid Changes

Grid cells should change from fixed-odds language to estimate language:

```text
50.00
Thin pool
```

Tooltip:

```text
Current pool estimate. Your payout is quoted after your stake and may change until betting locks.
```

The grid can show trend movement later, but the first version should prioritize clarity over animation.

## Error Handling

The quote panel handles:

- no selection
- quote loading
- accepted quote
- quote expired
- quote materially changed
- stake too high
- insufficient balance
- disabled market
- race locked
- backend quote error

Submit errors should preserve the user's selection and stake so they can review or reduce stake without starting over.

## Testing

Backend tests:

- quote returns pool-active state when no support is needed
- quote returns low-liquidity protected state when support is needed and cap fits
- quote rejects stake above supported cap
- quote disables market when max supported stake is below minimum stake
- submit recomputes quote and rejects stale or unsupported requests
- settlement never uses grid odds
- wallet deduction remains idempotent

Frontend tests:

- payout panel renders all money rows from backend quote
- grid odds are labelled as estimates
- confirm is disabled on expired quote
- confirm is disabled after material quote movement until review
- stake input does not auto-change when quote changes
- stake-too-high response offers max supported stake

## Rollout Order

1. Update UI wording so grid odds are estimates, not payout promises.
2. Add backend quote DTOs and quote service.
3. Add quote endpoint.
4. Wire `PayoutEstimatePanel` to quote endpoint.
5. Recompute quote in submit/update before wallet deduction.
6. Add liquidity states and max supported stake handling.
7. Add audit fields for quoted values.
8. Polish visual states and copy.

## Non-Goals

- Do not build WebSocket/SSE in the MVP.
- Do not add trading-style charts.
- Do not auto-adjust user stake.
- Do not use fixed seed liquidity as uncapped house-funded pool money.
- Do not present `stake * gridOdds` as the final payout.

## Success Criteria

Users can answer these questions before confirming:

1. How much am I staking?
2. How much can I lose?
3. How much do I currently estimate receiving if correct?
4. How much of that estimate comes from the pool?
5. Is house support included?
6. What fee is included?
7. Is my stake within the supported range?
8. Can the estimate still move before lock?

If those answers are visible in one panel, the UX is doing its job.
