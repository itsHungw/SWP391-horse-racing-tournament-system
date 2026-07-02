# Business Rules

## 1. Identity And Role Rules

- New users register through `/api/v1/auth/register` and must complete email verification before normal account use.
- Login creates an access token and refresh-token session.
- Refresh token is stored as an HTTP cookie configured by `app.auth.refresh-cookie-*`.
- Users can request personal participation roles through `/api/v1/role-requests`.
- Personal participation roles are `HORSE_OWNER`, `JOCKEY`, and `REFEREE`.
- One account may hold multiple active personal roles.
- `ORGANIZER` is a business role. Organizer accounts cannot request personal participation roles.
- Accounts with active personal participation roles cannot register or receive approval for an organization workspace.
- Admin can approve, reject, or pass CV review for role requests.
- Approved role requests become role assignments and should be visible in user role history.

## 2. Organization And Organizer Rules

- Organization applications are submitted by authenticated users through `/api/v1/organizations`.
- A user can have only one non-deleted organization record; rejected records are reused for resubmission.
- Organization statuses are `PENDING`, `ACTIVE`, `SUSPENDED`, and `REJECTED`.
- Admin approval grants the owner account the `ORGANIZER` role when the role exists in the role catalog.
- Organizers can operate only tournaments owned by their organization.
- New organizer-created tournaments belong to exactly one organization and go through the organizer/admin lifecycle.
- Suspended organizations remain visible for admin governance but should not be treated as active business workspaces.

## 3. Horse Rules

- A horse belongs to one owner.
- Owners can create horse profiles and upload evidence/documents.
- Horse status tracks admin review: `PENDING`, `APPROVED`, `REJECTED`, `INACTIVE`, `SUSPENDED`.
- Only valid/approved horses should be used for tournament participation workflows.
- Admin rejection must carry a reason where the UI requires one.

## 4. Tournament And Registration Rules

- Tournament dates must be valid: start date cannot be after end date.
- Registration window must start before it ends.
- Tournament capacity and per-owner limits are positive when configured.
- Owner tournament registration status is `PENDING`, `APPROVED`, `REJECTED`, or `WITHDRAWN`.
- Owners can withdraw pending registrations.
- Admin and organizer routes both exist in the source; organizer routes are the target workflow for organization-owned tournament operations.
- A user cannot participate in the same tournament under more than one personal participation role.
- Active owner participation means a `PENDING` or `APPROVED` owner registration.

## 5. Championship Participation Rules

- Jockeys apply to championship/tournament pools.
- Jockey application status is `PENDING`, `APPROVED_FOR_POOL`, `REJECTED`, or `WITHDRAWN`.
- Active jockey participation means a `PENDING` or `APPROVED_FOR_POOL` application, or an active locked participant record.
- Owners can view approved jockey pool entries and send contract invitations.
- Jockey invitations/contracts can be `PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, and legacy database scripts also include `CANCELLED`.
- Organizer/admin can lock participants after eligible owner registrations and accepted jockey contracts.
- Locked participants become the source for race participant creation.

## 6. Referee Rules

- A referee account must have the `REFEREE` role before it can receive or accept referee contracts.
- Referee contracts use statuses `PENDING`, `ACTIVE`, `DECLINED`, and `TERMINATED`.
- Active referee participation means an active referee contract for the tournament.
- A referee must have an active contract for the tournament before operating or being assigned to its races.
- Referees can only operate assigned races.

## 7. Race-Day Rules

- Race participants have verification/check status before the race.
- Referee workflow includes pre-check, start, finish, result entry, result submission, incidents, violations, and reports.
- Official results are separate from spectator predictions.
- Organizer result workflow can confirm, reopen, or publish race results.
- Result status supports draft/review/publication style states such as `DRAFT`, `SUBMITTED`, `CONFIRMED`, `PUBLISHED`, and `REJECTED`.

## 8. Wallet Rules

- Each user has one wallet row, created lazily when needed.
- Wallet balance is stored as integer VND.
- Wallet statuses are `ACTIVE` and `LOCKED`.
- Wallet balance must never become negative.
- Wallet writes go through `WalletService.adjust`, which uses an idempotency key of `(reference_type, reference_id, transaction_type)`.
- Wallet transactions store `amount`, `transaction_type`, optional reference, description, and `balance_after`.
- VNPay top-up is credited only after signature verification, amount matching, and successful response/status code.
- Withdrawal requests hold money immediately, can be approved/rejected/paid/cancelled, and refund the hold on rejection or user cancellation.

## 9. Prediction Rules

- Live single-race prediction types are `EXACT_POSITION` and `HEAD_TO_HEAD`.
- Streak predictions combine multiple legs into one accumulator ticket.
- Legacy `WINNER` rows may exist for settlement compatibility, but new submissions are rejected unless they use live types.
- `TOP3` has been removed from active source and migration `V18` drops its second/third selection columns.
- Predictions are submitted only for races open for prediction.
- New predictions charge the user's wallet with `BET_PLACED`.
- `PUT /api/v1/predictions/{id}` is intentionally rejected; predictions cannot be edited after placement.
- Prediction status can be `PENDING`, `LOCKED`, `CORRECT`, `INCORRECT`, `CANCELLED`, or `REFUNDED`.
- Settlement is based on official race results and can credit `BET_PAYOUT` or `BET_REFUND`.
- Admin can audit prediction races and retry failed settlement jobs.

## 10. Blog Rules

- Admins create and publish blogs.
- Public users can view published blogs.
- Current source does not implement blog reward claims, reading evidence, daily reward caps, or point rewards.
- Blog content is stored as rich/raw content and rendered by the frontend blog detail page, so content entry must remain an admin-trusted workflow until sanitization is added.
