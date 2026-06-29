# Scope And Non-Goals

## 1. In Scope

### Identity and access

- User registration, email verification, login, refresh token, logout.
- JWT-based API authentication.
- Role request workflow for `HORSE_OWNER`, `JOCKEY`, and `REFEREE`.
- Multiple active personal roles on one account.
- Separate `ORGANIZER` business account model.
- Admin user management and role assignment history.

### Organization and organizer operations

- Organization application, KYB review, approval, rejection, suspension, and reactivation.
- Organizer tournament creation and submission for platform approval.
- Organizer tournament registration review, participant lock, race scheduling, referee contracts, result confirmation/reopen/publish flows.
- Admin governance over organizations and tournament launch approval.

### Racing operations

- Horse profile and document management.
- Admin approval/rejection of horses.
- Tournament lifecycle status management.
- Owner tournament registration and registration review.
- Jockey championship application, owner contract invitation, jockey contract response.
- Referee contract invitation, acceptance/decline, and termination.
- Race creation, race participant management, referee assignment.
- Referee pre-race checks, race start/finish, result draft/submission, incidents, violations, reports.

### Engagement and wallet

- Public blog browsing.
- Admin blog CRUD and publish workflow.
- Wallet balance, ledger, VNPay top-up, withdrawal request/review, saved bank accounts.
- Spectator prediction submission, quote, streak prediction, wallet-backed settlement, refund, payout.
- Leaderboard and notification surfaces.
- Admin prediction audit and settlement retry.

### Delivery evidence

- PostgreSQL Flyway migrations.
- Backend integration/unit tests.
- Frontend Vitest tests for API clients, routes, layouts, pages, wallet charts, and race-day state utilities.

## 2. Out Of Scope

- Native mobile app.
- Live video streaming or official timing hardware integration.
- Automated bank transfer payout after withdrawal approval.
- Full accounting-grade double-entry system accounts for platform revenue, prize escrow, and clearing accounts.
- Multi-member organization staff hierarchy; MVP keeps one organizer account per organization.
- Production AI model integration for race insights; current AI notes remain future/optional.
- Legal readiness for real-money gambling outside the demo/sandbox context.

## 3. Boundaries

- Official race truth comes from referee and organizer/admin result workflows, not spectator predictions.
- Prediction wagers use VND wallet balance and are settled from prediction rules in backend services.
- Legacy `point` naming may remain in a few prediction columns and compatibility DTO fields; business meaning is wallet money, not gamification points.
- Admin actions must remain auditable through persisted status, reviewer, timestamp, and history fields where implemented.
- File uploads are stored by backend upload services and referenced by URL/path in domain records.
