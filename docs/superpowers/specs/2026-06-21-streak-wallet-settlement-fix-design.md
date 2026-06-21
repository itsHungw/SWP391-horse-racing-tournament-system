# Streak Wallet And Settlement Fix Design

## Goal

Fix streak prediction accounting so placing a streak deducts the wager exactly once and winning credits `wagerAmount * totalOdds` exactly once, including the original stake.

## Root Cause

Point transaction idempotency uses `(referenceType, referenceId, transactionType)`. Streak predictions reused `RACE_PREDICTION` even though streak and race predictions use independent identity sequences. A streak and a race prediction can therefore have the same ID, causing streak entry or reward transactions to be mistaken for existing race-prediction transactions and skipped.

## Accounting Rules

- A submitted streak deducts its full wager immediately.
- Ticket persistence and wager deduction are one Spring transaction. Either both commit or both roll back.
- Streak total odds are additive: `sum(leg.lockedOdds)`.
- Any lost leg makes the streak lose.
- A withdrawn leg is refunded at leg level and contributes `0` to final total odds.
- When every non-lost leg is resolved, the streak wins and credits `wagerAmount * finalTotalOdds`.
- The winning credit is the complete return and includes the original stake.
- Reprocessing the same streak cannot deduct or reward it twice.

## Design

Introduce and consistently use the point reference type `STREAK_PREDICTION` for streak entry and reward transactions. Keep the existing `@Transactional` service boundary around streak creation and deduction. Settlement will recompute additive odds from resolved winning legs, ignore refunded legs, persist the terminal streak state, and credit the reward with the streak-specific idempotency key.

The change stays focused on streak accounting. It does not redesign the shared point ledger or unrelated prediction types.

## Verification

Regression tests will prove:

1. A race prediction transaction with the same numeric ID does not suppress a streak wager deduction.
2. A successful streak submission reduces the persisted account balance by the wager.
3. A winning streak credits `wager * sum(odds)` and records the reward.
4. Re-running settlement does not credit a second reward.
5. Refunded legs contribute zero to the additive odds.

Relevant backend tests will run first, followed by the backend suite. Existing unrelated baseline failures will be reported separately rather than hidden.
