# Business Logic & Core Rules
*Last Updated: 2026-05-16*

## 1. Point-Based System & Virtual Economy
- **Concept**: The system operates entirely on a virtual **Points** economy. There is NO real money, NO deposits, and NO withdrawals.
- **Earning Points**: Users can only earn points by engaging with the platform, specifically by reading/scrolling through published Blogs.
- **Using Points**: Points are used exclusively for placing bets (predictions) on races.

## 2. Pari-mutuel Betting Mechanism (Hệ thống dự đoán ăn chia)
- **Concept**: All spectator bet amounts (in Points) go into a common `Total Pool`. The system subtracts a `House Edge` (Rake). The remaining `Pool Remainder` is divided among the winning tickets proportionally based on their original `bet_amount`.
- **Logic Flow (Placing a Bet)**:
  1. User submits a prediction.
  2. Transaction begins.
  3. Lock `user_wallets` for the user (Pessimistic Read/Write).
  4. Check if `balance >= bet_amount`. If not, abort (Throw Exception).
  5. Deduct `bet_amount` from `user_wallets.balance`.
  6. Insert record into `wallet_transactions` (type: `PLACE_BET`, amount: `bet_amount`, reference_type: `PREDICTIONS`, reference_id: `prediction_id`).
  7. Commit Transaction.
- **Logic Flow (Payout)** (Implemented at Spring Boot Service Layer):
  1. Race completes (`status = 'FINISHED'`) and results are published.
  2. Transaction begins.
  3. Lock `user_wallets` rows (Pessimistic Read/Write) for winners to prevent race conditions.
  4. Calculate `Total Pool` = `SUM(bet_amount)` from `predictions` where `race_id = X`.
  5. Apply House Edge: `Pool Remainder = Total Pool * (1 - Rake)`.
  6. Determine the winning participant from `race_results` (position = 1).
  7. Calculate `Total Winner Pool` = `SUM(bet_amount)` of correct predictions.
  8. Calculate `Payout Rate` = `Pool Remainder / Total Winner Pool`.
  9. Update correct predictions: `payout_amount = bet_amount * Payout Rate`, status = `WON`.
  10. Update incorrect predictions: status = `LOST`.
  11. Insert records into `wallet_transactions` (type: `BET_PAYOUT`, amount: `payout_amount`, reference_type: `PREDICTIONS`, reference_id: `prediction_id`) for winners.
  12. Add `payout_amount` to `user_wallets.balance`.
  13. Commit Transaction.

## 3. Blog Rewards Mechanism
- **Logic Flow**:
  1. User reads a blog to the end (trigger via frontend).
  2. Transaction begins.
  3. Check `user_blog_rewards` to ensure the user hasn't already claimed points for this `blog_id`. If they have, abort (Throw Exception).
  4. Insert record into `user_blog_rewards`.
  5. Lock `user_wallets` for the user.
  6. Add `blogs.reward_points` to `user_wallets.balance`.
  7. Insert record into `wallet_transactions` (type: `BLOG_REWARD`, amount: `reward_points`, reference_type: `BLOG`, reference_id: `blog_id`).
  8. Commit Transaction.

## 4. Wallet & Transaction Integrity
- A user's point balance can ONLY be modified if a corresponding `wallet_transactions` record is created in the exact same database transaction.
- Balances are constrained to `>= 0`.
- Transaction `amount` in `wallet_transactions` is always recorded as a positive absolute value; the `txn_type` determines whether it was an addition (e.g., `BET_PAYOUT`, `BLOG_REWARD`) or deduction (e.g., `PLACE_BET`).

## 5. Role Constraints
- Complex constraint: "1 User = 1 Role at a time".
- While the DB allows multiple entries in `user_roles`, the Application Service Layer will strictly enforce that assigning a new role will suspend/remove the previous role.
- All Role transitions must be audited in `user_role_history`.

## 6. Status Workflows
- Strict progression of status transitions (e.g., `DRAFT` -> `OPEN_REGISTRATION` -> `CLOSED` etc.). Validated in Backend logic, fortified by DB `CHECK` constraints.
