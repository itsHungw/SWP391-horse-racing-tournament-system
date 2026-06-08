# Database Design

## 1. Database Sources

The project targets SQL Server.

Source files:

- `backend/src/main/resources/schema.sql`: authoritative legacy schema used by current source context.
- `backend/src/main/resources/db/migration/V1__baseline_schema.sql`: Flyway baseline marker.
- `backend/src/main/resources/db/migration/V2__blog_and_point_foundation.sql`: current idempotent migration for blog and point foundation.
- `database/001_create_tables.sql`: full initial schema script.
- `database/002_bootstrap_seed.sql`: role/admin seed.
- `database/003_auth.sql`: auth session and token tables.
- `database/004_owner_profile.sql`: owner profile extension.
- `database/004_create_blogs_table.sql`: legacy blog table script.
- `database/900_dev_seed.sql`: development seed data.

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

### Engagement and points

- `blogs`
- `user_blog_rewards`
- `user_daily_point_limits`
- `user_point_accounts`
- `point_transactions`
- `point_settings`
- `race_predictions`
- `prediction_settlement_jobs`
- `ai_predictions`
- `notifications`

## 3. Key Integrity Rules

- User, role, horse, tournament, race, result, point, and prediction statuses are constrained by `CHECK` constraints in SQL scripts.
- Point balance cannot be negative.
- Point transactions support reference type/reference id for idempotent business operations.
- Blog reward claims are unique per user/blog.
- Daily point limits are unique per user/date.
- Top-3 prediction selections must be distinct.
- Race result positions and time/penalty values must be positive/non-negative where required.
- Tournament date and registration windows are validated by schema and service logic.

## 4. Migration Strategy

Current Flyway setup:

- `V1` is a baseline marker for deployments that already use the legacy schema.
- `V2` is intentionally idempotent because development databases may already contain some blog/point structures from manual scripts.

For future work:

- Prefer new incremental `V3+` migrations.
- Avoid editing old migrations once shared.
- Keep `schema.sql` and docs synchronized until the project fully moves to incremental Flyway-only DDL.

## 5. Report Summary

The database design is relational and normalized around business ownership:

- users own profiles, roles, role requests, point accounts, predictions, and rewards;
- owners own horses and registration requests;
- tournaments own races and participant structures;
- referees create operational records and results;
- point ledger records explain all balance changes.
