# Implementation Checklist

This checklist is written for report/demo preparation and source-code review.

## 1. Backend Checklist

- Auth APIs exist for register, verify email, resend verification, login, refresh, and logout.
- JWT security filter and user details service are configured.
- CORS, refresh cookie, upload, mail, and rate limit properties are externalized.
- User profile and role request APIs are implemented.
- Admin user and role request management APIs are implemented.
- Owner/referee profile APIs are implemented.
- Horse CRUD/review and owner horse/document APIs are implemented.
- Tournament CRUD/status APIs are implemented.
- Owner/admin tournament registration APIs are implemented.
- Championship pool application, contract, participant lock, and workspace APIs are implemented.
- Race CRUD/status/referee assignment and jockey schedule APIs are implemented.
- Referee race-day operation APIs are implemented.
- Blog public/admin and reward claim APIs are implemented.
- Point settings and point account/transaction services are implemented.
- Spectator prediction and admin prediction audit APIs are implemented.
- Global exception handler exists.
- Database schema and Flyway migrations exist.

## 2. Frontend Checklist

- Public routes render home, join-us, blogs, auth pages.
- Auth routes protect profile and role request history.
- Role guards protect owner, jockey, referee, and admin workspaces.
- Owner workspace contains dashboard, horses, horse detail, profile, registrations.
- Jockey workspace contains dashboard, championships, contracts, schedule, profile.
- Referee workspace contains dashboard, assigned races, race control, result history, profile, race operation pages.
- Admin workspace contains users, role requests, horses, tournament registrations, tournaments, blog, predictions, point settings.
- Spectator prediction page loads races, options, point account, prediction form, community choices, and prediction history.
- Shared API client handles auth token and refresh behavior.
- Shared UI components cover badges, pagination, skeleton/loading, modals, and role request status.

## 3. Database Checklist

- Core identity tables exist.
- Role/profile tables exist.
- Horse/tournament/race tables exist.
- Referee operation and result tables exist.
- Blog, point, prediction, settlement tables exist.
- Status constraints match documented lifecycle states.
- Point balances and transaction values are constrained.
- Flyway is enabled and points to `classpath:db/migration`.
- `V1` baseline and `V2` blog/point migration exist.

## 4. Test Evidence Checklist

Backend tests include integration/unit coverage for:

- auth registration/login/entity mapping/email;
- security hardening, JWT service/filter, role authorization;
- user profile and role request workflows;
- owner profile and horse workflows;
- tournament and tournament registration;
- championship participant/application/contract flows;
- race and referee result validation;
- blog/admin blog/reward workflows;
- point settings;
- spectator prediction DTO/admin prediction audit;
- file storage security;
- global exception handling.

Frontend tests include coverage for:

- API clients and HTTP refresh behavior;
- auth session and role routing utilities;
- protected layouts/routes;
- admin role requests, users, horses, tournaments, blogs, predictions, points;
- owner horses, owner profile, owner registrations;
- jockey dashboard/championship/contracts/schedule;
- referee overview, pre-check, officiate, result submission, incident pages, race-day state;
- spectator blog and prediction components.

## 5. Demo Flow For Report

Recommended demo order:

1. Register and verify a user.
2. Submit a role request.
3. Admin approves the role request.
4. Owner creates horse and admin approves it.
5. Admin creates tournament.
6. Owner registers horse for tournament and admin approves.
7. Jockey applies to championship, admin approves pool application.
8. Owner sends contract and jockey accepts.
9. Admin locks participants and creates/assigns race.
10. Referee performs race-day operations and submits results.
11. Spectator reads blog, claims reward, and submits prediction.
12. Admin audits predictions and point settings.

## 6. Known Documentation Boundary

Some historical design notes in `docs/superpowers` describe how features were planned. The canonical product/technical/report-facing documentation is in `docs/specs`.
