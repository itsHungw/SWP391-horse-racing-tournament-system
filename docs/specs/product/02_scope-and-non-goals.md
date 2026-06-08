# Scope And Non-Goals

## 1. In Scope

### Identity and access

- User registration, email verification, login, refresh token, logout.
- JWT-based API authentication.
- Role request workflow for `HORSE_OWNER`, `JOCKEY`, and `REFEREE`.
- Admin user management and role assignment history.

### Racing operations

- Horse profile and document management.
- Admin approval/rejection of horses.
- Tournament CRUD and lifecycle status management.
- Owner tournament registration and admin registration review.
- Jockey championship application, owner contract invitation, jockey contract response.
- Race creation, race participant management, referee assignment.
- Referee pre-race checks, race start/finish, result draft/submission, incidents, violations, reports.

### Engagement

- Public blog browsing.
- Admin blog CRUD and publish workflow.
- Blog reward claim with reading/scroll evidence.
- User point account and point transactions.
- Admin point setting management.
- Spectator prediction submission/update/history.
- Admin prediction audit and settlement retry.

### Delivery evidence

- SQL Server schema and Flyway migration.
- Backend integration/unit tests.
- Frontend Vitest tests for API clients, routes, layouts, pages, and race-day state utilities.

## 2. Out Of Scope

- Real-money betting, deposits, withdrawals, cash conversion, odds, and payout pools.
- Live video streaming or official timing hardware integration.
- Payment gateway integration.
- Native mobile app.
- Full notification delivery channel beyond schema-level and UI placeholders.
- Production AI model integration for race insights; current docs keep this as a future/optional layer.

## 3. Boundaries

- Official race truth comes from referee/admin workflows, not spectator predictions.
- Prediction points are internal engagement points only.
- Admin actions must remain auditable through persisted status, reviewer, timestamp, and history fields where implemented.
- File uploads are stored by backend upload services and referenced by URL/path in domain records.
