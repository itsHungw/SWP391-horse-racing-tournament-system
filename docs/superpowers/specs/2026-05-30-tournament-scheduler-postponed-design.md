# Spec: Tournament Auto-Transition Scheduler & Postponed Lifecycle Flow

## Overview
This specification details the implementation of:
1. An automated background scheduler in the Spring Boot backend that transitions tournament lifecycle states as their corresponding registration times and tournament dates are reached.
2. An update to the "Tạm đóng" (Suspended) flow, rename it to `"POSTPONED"`, and enable administrative editing of tournament parameters when in this state.
3. A single `"Reopen Registration"` action when postponed, which returns the tournament back to the `"OPEN_REGISTRATION"` status.

---

## User Review Required

> [!IMPORTANT]
> **Postponed Status Renaming**: The database status value `"CANCELLED"` is completely renamed to `"POSTPONED"`. All backend checks, constraints, entity mapping, and database schema scripts are updated to use `"POSTPONED"`.
>
> **Editable Postponed Tournaments**: Unlike `"ONGOING"` and `"COMPLETED"` statuses, a `"POSTPONED"` tournament is unlocked on the frontend, allowing administrators to correct dates, registration windows, description, or other settings before reopening.
>
> **Restricted Postponement**: Tournaments can only be postponed while in `"OPEN_REGISTRATION"` or `"CLOSED_REGISTRATION"` statuses. Draft, ongoing, and completed tournaments cannot be postponed.
>
> **Auto-Transition Rules**:
> - Draft and Postponed tournaments are **never** auto-transitioned by the background scheduler.
> - `OPEN_REGISTRATION` $\rightarrow$ `CLOSED_REGISTRATION`: Automatically happens when current time $\ge$ `registrationEndAt`.
> - `CLOSED_REGISTRATION` $\rightarrow$ `ONGOING`: Automatically happens when current date $\ge$ `startDate`.
> - `ONGOING` $\rightarrow$ `COMPLETED`: Automatically happens when current date $>$ `endDate`.

---

## Proposed Changes

### Backend Components

#### 1. Enable Scheduling
* **Class**: [BackendApplication.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/BackendApplication.java)
  * Add the `@EnableScheduling` annotation to the main application class.

#### 2. Create Background Scheduler
* **Class**: `TournamentScheduler.java` (New)
  * Location: `com.example.horseracingtournamentsystem.tournament.scheduler.TournamentScheduler`
  * Annotate with `@Component` and `@RequiredArgsConstructor`.
  * Implement a `@Scheduled(fixedRate = 60000)` running every minute to process active status transitions in a transaction:
    * Query all tournaments that are not deleted (`deletedAt IS NULL`) and are in one of the active statuses: `OPEN_REGISTRATION`, `CLOSED_REGISTRATION`, or `ONGOING`.
    * Apply the transition rules:
      * If `OPEN_REGISTRATION` and `LocalDateTime.now().isAfter(t.getRegistrationEndAt())` (or equal) $\rightarrow$ call `t.closeRegistration()`.
      * If `CLOSED_REGISTRATION` and `LocalDate.now().isAfter(t.getStartDate())` (or equal) $\rightarrow$ call `t.startOngoing()`.
      * If `ONGOING` and `LocalDate.now().isAfter(t.getEndDate())` $\rightarrow$ call `t.completeTournament()`.
    * Save changes to the database.

---

### Frontend Components

#### 1. Label Mapping Update
* **File**: [AdminTournamentListPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminTournamentListPage.tsx)
  * Change filter option value and text from `"CANCELLED"` / `"Suspended"` to `"POSTPONED"` / `"Postponed"`.
  * Change status badge text mapping: `t.status === "POSTPONED" ? "POSTPONED" : ...`.
* **File**: [AdminTournamentDetailPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminTournamentDetailPage.tsx)
  * Change status badge text mapping: `tournament.status === "POSTPONED" ? "POSTPONED" : ...`.
  * Update status transition success messages and confirmation modal text to refer to `"POSTPONED"` instead of `"SUSPENDED"` or `"Cancelled"`.

  * Form fields are only editable in `"DRAFT"` and `"POSTPONED"` status:
    ```typescript
    const isLocked = !["DRAFT", "POSTPONED"].includes(tournament.status);
    ```
  * This blocks editing during registration phases (OPEN_REGISTRATION, CLOSED_REGISTRATION) and ongoing/completed phases. Form fields are only unlocked when DRAFT or POSTPONED.

#### 3. Action Buttons & Transitions
* **File**: [AdminTournamentDetailPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/admin/AdminTournamentDetailPage.tsx)
  * **Draft Status**: Remove the "Suspend Tournament" button. Drafts can only be "Open Registration" (published) or deleted.
  * **Open & Closed Registration Statuses**: Keep the "Postpone Tournament" button (triggers transition to `POSTPONED`).
  * **Ongoing & Completed Statuses**: Remove the "Postpone Tournament" button (cannot postpone ongoing or completed races).
  * **Postponed Status**: Render a single transition button: `"Reopen Registration"` (triggers transition to `OPEN_REGISTRATION`).

---

## Verification Plan

### Automated Tests
* Update [TournamentIntegrationTest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentIntegrationTest.java) to verify:
  * A postponed (`POSTPONED`) tournament's details can be successfully modified via the update endpoint.
  * A postponed tournament can transition back to `OPEN_REGISTRATION` via the status endpoint.
  * The `TournamentScheduler` successfully auto-transitions active tournaments when dates/times expire and ignores drafts/postponed tournaments.

### Manual Verification
* **Scheduling**: Set a tournament registration end time to 1 minute in the future, watch it automatically close on the list and detail pages.
* **Editing Postponed**: Create a tournament, open registration, click "Postpone Tournament", verify that details are fully editable, modify dates, click "Save Changes", and verify updates.
* **Reopening**: Click "Reopen Registration" on a postponed tournament and verify it returns to "Open Registration" and is active.
