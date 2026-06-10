# Admin Dashboard Overview Design

## Purpose

Give administrators a single landing view that summarizes the platform state:
headline metrics, the most recent pending role-request queue, and threshold-based
alerts. The dashboard is read-only and aggregates data already owned by other
modules.

This design covers only the aggregation endpoint and its response shape. It does
not add new persistence; it reads from existing role-request, tournament, user,
and blog repositories.

## Current Project Context

- Backend: Spring Boot under
  `backend/src/main/java/com/example/horseracingtournamentsystem`.
- Dashboard package: `dashboard/` (`controller`, `service`, `dto`).
- Data sources: `user/repository/RoleRequestRepository`,
  `tournament/repository/TournamentRepository`, `user/repository/UserRepository`,
  `blog/repository/BlogRepository`.
- Frontend: admin overview page under `frontend/src/pages/admin`.

## API

- `GET /api/v1/admin/dashboard` — admin only (`hasRole('ADMIN')`). Returns
  `AdminDashboardResponse`.

## Response Shape

`AdminDashboardResponse`:

- `metrics` (`DashboardMetrics`): four metric pairs, each a count plus a short
  detail string.
  - `pendingRoleRequests` — count of role requests in `PENDING`.
  - `upcomingTournaments` — count of non-deleted tournaments in
    `DRAFT`, `OPEN_REGISTRATION`, `SCHEDULE_PUBLISHED`, or `PARTICIPANTS_LOCKED`.
  - `activeUsers` — count of non-deleted users in `ACTIVE`.
  - `blogDrafts` — count of blogs in `DRAFT`.
- `queueRows` (`List<DashboardQueueRow>`): the top 5 pending role requests, newest
  first (id, name, email, requested role, submitted date `MMM dd, yyyy`, status).
- `alerts` (`List<String>`): threshold messages generated on the fly.

## Alert Rules

Computed in `AdminDashboardService.getDashboardData`:

- Pending role requests `> 5` → high-volume warning.
- Blog drafts `> 10` → backlog warning.
- Upcoming tournaments `== 0` → prompt to create one.

## Notes

- The whole read runs in a single read-only transaction.
- Counts use status- and soft-delete-aware repository queries
  (`...AndDeletedAtIsNull`) so soft-deleted rows are excluded.
- Detail strings and the date format are presentation hints returned by the
  backend to keep the admin overview page thin.
