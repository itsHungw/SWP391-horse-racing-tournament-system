# Frontend Architecture

## 1. Source Layout

```text
frontend/src
├── api/          HTTP clients per backend domain
├── assets/       static images
├── components/   shared UI components
├── hooks/        reusable React hooks
├── layouts/      app/admin/owner/jockey/referee layout shells
├── pages/        route-level pages by role/domain
├── routes/       route table and protected route guards
├── test/         shared test setup
├── types/        shared TypeScript API/domain types
├── utils/        validation, auth session, route helpers
└── styles.css
```

## 2. Layering

```text
Routes -> Layouts -> Pages -> Components/Hooks -> API clients -> Backend
```

- Routes decide page access and role protection.
- Layouts provide navigation shells for role workspaces.
- Pages compose workflows and own page-level state.
- Components render reusable UI pieces.
- Hooks encapsulate shared behavior.
- API clients perform HTTP calls and return typed data.
- Types mirror backend DTOs where needed.

## 3. Route Groups

Public and auth:

- `/`
- `/join-us`
- `/blogs`
- `/blogs/:slug`
- `/login`
- `/register`
- `/verify-email`

User:

- `/profile`
- `/my-role-requests`

Spectator:

- `/spectator/predictions`

Owner:

- `/owner/dashboard`
- `/owner/horses`
- `/owner/horses/:horseId`
- `/owner/profile`
- `/owner/registrations`

Jockey:

- `/jockey/dashboard`
- `/jockey/championships`
- `/jockey/contracts`
- `/jockey/schedule`
- `/jockey/profile`

Referee:

- `/referee/dashboard`
- `/referee/assigned-races`
- `/referee/race-control`
- `/referee/result-history`
- `/referee/profile`
- `/referee/races/:id/check`
- `/referee/races/:id/results`
- `/referee/races/:id/report`
- `/referee/races/:id/officiate`

Admin:

- `/admin`
- `/admin/role-requests`
- `/admin/users`
- `/admin/users/:id`
- `/admin/horses`
- `/admin/tournament-registrations`
- `/admin/tournaments`
- `/admin/tournaments/:id`
- `/admin/blog`
- `/admin/blog/new`
- `/admin/blog/edit/:id`
- `/admin/predictions`
- `/admin/predictions/races/:raceId`
- `/admin/points`

## 4. API Client Pattern

API clients live in `frontend/src/api` and call backend `/api/v1` endpoints through the shared Axios client. The shared client owns token attachment, refresh handling, and common error behavior.

Key clients:

- `authApi.ts`
- `profileApi.ts`
- `roleRequestApi.ts`
- `adminRoleRequestApi.ts`
- `adminUserApi.ts`
- `adminRaceApi.ts`
- `adminTournamentApi.ts`
- `adminPredictionApi.ts`
- `blogApi.ts`
- `pointSettingsApi.ts`
- `ownerProfileApi.ts`
- `racingApi.ts`
- `refereeApi.ts`

## 5. Testing Pattern

Frontend tests are colocated with pages, layouts, API clients, and utilities. They verify behavior such as protected route redirects, API request/response handling, form validation, race-day state transitions, pagination, and page rendering.
