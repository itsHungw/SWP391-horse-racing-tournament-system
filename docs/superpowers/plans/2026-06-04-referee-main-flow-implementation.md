# Referee Main Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the referee in-memory mock flow with the main DB-backed race-day flow from assigned race through confirmed result submission.

**Architecture:** Keep `Race`/`RaceParticipant` as existing DB source of truth. Add a focused `RefereeRaceDayService` behind the existing `/api/v1/referee/**` controller, plus thin JPA entities for `pre_race_checks`, `referee_reports`, `race_results`, and `violations`. Referee normal result submission moves a race to `RESULT_CONFIRMED`; `RESULT_SUBMITTED` is reserved for review-needed exception packages.

**Tech Stack:** Spring Boot, Spring Security method authorization, Spring Data JPA, SQL Server schema, MockMvc integration tests.

---

## File Structure

- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/race/entity/Race.java`
  - Map existing `races.referee_id` to `User referee`.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/race/entity/RaceParticipant.java`
  - Add methods for check status/status updates.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`
  - Add assigned-referee schedule-visible queries.
- Modify `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceParticipantRepository.java`
  - Add race participant lookup helpers.
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/PreRaceCheck.java`
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/RefereeReport.java`
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/RaceResult.java`
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/Violation.java`
- Create matching repositories under `backend/src/main/java/com/example/horseracingtournamentsystem/referee/repository/`
- Create DTOs under `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/`
- Create `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java`
- Replace `backend/src/main/java/com/example/horseracingtournamentsystem/referee/controller/RefereeController.java`
- Update `backend/src/test/java/com/example/horseracingtournamentsystem/referee/controller/RefereeControllerTest.java`

## Task 1: Map Referee Assignment

- [ ] Add `referee` relation to `Race`.
- [ ] Add `findAllByReferee_EmailAndTournament_StatusInAndDeletedAtIsNullOrderByRaceAtAsc` to `RaceRepository`.
- [ ] Add a test that `/api/v1/referee/races` can be filtered by authenticated referee once service is wired.

## Task 2: Add Race-Day Persistence Entities

- [ ] Add JPA entity/repository for `pre_race_checks`.
- [ ] Add JPA entity/repository for `referee_reports`.
- [ ] Add JPA entity/repository for `race_results`.
- [ ] Add JPA entity/repository for `violations`.
- [ ] Keep entity fields aligned with `database/001_create_tables.sql`; do not change schema in this sprint.

## Task 3: Replace In-Memory Assigned Races

- [ ] Implement `RefereeRaceDayService.listAssignedRaces(refereeEmail)`.
- [ ] Implement `RefereeRaceDayService.getRaceControl(raceId, refereeEmail)`.
- [ ] Replace static race maps in `RefereeController`.
- [ ] Preserve the frontend contract fields: `id`, `name`, `code`, `distanceMeters`, `status`, `scheduledAt`, `venue`.
- [ ] Add authorization guard: race must belong to current referee.
- [ ] Add visibility guard: parent tournament status must be `SCHEDULE_PUBLISHED`, `ONGOING`, or `COMPLETED`.

## Task 4: Persist Pre-Race Checks

- [ ] Implement participant check request DTO.
- [ ] Save/upsert `pre_race_checks`.
- [ ] Update `race_participants.check_status`.
- [ ] Set `race_participants.status = WITHDRAWN` when check result is failed.
- [ ] Move race from `SCHEDULED` to `CHECKING` when checks begin.
- [ ] Move race to `READY` only when every participant has `PASSED`, `FAILED`, or `CONDITIONAL`.
- [ ] Keep response compatible with existing pre-race UI.

## Task 5: Race Operations

- [ ] Implement `POST /api/v1/referee/races/{id}/start`.
- [ ] Validate race status is `READY`.
- [ ] Validate at least one non-withdrawn participant exists.
- [ ] Set race to `ONGOING`.
- [ ] Implement `POST /api/v1/referee/races/{id}/finish`.
- [ ] Validate race status is `ONGOING`.
- [ ] Set race to `FINISHED`.

## Task 6: Result Package Submission

- [ ] Implement result submission DTO with `requiresAdminReview`, `reviewReason`, and result rows.
- [ ] Upsert `race_results` rows.
- [ ] Upsert `referee_reports`.
- [ ] If `requiresAdminReview = false`, set result rows to `CONFIRMED` and race to `RESULT_CONFIRMED`.
- [ ] If `requiresAdminReview = true`, require `reviewReason`, set result rows to `SUBMITTED`, and race to `RESULT_SUBMITTED`.
- [ ] Preserve old `/results` endpoint or route it to the new service in a backward-compatible way if frontend tests still use it.

## Task 7: Incident Logging

- [ ] Implement `POST /api/v1/referee/races/{id}/incidents`.
- [ ] Preserve old `/violations` endpoint as an alias if current frontend still calls it.
- [ ] Persist to `violations`.

## Task 8: Verify

- [ ] Run backend referee tests:
  - `mvn test -Dtest=RefereeControllerTest`
- [ ] Run focused backend integration tests touching race service if added:
  - `mvn test -Dtest=*Referee*`
- [ ] Run frontend tests only after API contract changes are wired:
  - `npm test -- Referee`
- [ ] Run build if frontend changed:
  - `npm run build`

## Self-Review

- Spec coverage: covers assignment visibility, DB-backed assigned races, checks, race operations, result package submission, and incident persistence.
- Placeholder scan: no TODO/TBD placeholders.
- Scope check: UI polish, AI report generation, STT, standings recalculation, and admin exception review UI are intentionally deferred.
