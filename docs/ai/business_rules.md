# Business Logic & Core Rules
*Last Updated: 2026-05-15*

## 1. Pari-mutuel Betting Mechanism (Hệ thống dự đoán ăn chia)
- **Concept**: All spectator bet amounts go into a common `Total Pool`. The system subtracts a `House Edge` (Rake). The remaining `Pool Remainder` is divided among the winning tickets proportionally based on their original `bet_amount`.
- **Logic Flow** (Implemented at Spring Boot Service Layer):
  1. Race completes (`status = 'FINISHED'`).
  2. Transaction begins.
  3. Lock `user_wallets` rows (Pessimistic Read/Write) to prevent race conditions.
  4. Calculate `Total Pool` = `SUM(bet_amount)` from `predictions` where `race_id = X`.
  5. Apply House Edge: `Pool Remainder = Total Pool * (1 - Rake)`.
  6. Determine the winning participant from `race_results` (position = 1).
  7. Calculate `Total Winner Pool` = `SUM(bet_amount)` of correct predictions.
  8. Calculate `Payout Rate` = `Pool Remainder / Total Winner Pool`.
  9. Update correct predictions: `payout_amount = bet_amount * Payout Rate`, status = `WON`.
  10. Update incorrect predictions: status = `LOST`.
  11. Insert records into `wallet_transactions` (type: `BET_PAYOUT`) for winners.
  12. Add `payout_amount` to `user_wallets.balance`.
  13. Commit Transaction.

## 2. Wallet & Transaction Integrity
- A user's point/money balance can ONLY be modified if a corresponding `wallet_transactions` record is created in the exact same database transaction.
- Balances are constrained to `>= 0`.

## 3. Role Constraints
- Complex constraint: "1 User = 1 Role at a time".
- While the DB allows multiple entries in `user_roles`, the Application Service Layer will strictly enforce that assigning a new role will suspend/remove the previous role.
- All Role transitions must be audited in `user_role_history`.

## 4. Status Workflows
- Strict progression of status transitions (e.g., `DRAFT` -> `OPEN_REGISTRATION` -> `CLOSED` etc.). Validated in Backend logic, fortified by DB `CHECK` constraints.
