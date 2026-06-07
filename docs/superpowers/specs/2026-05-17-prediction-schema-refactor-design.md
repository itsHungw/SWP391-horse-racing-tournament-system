# Prediction Schema Refactor Design

## Goal

Refactor the prediction-related database schema so it matches the approved clean prediction game model:

- fixed entry cost,
- fixed reward,
- no prediction pool,
- no redistribution between users,
- no betting-like semantics.

## Approved behavior

- Users spend a fixed number of virtual points when submitting a prediction.
- Incorrect predictions lose the entry cost.
- Correct predictions receive a fixed reward defined by business rules.
- Cancelled races refund the entry cost.
- Points remain internal-only and have no real-money value.

## Recommended schema

### Keep

- `user_point_accounts`
- `point_transactions`
- `race_predictions`
- `ai_predictions`

### Remove

- `prediction_pools`
- `reward_multiplier`
- pool totals,
- system retention fields,
- pool redistribution semantics.

## `point_transactions`

Allowed transaction types:

- `PREDICTION_ENTRY`
- `PREDICTION_REWARD`
- `BLOG_REWARD`
- `RACE_CANCEL_REFUND`
- `ADMIN_ADJUSTMENT`

## `race_predictions`

Recommended fields:

- `race_id`
- `spectator_id`
- `prediction_type`
- predicted participant ids
- `entry_cost_points`
- `reward_points`
- `status`
- `locked_at`
- `evaluated_at`
- timestamps

Recommended statuses:

- `PENDING`
- `LOCKED`
- `CORRECT`
- `INCORRECT`
- `CANCELLED`
- `REFUNDED`

## Reward rules

| Prediction type | Result | Entry cost | Reward |
| --- | --- | ---: | ---: |
| WINNER | exact winner | 5 | 10 |
| TOP3 | exact order | 10 | 30 |
| TOP3 | correct participants, wrong order | 10 | 15 |

## Success criteria

1. The SQL script no longer defines `prediction_pools`.
2. The SQL script no longer uses `reward_multiplier` or retention fields.
3. Prediction tables and transaction types match the approved docs.
4. SQL comments describe a clean prediction game rather than a redistribution model.
