# Spec: Admin Tournament CRUD & Lifecycle Management

## Overview
This design specification defines the implementation of a comprehensive Tournament Administration panel in the Horse Racing Tournament System.
It allows administrators to create, update, delete, and control the lifecycle status of tournaments. The design implements **Option B (Separate List and Details Page)** for a clean, professional, and future-proof administrative workspace.

---

## User Review Required

> [!IMPORTANT]
> **Tournament Lifecycle Locking**: Once a tournament's status is changed to `ONGOING` or `COMPLETED`, editing its primary fields (name, dates, registration parameters, location, etc.) and deleting it are blocked on both the frontend and backend. Only status transitions are permitted.
>
> **Cancel vs Delete Behavior**: 
> - **Delete (Soft Delete)**: Only available when the tournament is in the `DRAFT` status (unpublished). It marks `deletedAt = now()` and hides the tournament completely from all active dashboards.
> - **Cancel (Cancellation)**: A lifecycle action available for published/active tournaments (e.g. `OPEN_REGISTRATION`, `CLOSED_REGISTRATION`, `ONGOING`). It sets the tournament status to `CANCELLED` so it remains visible in history list views with a `"Cancelled"` status badge.

---

## Proposed Changes

### Backend Components

#### [MODIFY] [Tournament.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/entity/Tournament.java)
- Add state transition methods to support all lifecycle steps:
  - `startOngoing()`: Sets status to `"ONGOING"` and updates `updatedAt`.
  - `completeTournament()`: Sets status to `"COMPLETED"` and updates `updatedAt`.
- Keep existing lifecycle methods: `cancel()`, `openRegistration()`, `closeRegistration()`, `softDelete()`.

#### [MODIFY] [TournamentService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java)
- In `updateTournament` and `deleteTournament` methods:
  - Check the tournament's current status. If it is `"ONGOING"` or `"COMPLETED"`, throw `400 Bad Request` ("Cannot modify/delete an ongoing or completed tournament").
  - In `deleteTournament`, verify that the tournament is in the `"DRAFT"` status. If not, throw `400 Bad Request` ("Only draft tournaments can be deleted. Please cancel active tournaments instead").
- In `updateStatus` method:
  - Expand the transition handler to cover all target states:
    - `"OPEN_REGISTRATION"` $\rightarrow$ calls `tournament.openRegistration()`
    - `"CLOSED_REGISTRATION"` $\rightarrow$ calls `tournament.closeRegistration()`
    - `"ONGOING"` $\rightarrow$ calls `tournament.startOngoing()`
    - `"COMPLETED"` $\rightarrow$ calls `tournament.completeTournament()`
    - `"CANCELLED"` $\rightarrow$ calls `tournament.cancel()`

---

### Frontend Components

#### [NEW] [adminTournamentApi.ts](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/api/adminTournamentApi.ts)
Implement REST request handlers using `httpClient`:
- `getAdminTournaments()`: `GET /api/v1/admin/tournaments`
- `getTournamentDetail(id: number)`: `GET /api/v1/admin/tournaments/${id}`
- `createTournament(payload)`: `POST /api/v1/admin/tournaments`
- `updateTournament(id: number, payload)`: `PUT /api/v1/admin/tournaments/${id}`
- `deleteTournament(id: number)`: `DELETE /api/v1/admin/tournaments/${id}`
- `updateTournamentStatus(id: number, status: string)`: `PUT /api/v1/admin/tournaments/${id}/status?status=${status}`

#### [MODIFY] [AppRouter.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/routes/AppRouter.tsx)
Replace the placeholder route with the new pages:
- Map `/admin/tournaments` to `<AdminTournamentListPage />`.
- Map `/admin/tournaments/:id` to `<AdminTournamentDetailPage />`.

#### [NEW] [AdminTournamentListPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminTournamentListPage.tsx)
- **Overview Cards**: Displays quick stats (Total Tournaments, Ongoing, Open Registrations).
- **Search & Filter panel**: Search input (by name or code) and a status dropdown selector.
- **"Create Tournament" Button**: Opens a modal dialog with fields: Name, Code, Location, Description, Max Horses, Tournament Start/End Dates, and Registration Start/End Dates.
- **Data Table**:
  - Columns: Code, Name, Location, Max Horses, Status Badge (styled with appropriate colors), Dates, Actions.
  - Action link: "Manage" to navigate to the detail view.
  - Supports loading and empty views.

#### [NEW] [AdminTournamentDetailPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminTournamentDetailPage.tsx)
- **Status Control Bar**:
  - Displays current status in a prominent badge.
  - Action buttons to change status (e.g. "Open Registration", "Start Tournament", "Complete Tournament", "Cancel Tournament") matching logically valid transitions.
  - Changes trigger a confirmation dialog.
- **Tab Layout**:
  - **Tab 1: Tournament Settings**:
    - Complete form representing all tournament attributes.
    - If status is `ONGOING` or `COMPLETED`, all input fields are `disabled`, the save changes button is hidden, and a warning card displays: *"This tournament is currently ongoing or completed. Fields are locked."*
    - "Delete Tournament" button: Visible only for `DRAFT` status. Triggers a double-confirm delete modal.
  - **Tab 2: Races**: Placeholder for future race list mapping.
  - **Tab 3: Registrations**: Placeholder for future registration entries queue.

---

## Verification Plan

### Automated Tests
- **Backend Tests**:
  - Write test cases in `AdminTournamentControllerTest.java` or `TournamentServiceTest.java` to verify:
    - Normal CRUD actions succeed for Admin users.
    - Updating or deleting an ONGOING or COMPLETED tournament results in a 400 error.
    - Soft-deleting a non-DRAFT tournament results in a 400 error.
- **Frontend Tests**:
  - Create test assertions in `AdminTournamentListPage.test.tsx` and `AdminTournamentDetailPage.test.tsx` verifying:
    - Correct mapping of list table columns.
    - Edit fields are disabled when status is ONGOING or COMPLETED.
    - Modal validations (required fields, start date before end date).

### Manual Verification
- Access the admin section `/admin/tournaments` as an Admin:
  - Create a new tournament in `DRAFT` status and check if it appears in the list.
  - Go to details `/admin/tournaments/:id`, change fields, and save changes.
  - Click "Delete Tournament" on a `DRAFT` tournament and verify it disappears.
  - Create another, change status to `OPEN_REGISTRATION` and then to `ONGOING`.
  - Verify that inputs in "Tournament Settings" become read-only and the delete button is removed.
  - Attempt to click "Cancel Tournament" and verify status changes to `CANCELLED` and remains visible in the list with a cancelled badge.
