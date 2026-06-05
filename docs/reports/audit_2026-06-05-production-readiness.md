# Production Readiness Audit - 2026-06-05

## Summary

- Critical issues: 6
- High-priority issues: 6
- Cleanup items: 4

This audit focuses on changes that should be handled before production so the project does not accumulate hard-to-fix security, data consistency, and operational debt.

## Implementation Status - 2026-06-05

Completed in this pass:

- Hardened generic file upload by category, MIME allowlist, size limit, generated filenames, and public/private storage split.
- Added stored-file metadata and private download authorization: uploader and admin can read private files; other authenticated users are forbidden.
- Removed runtime mock fallback from admin prediction pages and added explicit API error/retry states.
- Moved frontend access token storage out of `localStorage`; access tokens are memory-only and legacy stored tokens are cleared.
- Consolidated `race_results` to a single source-of-truth JPA entity/repository used by referee, admin prediction audit, and settlement.
- Wired race/prediction lifecycle hooks: leaving `SCHEDULED` locks predictions, cancellation refunds eligible predictions, and result confirmation creates one settlement job.
- Fixed `UserPointAccount` `@MapsId` creation so new point accounts persist reliably on Hibernate 7.
- Added backend test database cleanup support for integration tests that share the H2 context.
- Updated schedule publication tests to match the production rule that rounds require assigned referees before schedule publication.

Verification evidence:

- `npm test -- --run` from `frontend`: 48 test files, 163 tests passed.
- `mvn test` from `backend`: full Maven test suite passed.
- Focused file security test: `mvn test -Dtest=FileStorageSecurityIntegrationTest` passed.
- Focused lifecycle/source-of-truth suite: `mvn test "-Dtest=RaceResultMappingIntegrationTest,RaceIntegrationTest,FileStorageSecurityIntegrationTest"` passed.

Known remaining production backlog:

- Broader private-file authorization for legacy horse medical/evidence paths under `/uploads/**` still needs migration into the controlled file endpoint.
- Production CORS/security headers/rate limits/secure-cookie fail-fast configuration are still open.
- DTO hardening, Bean Validation expansion, and Flyway/Liquibase migration work are still open.
- Frontend test suite still emits non-failing legacy warnings around jsdom network noise and React `act(...)` in a few older tests.

## Critical Issues

### 1. General file upload can store unsafe files

**Files**
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageController.java`

**Problem**

`FileStorageService.storeFile` accepts the original file extension, does not validate content type, does not validate size per category, and stores files under a public download endpoint. `FileStorageController.downloadFile` returns files with `Content-Disposition: inline`.

**Risk**

A user can upload active content such as HTML or SVG and have the backend serve it inline. This can become stored XSS on the backend origin. Because the same API origin handles authenticated endpoints, this is a production-blocking security issue.

**Required fix**

Replace the generic upload path with a category-aware service:

- allow only known categories such as `AVATAR`, `STABLE_LOGO`, and `OWNER_EVIDENCE`;
- validate MIME type, extension, and max size;
- generate safe filenames;
- serve public image categories separately from private evidence/document categories;
- use `attachment` for private downloads;
- add tests for rejected HTML/SVG/executable uploads.

### 2. Uploaded evidence and documents are publicly readable

**Files**
- `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/UploadWebConfig.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/common/upload/HorseFileStorageService.java`

**Problem**

`/uploads/**` and `/api/v1/files/download/**` are permitted publicly. Horse evidence, owner evidence, and medical documents can include sensitive information.

**Risk**

Anyone with a URL can access private documents. URLs can leak through screenshots, logs, browser history, referrers, or shared admin pages.

**Required fix**

Split file access by visibility:

- public: horse images, stable logos, avatars;
- private: evidence, medical documents, role request files.

Private files must be fetched through an authenticated controller with ownership/admin/referee authorization checks.

**Status**

Partially fixed for the generic upload endpoint. New private uploads are recorded in `stored_files` with uploader metadata and `/api/v1/files/private/{filename}` allows only the uploader or admin. Legacy horse evidence/medical files still need migration away from direct `/uploads/**` exposure.

### 3. Access token is stored in localStorage

**Files**
- `frontend/src/utils/authSession.ts`
- `frontend/src/api/httpClient.ts`
- `backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java`

**Problem**

The frontend persists access tokens in `localStorage` and attaches them as bearer tokens.

**Risk**

Any XSS issue can steal the token and impersonate users until expiration. This risk is amplified by the unsafe upload path above.

**Required fix**

Move access token storage to memory-only state and rely on the HttpOnly refresh cookie for restoration, or move access tokens fully into HttpOnly cookies and add CSRF protection. Do not keep bearer tokens in persistent browser storage.

### 4. Race result source of truth is split across two entities

**Files**
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/entity/RaceResult.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/result/entity/RaceResult.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/scheduler/PredictionSettlementScheduler.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/AdminPredictionController.java`

**Problem**

Two different JPA entities map to the same `race_results` table. The referee workflow writes official results through `referee.entity.RaceResult`, while prediction settlement and admin prediction audit read through `result.entity.RaceResult`.

**Risk**

The two mappings can drift. Settlement may read incomplete or misinterpreted official results, causing wrong point payouts or failed jobs. This is a deep data integrity risk.

**Required fix**

Unify official result persistence around one entity/repository/model. All referee, admin, result, and prediction modules must read and write the same result contract.

**Status**

Fixed. The referee-specific `RaceResult` entity/repository was removed, `result.entity.RaceResult` is now the single mapping for `race_results`, and `RefereeRaceDayService`, admin prediction audit, and settlement all use `result.repository.RaceResultRepository`. `RaceResultMappingIntegrationTest` asserts that only one JPA entity maps `race_results`.

### 5. Prediction lifecycle is not reliably connected to race lifecycle

**Files**
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/PredictionService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`

**Problem**

`PredictionService` has `lockPredictionsForRace` and `createSettlementJob`, but the current race/referee lifecycle does not clearly call them when a race starts, is cancelled, or result is confirmed.

**Risk**

Predictions may remain pending after the race starts, cancelled races may not refund points, and confirmed results may not trigger settlement.

**Required fix**

Define lifecycle hooks:

- when race leaves `SCHEDULED`, lock predictions;
- when race is cancelled, refund eligible predictions;
- when official result becomes `RESULT_CONFIRMED` or `PUBLISHED`, create settlement job exactly once.

**Status**

Fixed for the current race/referee flows. `RaceService` and `RefereeRaceDayService` now call prediction lifecycle hooks for lock/refund/settlement, and `RaceIntegrationTest` covers pending prediction lock, cancellation refund, and one settlement job on result confirmation.

### 6. Admin prediction pages fall back to fake data on API failure

**Files**
- `frontend/src/pages/admin/AdminPredictionsWorkspace.tsx`
- `frontend/src/pages/admin/AdminRacePredictionDetailPage.tsx`

**Problem**

Admin prediction pages initialize with mock data and fall back to mock data when API calls fail.

**Risk**

Admin users can see fake audit data and act on incorrect settlement state. This is especially dangerous for point economy and official audit workflows.

**Required fix**

Remove runtime mock fallback. API failures must show an error state with retry. Tests should assert that no fake rows appear after API failure.

## High-Priority Issues

### 1. CORS and security headers are not production-ready

**File**
- `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`

**Problem**

CORS uses `Customizer.withDefaults()` and there is no explicit CSP, referrer policy, or production header hardening.

**Required fix**

Add a `CorsConfigurationSource` backed by environment-configured allowed origins. Add security headers including CSP, frame options, and referrer policy.

### 2. Refresh cookie `Secure` defaults to false

**File**
- `backend/src/main/resources/application.yml`

**Problem**

`app.auth.refresh-cookie-secure` defaults to false.

**Required fix**

Production profile must require secure cookies. Prefer fail-fast production config instead of unsafe defaults.

### 3. No rate limiting on sensitive endpoints

**Files**
- `backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/filestorage/FileStorageController.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`

**Problem**

Login, resend verification email, upload, and prediction submission endpoints have no visible throttling.

**Required fix**

Add application-level or gateway-level rate limits for auth, upload, and prediction mutation endpoints.

### 4. Prediction spectator API exposes entities directly

**File**
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`

**Problem**

Several endpoints return `RacePrediction` entities directly.

**Required fix**

Return DTOs only. DTOs must include just the fields the frontend uses.

### 5. Official result request DTOs need stronger validation

**Files**
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/SubmitResultsRequest.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/ParticipantResultEntry.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/ViolationRequest.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/referee/dto/ParticipantCheckRequest.java`

**Problem**

Official race-day inputs rely heavily on service checks and have limited Bean Validation.

**Required fix**

Add validation for non-empty result lists, participant IDs, status values, time/position ranges, penalties, report titles, and incident payloads.

### 6. Database migration flow is not production-grade

**Files**
- `database/*.sql`
- `backend/src/main/resources/schema.sql`

**Problem**

The project uses manual SQL scripts and a large schema script with many conditional changes.

**Required fix**

Move schema management to Flyway or Liquibase with ordered, versioned migrations and repeatable seed policy for dev data.

## Cleanup Items

### 1. Disable SQL logging by default

**File**
- `backend/src/main/resources/application.yml`

Move `show-sql` and formatted SQL into a dev profile.

### 2. Remove duplicated spectator routes

**File**
- `frontend/src/routes/AppRouter.tsx`

The route table defines spectator redirects twice. Clean this up before route behavior becomes harder to reason about.

### 3. Avoid N+1 queries in admin prediction summaries

**File**
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/AdminPredictionController.java`

The controller loads all races and queries predictions per race. Replace with aggregate repository queries before data volume grows.

### 4. Remove production-visible mock state from admin pages

**Files**
- `frontend/src/pages/admin/AdminPredictionsWorkspace.tsx`
- `frontend/src/pages/admin/AdminRacePredictionDetailPage.tsx`

Mock data should live in tests, Storybook, or fixtures only.

## Recommended Fix Order

1. Harden file upload and private file access.
2. Unify official race result persistence.
3. Connect prediction lifecycle to race lifecycle.
4. Remove admin prediction mock fallback.
5. Move access token out of persistent browser storage.
6. Add CORS/security headers/rate limits.
7. Convert prediction entity responses to DTOs.
8. Add race-day DTO validation.
9. Move database changes to Flyway or Liquibase.
