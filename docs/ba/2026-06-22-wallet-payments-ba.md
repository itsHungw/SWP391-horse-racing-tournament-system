# BA - Wallet, Top-Up, Withdrawals, And Prediction Money

Updated: 2026-06-29
Status: source-aligned as-built specification

## 1. Business Context

The active product no longer uses a gamified point economy for blog rewards or prediction entry costs. The system uses a VND wallet for prediction wagers, top-up, withdrawal review, and wallet balance display.

The wallet implementation is suitable for demo/sandbox operation:

- integer VND amounts;
- one wallet per user;
- append-only transaction log;
- idempotent wallet operations by business reference;
- VNPay payment URL and verified return/IPN processing;
- manual withdrawal review.

It is not a full accounting platform yet: no system accounts, no double-entry balancing, no prize escrow, no automatic bank payout, no cash/winnings split.

## 2. Actors And Money Actions

| Actor | Can top up | Can wager | Can request withdrawal | Can review withdrawal |
| --- | --- | --- | --- | --- |
| Spectator/auth user | Yes | Yes | Yes | No |
| Owner | Yes | Yes if using prediction flows | Yes | No |
| Jockey | Yes | Yes if using prediction flows | Yes | No |
| Referee | Yes | Yes if using prediction flows | Yes | No |
| Organizer | Yes | Yes if using prediction flows | Yes | No |
| Admin | As user account | As user account | As user account | Yes |

## 3. Wallet Model

Current tables:

- `wallets`: `user_id`, `balance`, `status`, `updated_at`.
- `wallet_transactions`: `user_id`, `amount`, `transaction_type`, `reference_type`, `reference_id`, `balance_after`, `description`, `created_at`.
- `topup_orders`: VNPay order state and references.
- `withdrawal_requests`: manual withdrawal state and review metadata.
- `bank_accounts`: saved payout destinations.

Wallet statuses:

- `ACTIVE`
- `LOCKED`

Wallet transaction types:

- `TOPUP`
- `BET_PLACED`
- `BET_PAYOUT`
- `BET_REFUND`
- `WITHDRAWAL_HOLD`
- `WITHDRAWAL_REFUND`
- `ADMIN_ADJUSTMENT`

## 4. Core Rules

- Every user has at most one wallet row.
- Missing wallet rows are created lazily.
- Balance is integer VND and cannot become negative.
- Wallet writes go through `WalletService.adjust`.
- Wallet row is locked during adjustment to avoid concurrent lost updates.
- A locked wallet cannot be adjusted.
- Idempotency is enforced by `(reference_type, reference_id, transaction_type)` when a reference id is present.
- `balance_after` is stored on each wallet transaction for audit.

Source mapping:

- `wallet/entity/Wallet.java`
- `wallet/entity/WalletTransaction.java`
- `wallet/service/WalletService.java`
- `db/migration/V12__wallet_core_rename.sql`

## 5. Top-Up Flow

```text
User requests top-up -> backend creates topup order -> backend returns signed VNPay URL
VNPay return/IPN -> backend verifies signature -> backend checks amount/status
success -> wallet TOPUP credit
failure -> order FAILED, no wallet credit
```

Rules:

- VNPay must be configured; otherwise top-up returns service unavailable.
- Amount must be between configured `vnpay.min-amount` and `vnpay.max-amount`.
- Credit happens only after signature verification and successful VNPay response/status code.
- Repeat return/IPN for a successful order is idempotent.

Source mapping:

- `wallet/controller/TopUpController.java`
- `wallet/service/TopUpService.java`
- `wallet/service/VNPayService.java`
- `wallet/config/VNPayProperties.java`
- `db/migration/V13__topup_orders.sql`

## 6. Withdrawal Flow

```text
User creates request -> wallet WITHDRAWAL_HOLD debit
Admin approves -> status APPROVED
Admin marks paid -> status PAID
Admin rejects OR user cancels -> wallet WITHDRAWAL_REFUND credit
```

Rules:

- Withdrawal can be disabled with `wallet.withdrawal.enabled`.
- Minimum amount is configured by `wallet.withdrawal.min-amount`.
- Bank information is required.
- Creating a request holds the wallet amount immediately.
- Rejection requires review handling and refunds the hold.
- User cancellation is allowed only for the request owner and refunds the hold.
- Marking paid does not create a new wallet transaction because the hold already removed spendable balance.

Source mapping:

- `wallet/controller/WithdrawalController.java`
- `wallet/controller/AdminWithdrawalController.java`
- `wallet/service/WithdrawalService.java`
- `db/migration/V14__withdrawal_requests.sql`
- `db/migration/V16__withdrawal_cancelled_status.sql`

## 7. Prediction Money Flow

Single-race predictions:

- accepted types: `EXACT_POSITION`, `HEAD_TO_HEAD`;
- `TOP3` is removed;
- legacy `WINNER` can exist for old rows but is not a new-submit market;
- minimum/maximum wager and payout caps are configured under `app.prediction.*`;
- placing a prediction debits wallet with `BET_PLACED`;
- settlement credits `BET_PAYOUT` or `BET_REFUND`.

Streak predictions:

- multi-leg accumulator ticket;
- placing a ticket debits wallet with `BET_PLACED`;
- settlement pays/refunds through wallet transactions.

Source mapping:

- `prediction/service/PredictionService.java`
- `prediction/service/StreakPredictionService.java`
- `prediction/scheduler/PredictionSettlementScheduler.java`
- `wallet/service/WalletService.java`
- `db/migration/V17__widen_prediction_money_to_bigint.sql`
- `db/migration/V18__drop_top3_prediction_columns.sql`

## 8. Compatibility Notes

- `GET /api/v1/point-accounts/me` still exists as a compatibility endpoint and returns wallet balance in a `pointBalance` field.
- Prediction columns such as `entry_cost_points` and `reward_points` are legacy names. Current semantics are wager and reward amounts in VND.
- Blog reward claim and point settings were removed by migration `V11__remove_gamification.sql`.

## 9. Open Gaps Before Production Finance

- No double-entry ledger or system accounts.
- No separate cash/winnings balances.
- No automated bank payout integration.
- No KYC/AML workflow beyond saved bank-account/request metadata.
- No organizer prize purse escrow or referee fee payment.
- No accounting reconciliation reports.
- Legal review is required before any real-money gambling or withdrawal of betting winnings outside a sandbox/demo context.

## 10. Account Enforcement And Funds

- Account status and wallet status are separate controls. Suspending or banning an account does not transfer, confiscate, or erase its balance.
- A suspended or banned user may review wallet history and use the withdrawal-resolution flow when the wallet remains active.
- A locked wallet rejects new user/business movements such as top-up, bet placement, and withdrawal hold.
- A locked wallet still accepts system credits for `BET_PAYOUT`, `BET_REFUND`, and `WITHDRAWAL_REFUND`. This preserves money already owed while financial review is in progress.
- Existing withdrawal requests remain reviewable after an account status change.
