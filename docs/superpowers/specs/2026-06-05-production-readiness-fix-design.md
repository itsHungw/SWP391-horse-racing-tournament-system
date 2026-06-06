# Production Readiness Fix Design

## Goal

Make the system safe enough for a production-style deployment by fixing the highest-risk security, data consistency, and operational issues found in the 2026-06-05 production readiness audit.

## Implementation Status - 2026-06-05

Implemented in this pass:

- Workstream 1 partial: generic file upload is category-aware, rejects unsafe types, stores public/private files separately, records uploader metadata, and private downloads allow only uploader/admin access.
- Workstream 2 partial: frontend access tokens are memory-only and no longer persisted in `localStorage`.
- Workstream 3 complete for current backend flows: `race_results` now has one authoritative JPA entity/repository shared by referee submission, admin prediction audit, and settlement.
- Workstream 4 complete for current race/referee flows: leaving `SCHEDULED` locks predictions, cancellation refunds eligible predictions, and result confirmation creates one settlement job.
- Workstream 5 complete for audited pages: admin prediction pages now render API failure states instead of mock fallback data.
- Points account hardening: `UserPointAccount` creation now works with Hibernate 7 `@MapsId` persist behavior.
- Test infrastructure: added a test-only database cleaner for integration tests that share the H2 context.
- Test alignment: schedule publication integration tests now seed an assigned referee because production requires every round to have one before publishing.
- Security hardening: CORS is env-backed, security headers are explicit, production refresh cookies fail fast when not secure, SQL logging moved to dev profile, and rate limits protect login/upload/prediction submit.
- DTO hardening: spectator prediction endpoints now return DTOs instead of `RacePrediction` entities.
- Race-day validation: result packages now enforce non-empty submissions, every participant exactly once, no duplicate finish positions, non-negative times/penalties, and valid status/time/position combinations.
- UI hardening: owner registration uses a blocker checklist, referee result submission avoids invalid empty-string payloads, and admin prediction detail has an inline settlement audit strip.

Deferred work remains for full production readiness:

- Legacy horse evidence/medical document paths still need migration from `/uploads/**` to the controlled private file endpoint.
- Full conversion of the legacy SQL Server schema into ordered Flyway migrations and legacy horse evidence/medical authorization.

Current verification:

- Frontend: `npm test -- --run` passed.
- Backend: `mvn test` passed.
- Focused backend: `mvn test "-Dtest=RaceResultMappingIntegrationTest,RaceIntegrationTest,FileStorageSecurityIntegrationTest"` passed.

## Scope

This spec covers the fix design for:

- secure upload and file access;
- browser token storage hardening;
- official race result source-of-truth cleanup;
- prediction lifecycle integration;
- admin prediction UI failure behavior;
- CORS, security headers, secure cookies, and rate limiting;
- DTO hardening and database migration direction.

This spec does not require implementing the changes immediately. It is intended to become one or more implementation plans.

## Non-Goals

- Redesigning the whole UI.
- Replacing Spring Security.
- Replacing the prediction product rules.
- Adding payment or wagering behavior.
- Reworking unrelated owner, jockey, or referee screen styling.

## Architecture Direction

### Official Domain Flow

Main operational flow:

1. Admin opens a championship registration window.
2. Owner registers an approved horse and clears document blockers.
3. Jockey applies to the championship pool.
4. Admin approves horse registrations and jockey pool applications.
5. Owner sends a jockey contract; jockey accepts.
6. Admin locks accepted contracts into championship participants.
7. Admin creates rounds, assigns referees, and publishes the schedule.
8. Race starts in `SCHEDULED`; predictions are open only in this state.
9. Referee starts checks; race moves to `CHECKING` and pending predictions lock.
10. Referee clears participants, starts race, finishes race, and submits official results.
11. Result confirmation creates one prediction settlement job.
12. Settlement evaluates official results, updates prediction status, and adjusts points idempotently.

State ownership:

- Admin owns championship setup, participant lock, schedule publication, referee assignment, cancellation, and final result publication.
- Referee owns race-day transitions from checks through result submission for assigned published races.
- Spectator owns prediction create/update only while race is `SCHEDULED`.
- Settlement owns prediction payout/refund finalization after result confirmation or cancellation.

### File Access

File storage must be split by visibility.

Public files:

- avatars;
- stable logos;
- horse display images.

Private files:

- horse evidence;
- horse medical documents;
- owner evidence;
- role request attachments;
- any future identity or compliance documents.

Public files may be served as static resources after validation. Private files must be served through authenticated controller endpoints that check whether the current user can access the target file.

### Authentication

The browser should not persist bearer access tokens. The preferred target design is:

- access token stored in memory only;
- refresh token remains HttpOnly cookie;
- app boot performs a refresh call to restore the session;
- logout clears memory state and server refresh session.

If the team chooses cookie-based access tokens instead, CSRF protection must be added before production.

### Race Result Source of Truth

The project must have one official result model for the `race_results` table. Referee submission, admin review, public results, and prediction settlement must use one shared persistence contract.

Recommended target:

- keep one `RaceResult` entity under a neutral package such as `result.entity`;
- remove or retire the duplicate referee-specific result entity;
- expose module-specific DTOs from services instead of exposing the entity;
- add integration tests proving referee submission is visible to prediction settlement.

### Prediction Lifecycle

Prediction state must follow race state.

Required hooks:

- race starts or moves away from `SCHEDULED`: lock pending predictions;
- race is cancelled: refund pending and locked predictions;
- race result is confirmed: create settlement job once;
- settlement job completes: predictions become correct or incorrect and points are adjusted idempotently.

### Admin Prediction UI

Admin prediction screens must never show fake data after an API failure. They should show:

- loading state while fetching;
- API data on success;
- explicit error state with retry on failure;
- empty state only when the API returns an empty list.

Mock data belongs in tests or fixture files only.

## Required Workstreams

### Workstream 1: Secure File Upload and Access

**Files likely affected**

- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageController.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/HorseFileStorageService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadWebConfig.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`
- `frontend/src/api/profileApi.ts`
- `frontend/src/api/ownerProfileApi.ts`

**Design**

- Replace free-form `category` upload behavior with an enum-backed category model.
- Validate file type and size before writing to disk.
- Do not trust browser-provided MIME type alone; compare MIME, allowed extension, and generated extension.
- Store private files under a private directory not exposed by `/uploads/**`.
- Return stable file references or URLs that route through access-controlled endpoints.
- Serve private files with `Content-Disposition: attachment`.

**Acceptance criteria**

- Uploading `.html`, `.svg`, `.js`, `.exe`, or unknown file types is rejected.
- Public images still render in existing owner/profile/horse pages.
- Private evidence cannot be downloaded without authentication.
- A different owner cannot download another owner's private evidence.
- Admin can download private evidence for review.

**Implemented**

- Generic private uploads now persist `stored_files` metadata with uploader, category, content type, and visibility.
- Private downloads are denied to anonymous users and other authenticated users; uploader and admin are allowed.
- Legacy horse document/evidence storage remains a follow-up because it still uses domain-specific `/uploads/**` paths.

### Workstream 2: Auth Token Storage and Cookie Hardening

**Files likely affected**

- `frontend/src/utils/authSession.ts`
- `frontend/src/hooks/useClientSession.ts`
- `frontend/src/api/httpClient.ts`
- `frontend/src/pages/auth/AuthPage.tsx`
- `backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java`
- `backend/src/main/resources/application.yml`

**Design**

- Replace persistent access token storage with memory state.
- Keep only non-sensitive UI hints in storage if needed.
- On app boot, call `/auth/refresh` once to restore access token when refresh cookie exists.
- Keep refresh cookie HttpOnly.
- In production, require `Secure=true`.

**Acceptance criteria**

- `localStorage.getItem("accessToken")` is never used in production code.
- Browser refresh keeps the user session when refresh cookie is valid.
- Logout clears memory session and revokes refresh session.
- Tests cover refresh success, refresh failure, and logout.

### Workstream 3: Unified Race Result Persistence

**Files likely affected**

- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/RaceResult.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/result/entity/RaceResult.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/repository/RaceResultRepository.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/result/repository/RaceResultRepository.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/AdminPredictionController.java`

**Design**

- Choose one `RaceResult` entity as the authoritative JPA mapping.
- Migrate service logic to that entity.
- Keep result-specific DTOs for API boundaries.
- Remove duplicate repository usage or rename it so package intent is clear.

**Acceptance criteria**

- Referee result submission writes rows that prediction settlement reads without a second mapping.
- Prediction settlement rewards correct WINNER and TOP3 predictions from referee-submitted results.
- Admin prediction audit displays the same official result source.
- No two JPA entities map the same `race_results` table.

**Implemented**

- The duplicate referee `RaceResult` entity/repository was removed.
- `result.entity.RaceResult` is now the single `race_results` mapping and preserves referee result fields.
- `RaceResultMappingIntegrationTest` prevents the duplicate-table-mapping regression.

### Workstream 4: Prediction Lifecycle Hooks

**Files likely affected**

- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`

**Design**

- Lock predictions when a race transitions away from `SCHEDULED`.
- Refund predictions when a race is cancelled.
- Create settlement job after result confirmation.
- Keep point adjustments idempotent.

**Acceptance criteria**

- Starting a race changes pending predictions to locked.
- Cancelling a race refunds pending and locked predictions once.
- Confirming official result creates exactly one settlement job.
- Re-running settlement does not duplicate point rewards.

**Implemented**

- Admin race status transitions call lock/refund/settlement hooks.
- Referee race-day transitions lock predictions when checks start and create settlement when results are confirmed without admin review.
- `RaceIntegrationTest` covers lock, refund, and settlement job creation. Point reward idempotency remains protected by existing transaction reference checks in `PointsService`.

### Workstream 5: Admin Prediction UI Real Data Only

**Files likely affected**

- `frontend/src/pages/admin/AdminPredictionsWorkspace.tsx`
- `frontend/src/pages/admin/AdminRacePredictionDetailPage.tsx`
- `frontend/src/api/adminPredictionApi.ts`

**Design**

- Remove runtime mock arrays from page components.
- Pages should initialize with empty state, then load API data.
- On failure, render explicit error panels with retry buttons.
- Tests should mock API success and failure.

**Acceptance criteria**

- API failure does not render mock race names or mock prediction rows.
- Retry calls the API again.
- Empty API response renders an empty state.
- Successful API response renders backend data.

### Workstream 6: Security Configuration and Rate Limits

**Files likely affected**

- `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`
- `backend/src/main/resources/application.yml`
- `backend/pom.xml`

**Design**

- Add explicit CORS configuration using environment-provided allowed origins.
- Add CSP, frame options, referrer policy, and safe defaults.
- Add rate limiting for auth, upload, and prediction mutation endpoints.
- Move SQL logging to dev profile.

**Acceptance criteria**

- Production CORS accepts only configured frontend origins.
- Refresh cookie is secure in production.
- Auth spam returns HTTP 429 after configured limits.
- Base `application.yml` does not enable SQL logging by default.

**Implemented**

- `CorsConfigurationSource` uses `app.cors.*`.
- Security headers include CSP, frame deny, strict-origin referrer, and permissions policy.
- `ProductionCookiePropertiesValidator` fails unsafe prod cookie settings.
- `RateLimitingFilter` protects login, upload, and prediction submit.
- SQL logging moved to `application-dev.yml`.

### Workstream 7: DTO and Validation Hardening

**Files likely affected**

- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/dto/response/*`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/*`

**Design**

- Replace entity responses with response DTOs.
- Add Bean Validation constraints to official race-day request DTOs.
- Keep service-level domain validation for cross-field rules.

**Acceptance criteria**

- Spectator prediction endpoints return DTOs only.
- Malformed result submissions return HTTP 400 with field errors.
- Invalid participant IDs and duplicate result positions are rejected.

**Implemented**

- `UserPredictionResponse` is used for spectator prediction API boundaries.
- `SubmitResultsRequest` and `ParticipantResultEntry` have Bean Validation.
- `RefereeRaceDayService` enforces cross-field and cross-row result package rules.
- Frontend referee result submission maps blank numeric fields to `null` before sending JSON.

### Workstream 8: Database Migration Management

**Files likely affected**

- `backend/pom.xml`
- `backend/src/main/resources/db/migration/*`
- `backend/src/main/resources/schema.sql`
- `database/*.sql`

**Design**

- Introduce Flyway or Liquibase.
- Convert schema creation and incremental changes into versioned migrations.
- Keep dev seed data separate from production migrations.

**Acceptance criteria**

- A clean database can be created by running migrations.
- Existing dev seed can still be applied intentionally.
- Production startup does not depend on manual SQL copy-paste.

**Implemented**

- Flyway dependencies and application config were added.
- Test profile disables Flyway to keep isolated H2 create-drop tests stable.
- `V1__baseline_schema.sql` marks migration ownership for existing deployments; full legacy schema conversion remains before a clean cloud database launch.

## Suggested Implementation Order

1. Secure file upload and private file access.
2. Unify race result persistence.
3. Wire prediction lifecycle hooks.
4. Remove admin prediction mock fallback.
5. Move access token out of localStorage.
6. Add production CORS, headers, secure cookie profile, and rate limits.
7. Convert prediction entity responses to DTOs and harden race-day validation.
8. Introduce database migrations.

## Test Strategy

Backend tests should prioritize integration tests for:

- file upload rejection and private download authorization;
- auth refresh session behavior;
- referee result submission and prediction settlement;
- prediction lock, refund, and settlement idempotency;
- CORS/security configuration where practical.

Frontend tests should prioritize:

- session restore without localStorage access token;
- admin prediction API failure states;
- upload UI behavior for accepted and rejected files.

## Release Checklist

- No runtime mock data in admin operational screens.
- No bearer token persisted in localStorage.
- No private evidence file is publicly reachable.
- One JPA entity maps `race_results`.
- Prediction settlement is triggered by official result lifecycle.
- Production CORS and secure cookies are configured.
- Base config does not print SQL by default.
- Migration path can build a clean database.
