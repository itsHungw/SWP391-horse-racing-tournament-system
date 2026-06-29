# Database Design

## 1. Database Sources

The active backend configuration uses PostgreSQL:

- `backend/src/main/resources/application.yml`: `org.postgresql.Driver`.
- `backend/pom.xml`: PostgreSQL driver and Flyway PostgreSQL support.
- `backend/src/main/resources/db/migration`: Flyway migrations `V1` through `V18`.

Important migration milestones:

- `V1__baseline.sql`: baseline schema generated from the earlier JPA model.
- `V7__organizer_schema.sql`: organizations, referee contracts, tournament organization ownership, organizer role seed.
- `V8__organizer_kyb_idempotency.sql`: one active organization per owner account.
- `V9__notifications.sql`: notifications.
- `V11__remove_gamification.sql`: removes blog reward and point setting tables.
- `V12__wallet_core_rename.sql`: renames point-account tables to wallet tables and introduces wallet money transaction types.
- `V13__topup_orders.sql`: VNPay top-up orders.
- `V14__withdrawal_requests.sql` and `V16__withdrawal_cancelled_status.sql`: withdrawal workflow.
- `V15__bank_accounts.sql`: saved payout accounts.
- `V17__widen_prediction_money_to_bigint.sql`: money columns widened to `bigint`.
- `V18__drop_top3_prediction_columns.sql`: removes legacy Top-3 prediction selections.

Legacy scripts under `database/` are historical bootstrap/reference scripts. Use Flyway migrations as the source of truth for current runtime schema.

## 2. Table Groups

### Identity and roles

- `users`
- `roles`
- `user_roles`
- `user_role_history`
- `role_requests`
- `auth_sessions`
- `email_verification_tokens`
- `password_reset_tokens`

### Profiles

- `horse_owner_profiles`
- `jockey_profiles`
- `referee_profiles`

### Organization and governance

- `organizations`
- `referee_contracts`
- `notifications`

### Racing

- `horses`
- `horse_documents`
- `tournaments`
- `tournament_prize_tiers`
- `tournament_registrations`
- `jockey_tournament_applications`
- `jockey_invitations`
- `tournament_participants`
- `races`
- `race_participants`
- `pre_race_checks`
- `violations`
- `referee_reports`
- `race_results`
- `tournament_rankings`

### Wallet, prediction, and content

- `wallets`
- `wallet_transactions`
- `topup_orders`
- `withdrawal_requests`
- `bank_accounts`
- `race_predictions`
- `prediction_settlement_jobs`
- `streak_predictions`
- `streak_prediction_legs`
- `blogs`
- `ai_predictions`

## 3. Key Integrity Rules

- User, role, horse, tournament, race, result, organization, wallet, withdrawal, and prediction statuses are constrained by application enums and database checks where migrations define them.
- Wallet balance cannot be negative at service level.
- Wallet transactions are idempotent by `(reference_type, reference_id, transaction_type)` when a reference id is present.
- Top-up orders are unique by VNPay transaction reference.
- Withdrawal requests move through `REQUESTED`, `APPROVED`, `REJECTED`, `PAID`, and `CANCELLED`.
- Organization owner idempotency is enforced by a unique active-owner index.
- Top-3 prediction columns were dropped; live single-race markets are exact position and head-to-head.
- Prediction money columns use `bigint`; odds use numeric precision after `V17`.
- Tournament date and registration windows are validated by schema and service logic.

## 4. Migration Strategy

Current Flyway setup:

- `V1` creates the baseline schema.
- `V2+` are incremental migrations.
- Tests use H2/create-drop behavior where configured, while runtime migrations target PostgreSQL.

For future work:

- Add new incremental `V19+` migrations.
- Avoid editing old migrations once shared.
- Keep JPA entities, migrations, and docs synchronized.
- If renaming legacy `points` columns in prediction tables, provide a forward migration and DTO compatibility plan.

## 5. Report Summary

The database design is relational and normalized around business ownership:

- users own profiles, roles, role requests, wallets, predictions, withdrawals, saved bank accounts, and notifications;
- organizations own tournaments and organizer workflows;
- owners own horses and registration requests;
- tournaments own race schedules, participant structures, referee contracts, predictions, and results;
- wallet ledger records explain all money changes.
