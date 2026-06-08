# Business Rules

## 1. Identity And Role Rules

- New users register through `/api/v1/auth/register` and must complete email verification before normal account use.
- Login creates an access token and refresh-token session.
- Refresh token is stored as an HTTP cookie configured by `app.auth.refresh-cookie-*`.
- Users can request role upgrades through `/api/v1/role-requests`.
- Admin can approve, reject, or pass CV review for role requests.
- Approved role requests become role assignments and should be visible in user role history.

## 2. Horse Rules

- A horse belongs to one owner.
- Owners can create horse profiles and upload evidence/documents.
- Horse status tracks admin review: `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`, `SUSPENDED`.
- Only valid/approved horses should be used for tournament participation workflows.
- Admin rejection must carry a reason where the UI requires one.

## 3. Tournament And Registration Rules

- Tournament dates must be valid: start date cannot be after end date.
- Registration window must start before it ends.
- Tournament capacity and per-owner limits are positive when configured.
- Owner tournament registration status is `PENDING`, `APPROVED`, `REJECTED`, or `WITHDRAWN`.
- Owners can withdraw pending registrations.
- Admin approves or rejects tournament registrations.

## 4. Championship Participation Rules

- Jockeys apply to championship/tournament pools.
- Jockey application status is `PENDING`, `APPROVED_FOR_POOL`, `REJECTED`, or `WITHDRAWN`.
- Owners can view approved jockey pool entries and send contract invitations.
- Jockey invitations/contracts can be `PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, and legacy database scripts also include `CANCELLED`.
- Admin can lock participants after eligible owner registrations and accepted jockey contracts.
- Locked participants become the source for race participant creation.

## 5. Race-Day Rules

- Referees can only operate assigned races.
- Race participants have verification/check status before the race.
- Referee workflow includes pre-check, start, finish, result entry, result submission, incidents, violations, and reports.
- Official results are separate from spectator predictions.
- Result status supports draft/review/publication style states such as `DRAFT`, `SUBMITTED`, `CONFIRMED`, `PUBLISHED`, and `REJECTED`.

## 6. Point Rules

- Point balances must never be negative.
- Point settings are configured by admins:
  - `FIRST_LOGIN_BONUS`
  - `BLOG_REWARD_POINTS`
  - `DAILY_BLOG_REWARD_LIMIT`
  - `PREDICTION_ENTRY_COST`
  - `PREDICTION_CORRECT_REWARD`
- Point transaction types include first login bonus, prediction entry, prediction reward, blog reward, race cancel refund, and admin adjustment.
- Transactions use reference type/reference id for idempotency where applicable.

## 7. Prediction Rules

- Prediction types are `WINNER` and `TOP3`.
- Predictions are submitted only for races open for prediction.
- A prediction charges the configured entry cost through point transactions.
- Prediction status can be `PENDING`, `LOCKED`, `CORRECT`, `INCORRECT`, `CANCELLED`, or `REFUNDED`.
- Top-3 predictions must reference distinct selected participants.
- Settlement is based on official race results and can be audited by admin.

## 8. Blog Reward Rules

- Admins create and publish blogs.
- Public users can view published blogs.
- Authenticated users can claim rewards for eligible blogs.
- Blog rewards track reading seconds and scroll percent.
- A user can claim at most one reward per blog.
- Daily blog reward totals are capped by `DAILY_BLOG_REWARD_LIMIT`.
- Reward claim outcomes are `CLAIMED`, `ALREADY_CLAIMED`, and `DAILY_LIMIT_REACHED`.
