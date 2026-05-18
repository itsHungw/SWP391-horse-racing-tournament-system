# Database Design

## 1. Current source of truth

The database structure is defined by:

- `database/001_create_tables.sql`

Seed data is defined separately by:

- `database/002_bootstrap_seed.sql`

Optional local/demo data lives in:

- `database/900_dev_seed.sql`

## 2. Main table groups

- identity and authorization,
- auth sessions and one-time tokens,
- profiles,
- horse and tournament,
- race operations,
- result and ranking,
- engagement and notifications,
- blog rewards.

## 3. Bootstrap vs dev seed

- bootstrap seed contains required roles and the default admin account,
- dev seed contains demo users, approved sample roles, profiles, and horses,
- production environments should not depend on dev seed data.

## 4. Virtual point model

The clean model uses:

- `user_point_accounts`,
- `point_transactions`,
- `race_predictions`,
- blog reward tables.

## 5. Prediction schema

The prediction model uses:

- `entry_cost_points`,
- `reward_points`,
- fixed reward rules,
- refund only when a race is cancelled.

The schema intentionally excludes:

- prediction pools,
- reward multipliers,
- system-retention calculations,
- user-to-user redistribution semantics.

## 6. Database-enforced invariants

- unique ownership and registration constraints,
- one pending role request per user and requested role,
- one pending jockey invitation per race and horse,
- distinct `TOP3` prediction picks,
- explicit lifecycle constraints,
- one-time blog reward claims,
- append-only point transaction history.

## 7. Application-enforced rules

- only open tournaments accept registrations,
- only the assigned referee submits results,
- predictions close before their deadline,
- rankings update only after official publication,
- anti-farming thresholds for blog rewards are checked by the backend.
