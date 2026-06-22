# Roles And User Stories

## 1. Public Visitor

- View the home page and project information.
- Read published blogs.
- Open the join-us page and register an account.

Frontend routes: `/`, `/join-us`, `/blogs`, `/blogs/:slug`, `/login`, `/register`, `/verify-email`.

## 2. Authenticated User

- View and update personal profile.
- Submit role requests for owner, jockey, or referee.
- Track role request status and history.

Frontend routes: `/profile`, `/my-role-requests`.
Backend APIs: `/api/v1/me`, `/api/v1/users/me/profile`, `/api/v1/role-requests`.

## 3. Spectator

- View races open for prediction.
- Review prediction options.
- Submit or update predictions.
- View personal prediction history and point balance.
- Claim blog rewards after reading eligible content.

Frontend route: `/spectator/predictions`.
Backend APIs: `/api/v1/races/open-for-prediction`, `/api/v1/races/{raceId}/prediction-options`, `/api/v1/predictions`, `/api/v1/predictions/my`, `/api/v1/point-accounts/me`, `/api/v1/blogs/{slug}/claim-reward`.

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

- View assigned races.
- Inspect race detail and participants.
- Perform pre-race checks.
- Start and finish a race.
- Draft result packages and submit official results.
- Record incidents, violations, and referee reports.
- Review result history and profile dashboard.

Frontend routes: `/referee/dashboard`, `/referee/assigned-races`, `/referee/race-control`, `/referee/result-history`, `/referee/profile`, `/referee/races/:id/check`, `/referee/races/:id/results`, `/referee/races/:id/report`, `/referee/races/:id/officiate`.
Backend APIs: `/api/v1/referee/races`, `/api/v1/referee/races/{raceId}/pre-checks`, `/api/v1/referee/races/{raceId}/start`, `/api/v1/referee/races/{raceId}/finish`, `/api/v1/referee/races/{raceId}/results`, `/api/v1/referee/races/{raceId}/results/submit`.

## 7. Admin

- Review role requests and CV status.
- Manage users and roles.
- Approve/reject horses.
- Manage tournaments and tournament statuses.
- Review owner tournament registrations.
- Manage blogs and publication status.
- Configure point settings.
- Audit prediction races, prediction details, and settlement jobs.
- Review championship workspace, jockey pool applications, contracts, and participant locks through backend APIs.

Frontend routes: `/admin`, `/admin/role-requests`, `/admin/users`, `/admin/users/:id`, `/admin/horses`, `/admin/tournament-registrations`, `/admin/tournaments`, `/admin/tournaments/:id`, `/admin/blog`, `/admin/blog/new`, `/admin/blog/edit/:id`, `/admin/predictions`, `/admin/predictions/races/:raceId`, `/admin/points`.
Backend APIs: `/api/v1/admin/*`.
