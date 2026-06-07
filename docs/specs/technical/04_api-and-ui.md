# API and UI Contract

## 1. API groups

- `/api/auth/*`
- `/api/users/*`
- `/api/role-requests/*`
- `/api/horses/*`
- `/api/tournaments/*`
- `/api/races/*`
- `/api/jockey-invitations/*`
- `/api/referee/*`
- `/api/race-results/*`
- `/api/predictions/*`
- `/api/blogs/*`
- `/api/point-accounts/*`
- `/api/notifications/*`

## 2. Prediction-specific contract

- `POST /api/predictions`
- `PUT /api/predictions/{id}`
- `GET /api/predictions/my`
- `GET /api/point-accounts/me`

Prediction requests must include:

- race,
- type,
- selected participants,
- fixed entry cost calculated by server policy.

## 3. Main UI pages

- public home, tournament list/detail, race detail, rankings, blogs,
- auth pages,
- spectator profile, predictions, notifications, role requests,
- owner horse and registration pages,
- jockey invitation pages,
- referee race operation pages,
- admin management pages.

