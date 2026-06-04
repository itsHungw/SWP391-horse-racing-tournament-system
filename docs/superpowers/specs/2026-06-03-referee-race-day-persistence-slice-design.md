# Referee Race-Day Persistence Slice Design

Date: 2026-06-03

## Goal

Replace the current in-memory referee race-day data with a small database-backed slice that is good enough for a full demo flow:

1. Referee opens assigned race.
2. Referee completes pre-race checks.
3. Failed checks persist as withdrawn/scratched participants.
4. Frontend runs the live simulator.
5. Draft results and incidents are saved.
6. Official results are published.
7. Result History reads published results from the database.

This is intentionally not a full production rewrite. The scope is to prove data integrity across the referee demo flow without expanding into every tournament/ranking concern.

## Current Problem

`/api/v1/referee/**` is currently backed by static in-memory maps inside `RefereeController`. The repository already has SQL schema and seed scripts, but referee screens do not read those tables. Adding rows to the database alone will not affect the referee UI until the controller is wired to persistence.

## Approach

Use a thin Spring persistence slice:

- Keep the controller API shape close to the current frontend contract.
- Add a small `RefereeRaceDayService` for transactional operations.
- Use Spring Data JPA repositories or narrow repository queries/projections.
- Keep frontend live simulation local.
- Persist only stable race-day outcomes: pre-checks, draft/final results, violations/incidents, and published history.

Do not build a full clean-room production referee module yet. Avoid broad entity remodeling unless it is required for this slice.

## Database Seed

Create `database/901_referee_race_day_seed.sql`.

Seed data should include:

- one active referee account, if not already present;
- one tournament for referee demo;
- several approved horses;
- one upcoming/checkable race for the live demo;
- one already-published race for Result History;
- race participants for both races;
- pre-race checks for the published race;
- race results for the published race;
- violations for incident/penalty history.

Use existing schema status values:

- `races.status`: `SCHEDULED`, `CHECKING`, `READY`, `ONGOING`, `FINISHED`, `RESULT_SUBMITTED`, `RESULT_CONFIRMED`, `PUBLISHED`, `CANCELLED`
- `race_participants.check_status`: `NOT_CHECKED`, `PASSED`, `FAILED`, `CONDITIONAL`
- `race_participants.status`: `REGISTERED`, `APPROVED`, `DISQUALIFIED`, `WITHDRAWN`
- `pre_race_checks.result`: `PASSED`, `FAILED`, `CONDITIONAL`
- `race_results.result_status`: `FINISHED`, `DISQUALIFIED`, `DID_NOT_FINISH`, `WITHDRAWN`
- `race_results.status`: `DRAFT`, `SUBMITTED`, `CONFIRMED`, `PUBLISHED`, `REJECTED`

For UI wording, a failed health check can still render as `SCRATCHED`; in the database, store that as:

- `race_participants.check_status = 'FAILED'`
- `race_participants.status = 'WITHDRAWN'`
- `pre_race_checks.result = 'FAILED'`
- reason in `pre_race_checks.note` and/or `race_participants.check_note`

## Backend API

Keep existing endpoints where possible:

- `GET /api/v1/referee/races`
  - Returns assigned races from `races`.
  - Filter by authenticated referee where practical: `races.referee_id = current user`.

- `GET /api/v1/referee/races/{raceId}/participants`
  - Returns participant rows by joining `race_participants`, `horses`, and jockey user.
  - Maps DB statuses to existing frontend statuses:
    - `check_status = PASSED` and active participant -> `PASSED`
    - `check_status = FAILED` or participant `WITHDRAWN` -> `FAILED`
    - otherwise -> `PENDING`

- `POST /api/v1/referee/races/{raceId}/pre-checks`
  - Upserts one `pre_race_checks` row per participant.
  - Updates `race_participants.check_status`.
  - If a participant fails health/equipment, updates `race_participants.status = 'WITHDRAWN'`.
  - Moves race toward `READY` only when all participants have no pending checks.

Add two endpoints for the new sprint flow:

- `POST /api/v1/referee/races/{raceId}/draft-results`
  - Saves the post-race draft from frontend simulator.
  - Upserts `race_results` rows with `status = 'DRAFT'`.
  - Persists incident/penalty log into `violations`.
  - Updates `races.status = 'RESULT_SUBMITTED'` or `FINISHED` depending on how strict the demo wants to be. Recommended: `RESULT_SUBMITTED`.

- `POST /api/v1/referee/races/{raceId}/publish`
  - Requires all pending appeals to be resolved on the frontend side for this sprint.
  - Updates all result rows for the race to `status = 'PUBLISHED'`.
  - Sets `race_results.published_at = SYSDATETIME()`.
  - Updates `races.status = 'PUBLISHED'`.

Add history endpoint:

- `GET /api/v1/referee/result-history`
  - Returns only races with `races.status = 'PUBLISHED'`.
  - Includes final top 3, final times, incident/violation summary, penalties, published timestamp, and referee name.

## Transaction Rules

Use `@Transactional` in `RefereeRaceDayService` for operations that touch multiple tables:

- saving pre-race checks;
- saving draft results plus violations;
- publishing official results.

Repository methods can stay narrow. The service owns cross-table consistency.

## Frontend Wiring

Minimal frontend changes after backend is ready:

- Keep `getAssignedRaces`, `getRaceParticipants`, and `savePreRaceChecks`.
- Add:
  - `saveDraftRaceResults(raceId, payload)`
  - `publishRaceResults(raceId)`
  - `getRefereeResultHistory()`
- `RaceSummary`:
  - `Update Draft Result` calls draft save.
  - `Publish Official Result` calls publish.
- `RefereeResultHistoryPage`:
  - replace mock data with `getRefereeResultHistory()`.

The live simulator stays client-side. It sends only the final draft snapshot and incident list to the backend.

## Testing

Backend:

- Add integration tests for:
  - assigned races are read from DB;
  - pre-race failed check writes `FAILED` and `WITHDRAWN`;
  - draft save writes `race_results` and `violations`;
  - publish changes `race_results.status` and `races.status` to `PUBLISHED`;
  - result history returns only published races.

Frontend:

- Mock API tests for:
  - Update Draft calls save API;
  - Publish calls publish API;
  - Result History renders API rows;
  - published page is read-only.

Manual demo:

1. Run schema and seed scripts.
2. Login as `referee@demo.local`.
3. Open Assigned Races.
4. Run pre-race checks, scratch one horse.
5. Enter live race, apply penalty/DSQ if desired.
6. Let simulator auto-freeze, proceed to post-race.
7. Update Draft Result.
8. Resolve/reject appeals.
9. Publish Official Result.
10. Open Result History and verify the published race appears from DB.

## Out Of Scope

- Real websocket telemetry.
- Server-side simulator.
- Full appeals persistence.
- Photo finish image storage.
- Ranking/points recalculation.
- Betting or payout rules.
- Full production-grade referee domain refactor.

## Risks

- The current SQL schema uses `WITHDRAWN` while UI uses `SCRATCHED`; mapping must be explicit.
- Unique constraints on race result positions require DSQ/DNF/withdrawn rows to keep `position = NULL`.
- Seed scripts must avoid duplicate key failures if run multiple times. Use guarded inserts or document that the dev database should be reset before running `901_referee_race_day_seed.sql`.
- Existing legacy referee endpoints may still be used by older pages; keep route contracts stable while replacing storage.
