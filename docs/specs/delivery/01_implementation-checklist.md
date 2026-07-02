# Implementation Checklist

This checklist is written for report/demo preparation and source-code review.

## 1. Backend Checklist

- Auth APIs exist for register, verify email, resend verification, login, refresh, logout, forgot password, and reset password.
- JWT security filter and user details service are configured.
- CORS, refresh cookie, upload, mail, VNPay, wallet withdrawal, prediction limit, and rate-limit properties are externalized.
- User profile and role request APIs are implemented.
- Admin user and role request management APIs are implemented.
- Owner/referee profile APIs are implemented.
- Organization registration and admin organization review APIs are implemented.
- Organizer business-account separation is enforced against active personal-role accounts.
- Horse CRUD/review and owner horse/document APIs are implemented.
- Tournament CRUD/status APIs are implemented for admin and organizer flows.
- Owner/admin/organizer tournament registration workflows are implemented where source exposes them.
- Championship pool application, contract, participant lock, and workspace APIs are implemented.
- Referee contract invitation/accept/decline/terminate APIs are implemented.
- One-user-one-personal-participation-role-per-tournament guard is implemented across owner, jockey, and referee join flows.
- Race CRUD/status/referee assignment, organizer result operations, and jockey schedule APIs are implemented.
- Referee race-day operation APIs are implemented.
- Blog public/admin APIs are implemented.
- Wallet balance, transaction, top-up, withdrawal, and bank account APIs are implemented.
- Spectator prediction, quote, streak, and admin prediction audit APIs are implemented.
- Global exception handler exists.
- Database schema and Flyway migrations exist.

## 2. Frontend Checklist

- Public routes render home, championships, races, leaderboard, join-us, blogs, auth pages.
- Auth routes protect profile, wallet, role request history, and organizer registration.
- Role guards protect owner, jockey, referee, organizer, and admin workspaces.
- Profile pill shows wallet balance and dashboard switcher.
- Owner workspace contains dashboard, horses, horse detail, profile, registrations.
- Jockey workspace contains dashboard, championships, contracts, schedule, profile.
- Referee workspace contains dashboard, assigned races, contracts, race control, result history, profile, race operation pages.
- Organizer workspace contains dashboard, organization, tournaments, registrations, schedule, officials, results, profile.
- Admin workspace contains users, role requests, organizations, horses, tournament registrations, tournaments, blog, predictions, withdrawals.
- Wallet page loads balance, summary, performance chart with 1D/1W/1M/3M/All range controls, transactions, withdrawals, and bank accounts.
- Spectator prediction page loads races, options, wallet balance, prediction form, quote, and prediction history.
- Shared API client handles auth token and refresh behavior.
- Shared UI components cover badges, pagination, skeleton/loading, modals, and role request status.

## 3. Database Checklist

- Core identity tables exist.
- Role/profile tables exist.
- Organization/referee contract tables exist.
- Horse/tournament/race tables exist.
- Referee operation and result tables exist.
- Blog, wallet, prediction, streak, settlement, notification tables exist.
- Top-up, withdrawal, and bank account tables exist.
- Status constraints match documented lifecycle states where migrations define checks.
- Wallet transaction idempotency index exists.
- Prediction money columns are widened to `bigint`.
- Top-3 prediction columns are dropped.
- Flyway is enabled and points to `classpath:db/migration`.

## 4. Test Evidence Checklist

Backend tests include integration/unit coverage for:

- auth registration/login/entity mapping/email;
- security hardening, JWT service/filter, role authorization;
- user profile and role request workflows;
- organization onboarding and organizer separation;
- owner profile and horse workflows;
- tournament and tournament registration;
- tournament participation role conflict guard;
- championship participant/application/contract flows;
- referee contracts and race result validation;
- blog/admin blog workflows;
- wallet/top-up/withdrawal behavior where tests exist;
- spectator prediction DTO/admin prediction audit/settlement behavior;
- file storage security;
- global exception handling.

Frontend tests include coverage for:

- API clients and HTTP refresh behavior;
- auth session and role routing utilities;
- protected layouts/routes;
- profile pill dashboard switching and wallet balance display;
- admin role requests, users, organizations, horses, tournaments, blogs, predictions, withdrawals;
- owner horses, owner profile, owner registrations;
- jockey dashboard/championship/contracts/schedule;
- referee overview, contracts, pre-check, officiate, result submission, incident pages, race-day state;
- wallet page and performance chart;
- spectator blog and prediction components.

## 5. Demo Flow For Report

Recommended demo order:

1. Register and verify a user.
2. Complete profile and submit one or more personal role requests.
3. Admin approves role requests.
4. Show profile pill dashboard switching and wallet balance.
5. Register a separate organizer account or use an approved organizer.
6. Admin approves organization application.
7. Organizer creates/submits a tournament; admin approves launch.
8. Owner creates horse and admin approves it.
9. Owner registers horse for tournament.
10. Jockey applies to championship pool; organizer/admin approves pool application.
11. Owner sends contract and jockey accepts.
12. Organizer invites referee and referee accepts contract.
13. Organizer locks participants, creates/assigns race.
14. Referee performs race-day operations and submits results.
15. Organizer confirms/publishes results.
16. Spectator tops up wallet, submits prediction, then reviews settlement after results.
17. Admin audits predictions and withdrawals.

## 6. Known Documentation Boundary

Some historical design notes in `docs/superpowers` describe how features were planned. The canonical product/technical/report-facing documentation is in `docs/specs` and the current BA docs in `docs/ba`.
