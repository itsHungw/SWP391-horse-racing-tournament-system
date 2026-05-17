# Database Design

## 1. Current source of truth

The newest database definition is `database/001_create_tables.sql`.

## 2. Main table groups

- identity,
- profiles,
- horse and tournament,
- race operations,
- result and ranking,
- engagement and notifications,
- blog rewards.

## 3. Virtual point model

The clean model should use:

- `user_point_accounts`,
- `point_transactions`,
- `race_predictions`,
- blog reward tables.

## 4. Prediction schema

The prediction model uses:

- `entry_cost_points`,
- `reward_points`,
- fixed reward rules,
- refund only when a race is cancelled.

The refactored schema intentionally excludes:

- prediction pools,
- reward multipliers,
- system-retention calculations,
- user-to-user redistribution semantics.

## 5. Integrity themes

- unique ownership and registration constraints,
- explicit lifecycle constraints,
- published results as the only ranking source,
- one-time blog reward claims,
- append-only point transaction history.
