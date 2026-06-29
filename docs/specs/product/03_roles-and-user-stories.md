# Roles And User Stories

## 1. Public Visitor

- View the home page, championships, race cards/results, and leaderboard.
- Read published blogs.
- Open the join-us page and register an account.

Frontend routes: `/`, `/join-us`, `/championships`, `/championships/:id`, `/races`, `/races/:id`, `/leaderboard`, `/blogs`, `/blogs/:slug`, `/login`, `/register`, `/verify-email`.

## 2. Authenticated User

- View and update personal profile.
- View wallet balance, transactions, chart, top-up, withdrawals, and saved bank accounts.
- Submit role requests for owner, jockey, or referee.
- Track role request status and history.
- Apply for an organizer workspace only if the account has no active personal participation role.
- Switch dashboards from the profile pill when the account has multiple active roles.

Frontend routes: `/profile`, `/wallet`, `/my-role-requests`, `/organizer/register`.
Backend APIs: `/api/v1/me`, `/api/v1/users/me/profile`, `/api/v1/role-requests`, `/api/v1/wallet/*`, `/api/v1/organizations`.

## 3. Spectator

- View races open for prediction.
- Review prediction options and quote expected odds/payout.
- Submit `EXACT_POSITION`, `HEAD_TO_HEAD`, or streak wagers.
- View personal prediction history and wallet balance.
- Read published blogs without a reward-claim workflow.

Frontend route: `/spectator/predictions`.
Backend APIs: `/api/v1/races/open-for-prediction`, `/api/v1/races/{raceId}/prediction-options`, `/api/v1/predictions`, `/api/v1/predictions/quote`, `/api/v1/predictions/my`, `/api/v1/streak`, `/api/v1/point-accounts/me`.

## 4. Horse Owner

- Maintain owner profile.
- Add horses and upload horse documents.
- View horse detail and approval status.
- Register approved horses for tournaments.
- Withdraw pending tournament registrations.
- Review approved jockey pool and send contracts.

Frontend routes: `/owner/dashboard`, `/owner/horses`, `/owner/horses/:horseId`, `/owner/profile`, `/owner/registrations`.
Backend APIs: `/api/v1/owner/horses`, `/api/v1/owner/tournament-registrations`, `/api/v1/users/me/owner-profile`, `/api/v1/owner/championships/{championshipId}/jockey-pool`, `/api/v1/owner/championships/{championshipId}/contracts`.

## 5. Jockey

- View available championships.
- Apply to championship pools.
- Withdraw pending pool applications.
- Review and accept/reject owner contracts.
- View accepted participant records and racing schedule.

Frontend routes: `/jockey/dashboard`, `/jockey/championships`, `/jockey/contracts`, `/jockey/schedule`, `/jockey/profile`.
Backend APIs: `/api/v1/jockey/championships`, `/api/v1/jockey/championships/applications`, `/api/v1/jockey/contracts`, `/api/v1/jockey/participants`, `/api/v1/jockey/schedule`.

## 6. Referee

- Review and accept/decline organizer referee contracts.
- View assigned races.
- Inspect race detail and participants.
- Perform pre-race checks.
- Start and finish a race.
- Draft result packages and submit official results.
- Record incidents, violations, and referee reports.
- Review result history and profile dashboard.

Frontend routes: `/referee/dashboard`, `/referee/assigned-races`, `/referee/contracts`, `/referee/race-control`, `/referee/result-history`, `/referee/profile`, `/referee/races/:id/check`, `/referee/races/:id/results`, `/referee/races/:id/report`, `/referee/races/:id/officiate`.
Backend APIs: `/api/v1/referee/contracts`, `/api/v1/referee/races`, `/api/v1/referee/races/{raceId}/pre-checks`, `/api/v1/referee/races/{raceId}/start`, `/api/v1/referee/races/{raceId}/finish`, `/api/v1/referee/races/{raceId}/results`, `/api/v1/referee/races/{raceId}/results/submit`.

## 7. Organizer

- Register an organization and wait for admin approval.
- Manage organization profile after approval.
- Create tournaments, submit them for admin launch approval, and update tournament status.
- Review jockey applications and owner registrations for owned tournaments.
- Lock participants, create races, assign active contracted referees.
- Confirm, reopen, or publish race results.

Frontend routes: `/organizer`, `/organizer/tournaments`, `/organizer/tournaments/new`, `/organizer/registrations`, `/organizer/schedule`, `/organizer/officials`, `/organizer/results`, `/organizer/profile`, `/organizer/organization`.
Backend APIs: `/api/v1/organizations`, `/api/v1/organizer/*`.

## 8. Admin

- Review role requests and CV status.
- Manage users and roles.
- Review organization applications and organization status.
- Approve/reject horses.
- Manage tournaments and platform approval gates.
- Review owner tournament registrations where admin routes remain available.
- Manage blogs and publication status.
- Audit prediction races, prediction details, and settlement jobs.
- Review withdrawals and mark approved requests paid.

Frontend routes: `/admin`, `/admin/role-requests`, `/admin/organizations`, `/admin/users`, `/admin/users/:id`, `/admin/horses`, `/admin/tournament-registrations`, `/admin/tournaments`, `/admin/tournaments/:id`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/edit/:id`, `/admin/predictions`, `/admin/predictions/races/:raceId`, `/admin/withdrawals`.
Backend APIs: `/api/v1/admin/*`.
