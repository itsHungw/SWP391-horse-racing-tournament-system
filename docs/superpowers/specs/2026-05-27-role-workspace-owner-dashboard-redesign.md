# Role Workspace + Owner Dashboard Redesign

## Purpose

Redesign the app navigation so each user role has a clear workspace instead of mixing role-specific actions into the public header. The first deep implementation target is the Horse Owner workspace because it supports the current core flow:

1. Owner creates horse profile with evidence.
2. Admin reviews horse.
3. Owner registers approved horse into a tournament.
4. Admin reviews tournament registration.

Admin UI should not be redesigned broadly in this slice because the current dev branch already contains admin user CRUD and role request work. Admin should only receive the additional horse and tournament registration review entry points needed for the owner flow.

## Current Code Context

After pulling the latest dev branch:

- `frontend/src/routes/AppRouter.tsx` has `/owner`, `/jockey`, `/referee`, and `/spectator` pointing to generic `RoleDashboardPage` shell content.
- `frontend/src/components/client/ClientHeader.tsx` has public navigation plus a generic authenticated `Dashboard` link pointing to `/spectator`.
- `frontend/src/layouts/AdminLayout.tsx` is already a styled admin workspace with lucide icons and routes for overview, role requests, users, tournaments, races, predictions, blog, points, and settings.
- Backend already has basic horse, tournament, and race CRUD domains.
- Current backend horse admin create uses `HorseRequest.ownerId`, and `Horse.create(...)` defaults status to `APPROVED`, which is not correct for owner-submitted horses.
- Frontend does not yet have a dedicated `racingApi.ts` or owner horse/registration workspace pages on this branch.

## Scope

### In Scope

- Add an Owner workspace layout.
- Redirect `/owner` to `/owner/dashboard`.
- Add `/owner/dashboard` as a real overview page.
- Move horse stable management to `/owner/horses`.
- Move tournament registration to `/owner/registrations`.
- Keep public header focused on public navigation and one authenticated dashboard entry.
- Route authenticated dashboard entry to the most appropriate workspace based on user roles.
- Add frontend API/types needed by Owner workspace.
- Add or restore backend APIs needed by owner horse creation, admin horse review, owner tournament registration, and admin tournament registration review.
- Add admin navigation entries/pages for horse approvals and tournament registration approvals without redesigning existing admin user CRUD or role request UI.
- Add focused frontend and backend tests for routing, dashboard summary, owner horse creation, registration submission, and admin review flows.

### Out of Scope

- Full redesign of admin layout.
- Replacing admin user CRUD or role request pages.
- Full Spectator, Jockey, or Referee workspaces.
- Jockey invitation implementation.
- Race participant assignment.
- Referee pre-race checks.
- Results, rankings, prediction, blog rewards, or AI workflows.
- Multi-file `horse_documents` system.

## Navigation Design

### Public Header

Public header remains for guest and spectator discovery only.

Keep public nav:

- Home/logo
- Tournaments
- Races
- Results
- Blog
- Leaderboard

Do not add role-specific links such as Owner Horses, Admin Horses, Referee Checks, or Jockey Invitations to the public header.

Authenticated header should show:

- Dashboard
- Profile
- Logout

The `Dashboard` link should resolve by role priority:

1. `ADMIN` -> `/admin`
2. `HORSE_OWNER` -> `/owner/dashboard`
3. `JOCKEY` -> `/jockey/dashboard`
4. `REFEREE` -> `/referee/dashboard`
5. fallback -> `/spectator/dashboard`

If a user has multiple specialist roles, this first implementation uses the highest-priority route above. A role switcher dropdown can be added later.

### Role Routes

Create or reserve these routes:

- `/spectator` -> redirect `/spectator/dashboard`
- `/spectator/dashboard` -> reserved shell page with clear Coming Soon copy
- `/owner` -> redirect `/owner/dashboard`
- `/owner/dashboard` -> owner overview
- `/owner/horses` -> stable management
- `/owner/registrations` -> tournament registrations
- `/jockey` -> redirect `/jockey/dashboard`
- `/jockey/dashboard` -> reserved shell page with clear Coming Soon copy
- `/jockey/invitations` -> reserved shell page with clear Coming Soon copy
- `/jockey/races` -> reserved shell page with clear Coming Soon copy
- `/referee` -> redirect `/referee/dashboard`
- `/referee/dashboard` -> reserved shell page with clear Coming Soon copy
- `/referee/races` -> reserved shell page with clear Coming Soon copy
- `/referee/checks` -> reserved shell page with clear Coming Soon copy
- `/referee/results` -> reserved shell page with clear Coming Soon copy

Keep admin base behavior stable:

- `/admin` remains the current admin overview.
- Existing admin user CRUD and role request routes stay unchanged.
- Add `/admin/horses` and `/admin/tournament-registrations` to the current admin layout when the matching pages exist.

## Owner Workspace Layout

Create `OwnerLayout` as a role-specific workspace shell.

It should include:

- Header area with product/role identity.
- Sidebar or top workspace nav depending on viewport.
- Logout/profile access through the existing session behavior.
- Main content region for owner pages.

Owner nav:

- Dashboard -> `/owner/dashboard`
- My Horses -> `/owner/horses`
- Tournament Registrations -> `/owner/registrations`
- Jockey Invitations -> disabled nav item or reserved shell route for a later slice
- Results -> disabled nav item or reserved shell route for a later slice
- Profile -> `/profile`

The layout should be visually distinct from marketing pages and practical for repeated work:

- Dense but readable information.
- Tables/lists for operational records.
- Clear status badges.
- Minimal decoration.
- Professional spacing and accessible focus states.

## Owner Dashboard

`/owner/dashboard` is an overview only. It must not contain the full horse creation form.

It should answer:

- How many horses do I have?
- How many are approved, pending, or rejected?
- Are any tournaments open for registration?
- Which registrations are waiting for admin review?
- What should I do next?

Recommended sections:

### KPI Summary

- Total horses
- Approved horses
- Pending horse review
- Active/pending tournament registrations

### Next Actions

- Add Horse -> `/owner/horses`
- Register Tournament -> `/owner/registrations`
- Review rejected items -> filtered view or anchor when available

### Review Alerts

Show concise alerts for:

- Rejected horses with rejection reason.
- Rejected tournament registrations with rejection reason.
- No approved horses yet, when owner tries to register.

### Open Tournaments

Show a compact list of open tournaments:

- Name
- Location
- Registration deadline
- Capacity if available
- CTA to register

### Recent Registrations

Show recent owner registrations:

- Tournament
- Horse
- Status
- Rejection reason if present

## My Horses Page

`/owner/horses` owns horse stable management.

Owner can:

- Create a horse profile.
- View own horses.
- See `PENDING`, `APPROVED`, `REJECTED`, and `INACTIVE` states.
- Open horse image/evidence links.
- See rejection reason.

Create form fields:

Required:

- `name`
- `gender`
- `imageUrl`
- `evidenceUrl`

Optional:

- `registrationCode`
- `breed`
- `dateOfBirth`
- `color`
- `heightCm`
- `weightKg`
- `healthStatus`
- `medicalNote`
- `description`

Backend owner creation rules:

- Requires authenticated `HORSE_OWNER`.
- Must derive owner from JWT/current user.
- Must not accept `ownerId` from client.
- New owner-created horse status must be `PENDING`.
- `gender` must be `MALE` or `FEMALE`.
- `dateOfBirth` cannot be in the future.
- `heightCm` and `weightKg` must be positive when provided.

The existing admin horse CRUD can keep direct admin behavior, but owner horse creation must use a separate owner API or clearly separated service method so admin-created records do not weaken owner review rules.

## Owner Tournament Registrations Page

`/owner/registrations` owns tournament registration.

Owner can:

- View open tournaments.
- Select only own `APPROVED` horses.
- Submit a registration.
- Track registration status.
- Withdraw only own `PENDING` registrations.
- See rejection reason.

Submission rules:

- Current user must have `HORSE_OWNER`.
- Horse must belong to current user.
- Horse must be `APPROVED`.
- Tournament must be `OPEN_REGISTRATION`.
- Current time must be inside registration window.
- Horse must not already have a non-withdrawn registration for the tournament.
- Capacity checks count only `APPROVED` registrations.
- New registration status is `PENDING`.

Registration status values:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `WITHDRAWN`

Use `WITHDRAWN` for owner withdrawal. Reserve `CANCELLED` for tournament/race cancellation.

## Admin Integration

Do not redesign the admin workspace.

Keep:

- Existing `AdminLayout`.
- Existing `/admin`.
- Existing `/admin/users`.
- Existing `/admin/role-requests`.
- Existing teammate-owned admin pages.

Add only:

- `/admin/horses`
- `/admin/tournament-registrations`

Admin horse review page:

- List/filter horses by status.
- Show owner, horse details, image/evidence links.
- Approve only `PENDING` horses.
- Reject only `PENDING` horses with required reason.
- Disable review actions for non-pending states.

Admin tournament registration review page:

- List/filter registrations by status.
- Show owner, horse, tournament, note, evidence links.
- Approve only `PENDING` registrations.
- Reject only `PENDING` registrations with required reason.
- Disable review actions for non-pending states.

## Backend API Shape

Owner horse APIs:

- `GET /api/v1/owner/horses`
- `POST /api/v1/owner/horses`

Admin horse review APIs:

- `GET /api/v1/admin/horses?status=PENDING`
- `POST /api/v1/admin/horses/{id}/approve`
- `POST /api/v1/admin/horses/{id}/reject`

Owner tournament registration APIs:

- `GET /api/v1/owner/tournament-registrations`
- `POST /api/v1/owner/tournament-registrations`
- `POST /api/v1/owner/tournament-registrations/{id}/withdraw`

Admin tournament registration APIs:

- `GET /api/v1/admin/tournament-registrations?status=PENDING`
- `POST /api/v1/admin/tournament-registrations/{id}/approve`
- `POST /api/v1/admin/tournament-registrations/{id}/reject`

Public APIs for dashboard support:

- Existing `GET /api/v1/tournaments` should provide open tournaments.
- Existing public race/tournament APIs can remain as they are.

## Frontend API Shape

Create or restore a racing API module with typed functions:

- `getPublicTournaments`
- `getOwnerHorses`
- `createOwnerHorse`
- `getOwnerTournamentRegistrations`
- `createOwnerTournamentRegistration`
- `withdrawOwnerTournamentRegistration`
- `getAdminHorses`
- `approveAdminHorse`
- `rejectAdminHorse`
- `getAdminTournamentRegistrations`
- `approveAdminTournamentRegistration`
- `rejectAdminTournamentRegistration`

Types should live in a focused racing type module and include:

- `Horse`
- `HorsePayload`
- `HorseStatus`
- `Tournament`
- `TournamentRegistration`
- `TournamentRegistrationPayload`
- `TournamentRegistrationStatus`

## Error Handling

All owner/admin workflow errors should use the existing structured API error response and the frontend shared parser.

Important user-facing messages:

- Horse evidence is required.
- Horse image is required.
- Horse is not owned by current user.
- Horse must be approved before tournament registration.
- Tournament is not open for registration.
- Registration window is closed.
- Horse already has a tournament registration.
- Tournament is full.
- Only pending horses can be reviewed.
- Only pending registrations can be reviewed.
- Rejection reason is required.

## Testing Plan

### Frontend Tests

- Public header routes authenticated `Dashboard` to owner dashboard for `HORSE_OWNER`.
- `/owner` redirects to `/owner/dashboard`.
- Owner layout shows Dashboard, My Horses, Tournament Registrations, and Profile links.
- Owner dashboard renders KPI summary, open tournaments, pending/rejected alerts, and quick actions.
- Owner horses page creates a horse with image/evidence and shows pending status.
- Owner registrations page only lists approved horses in the selector.
- Owner registrations page submits a tournament registration and shows backend messages.
- Admin route additions do not break existing admin user CRUD/role request tests.

### Backend Tests

- Owner creates horse without sending ownerId and receives `PENDING`.
- Owner horse creation rejects missing image/evidence.
- Owner horse creation rejects invalid gender, future date of birth, and non-positive height/weight.
- Admin approves/rejects only pending horses.
- Owner registers only an approved own horse into an open tournament.
- Registration rejects unapproved horse, other owner's horse, closed registration window, duplicate registration, and full tournament.
- Owner withdraws only own pending registrations.
- Admin approves/rejects only pending tournament registrations.

## Implementation Order

1. Add frontend role dashboard route resolution helper.
2. Update public header dashboard link to use role-aware target.
3. Add `OwnerLayout`.
4. Add `/owner/dashboard`.
5. Move/create `/owner/horses`.
6. Move/create `/owner/registrations`.
7. Add frontend racing API/types.
8. Add backend owner horse APIs and evidence fields.
9. Add backend admin horse review APIs.
10. Add backend tournament registration entity/APIs if absent.
11. Add admin route/nav entries for horse approvals and tournament registrations.
12. Add focused frontend and backend tests.
13. Run backend tests, frontend tests, and frontend build.

## Acceptance Criteria

- Public header stays clean and does not expose role-specific operations directly.
- Authenticated `Dashboard` sends Horse Owner users to `/owner/dashboard`.
- `/owner` redirects to `/owner/dashboard`.
- Owner dashboard is an overview, not a form page.
- Owner horse creation lives under `/owner/horses`.
- Owner tournament registration lives under `/owner/registrations`.
- Owner-created horses are pending and require admin review.
- Admin UI remains compatible with existing user CRUD and role request work.
- Admin can review horse approvals and tournament registrations from the existing admin workspace.
- Tests and build pass after implementation.
