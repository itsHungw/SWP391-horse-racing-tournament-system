# Business Rules

## 1. User and role rules

- New users receive `SPECTATOR`.
- Extra roles require admin approval.
- A user may hold multiple roles.
- Duplicate active roles are not allowed.
- Duplicate pending requests for the same role are not allowed.

## 2. Horse rules

- Only active owners can create horses.
- Owners manage only their own horses.
- Horses must be approved before tournament registration.
- Soft deletion is used for horses.

## 3. Tournament rules

- `start_date <= end_date`.
- Registration window must open before it closes.
- Only `OPEN_REGISTRATION` tournaments accept registrations.
- Tournament status changes follow the approved lifecycle.

## 4. Race rules

- A race belongs to exactly one tournament.
- A horse may appear only once per race.
- A jockey may ride only one horse per race.
- Start numbers and lane numbers must be unique within a race.
- Race status changes follow the approved lifecycle.

## 5. Invitation rules

- Only the owner of a horse may invite a jockey for that horse.
- A jockey must be approved and available.
- Only one pending invitation may exist for the same horse in the same race.
- Accepted invitation creates or updates the race participant assignment.

## 6. Result and ranking rules

- Only the assigned referee submits results.
- Admin confirmation is required before publication.
- Rankings update only from published official results.
- Official rankings are independent from the spectator prediction leaderboard.

## 7. Prediction game rules

- Predictions are allowed only before the deadline.
- Each prediction uses a fixed system-defined entry cost.
- A user may submit at most one prediction per race and prediction type.
- `TOP3` picks must be distinct.
- Rewards are fixed by rule, not by pool distribution.
- If a race is cancelled, the entry cost is refunded.

## 8. Notification rules

Notifications are generated for:

- role approval decisions,
- horse approval decisions,
- tournament registration decisions,
- jockey invitation activity,
- result publication,
- prediction evaluation,
- blog reward claims.

