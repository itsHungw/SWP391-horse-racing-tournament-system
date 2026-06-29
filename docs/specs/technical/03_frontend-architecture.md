# Frontend Architecture

## 1. Source Layout

```text
frontend/src
|-- api/          HTTP clients per backend domain
|-- assets/       static images
|-- components/   shared UI components
|-- hooks/        reusable React hooks
|-- layouts/      app/admin/owner/jockey/referee/organizer layout shells
|-- pages/        route-level pages by role/domain
|-- routes/       route table and protected route guards
|-- test/         shared test setup
|-- types/        shared TypeScript API/domain types
|-- utils/        validation, auth session, route helpers
`-- styles.css
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
- `/championships`
- `/championships/:id`
- `/races`
- `/races/:id`
- `/leaderboard`
- `/blogs`
- `/blogs/:slug`
- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`

User:

- `/profile`
- `/wallet`
- `/my-role-requests`
- `/organizer/register`

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
- `/referee/contracts`
- `/referee/race-control`
- `/referee/result-history`
- `/referee/profile`
- `/referee/races/:id/check`
- `/referee/races/:id/results`
- `/referee/races/:id/report`
- `/referee/races/:id/officiate`

Organizer:

- `/organizer`
- `/organizer/tournaments`
- `/organizer/tournaments/new`
- `/organizer/registrations`
- `/organizer/schedule`
- `/organizer/officials`
- `/organizer/results`
- `/organizer/profile`
- `/organizer/organization`

Admin:

- `/admin`
- `/admin/role-requests`
- `/admin/organizations`
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
- `/admin/withdrawals`

## 4. API Client Pattern

API clients live in `frontend/src/api` and call backend `/api/v1` endpoints through the shared Axios client. The shared client owns token attachment, refresh handling, and common error behavior.

Key clients:

- `authApi.ts`
- `profileApi.ts`
- `roleRequestApi.ts`
- `adminRoleRequestApi.ts`
- `adminUserApi.ts`
- `organizationApi.ts`
- `organizerApi.ts`
- `walletApi.ts`
- `predictionApi.ts`
- `adminPredictionApi.ts`
- `blogApi.ts`
- `ownerProfileApi.ts`
- `racingApi.ts`
- `refereeApi.ts`

## 5. Header And Dashboard Switching

The public/client header is the main workspace switcher:

- profile pill shows user identity and wallet balance;
- dropdown shows the current dashboard first;
- personal dashboards are grouped separately from the organizer dashboard;
- a user can hold multiple personal roles and choose the matching dashboard;
- organizer appears only for accounts with the `ORGANIZER` role, while non-organizers can open the organizer registration route.

## 6. Testing Pattern

Frontend tests are colocated with pages, layouts, API clients, and utilities. They verify behavior such as protected route redirects, API request/response handling, form validation, wallet chart behavior, role dashboard switching, race-day state transitions, pagination, and page rendering.
