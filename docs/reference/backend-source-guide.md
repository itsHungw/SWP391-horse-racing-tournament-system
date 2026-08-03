# Backend Source Guide

A file-level reference for `backend/src`. It describes what each package owns, which
invariants live where, and which class to open first when changing behaviour.

Companion documents: [Frontend Source Guide](frontend-source-guide.md),
[API Endpoint Reference](api-endpoints.md).

---

## 1. Layout

```text
backend/
├── Dockerfile                      multi-stage build (temurin 21 JDK -> JRE, non-root)
├── pom.xml                         Spring Boot 4.0.6, Java 21
└── src/
    ├── main/java/com/example/horseracingtournamentsystem/
    │   ├── auth/            registration, login, refresh, OAuth, password reset
    │   ├── blog/            editorial content, public + admin
    │   ├── championship/    jockey pool, contracts, participant locking
    │   ├── common/          error contract, upload helpers
    │   ├── config/          mail async, OpenAPI, dev seeder
    │   ├── dashboard/       admin overview aggregation
    │   ├── dispute/         spectator disputes, account appeals
    │   ├── filestorage/     S3-compatible object storage and access control
    │   ├── finance/         admin ledger reporting and reconciliation
    │   ├── horse/           horse registry and documents
    │   ├── leaderboard/     standings and spectator leaderboard
    │   ├── notification/    persisted in-app notifications
    │   ├── organization/    organizer onboarding and KYB review
    │   ├── prediction/      wagers, odds, settlement
    │   ├── race/            race scheduling, results, race media
    │   ├── referee/         race-day operations
    │   ├── result/          race result persistence
    │   ├── security/        JWT, filters, CORS, rate limiting, account gating
    │   ├── tournament/      tournament lifecycle
    │   ├── tournamentregistration/  owner entries into tournaments
    │   ├── user/            profiles, roles, role requests, enforcement
    │   └── wallet/          VND ledger, VNPay top-up, withdrawals
    ├── main/resources/
    │   ├── application.yml + application-{dev,prod}.yml
    │   └── db/migration/            Flyway V1..V39
    └── test/java/...                74 test classes + TestDatabaseCleaner, mirroring main
```

`aiinsight/`, `common/config/`, `common/exception/` and `common/response/` contain only
`.gitkeep`. They are reserved package slots, not code — do not document them as features.

### Package shape

Active domains follow the same internal shape:

```text
<domain>/
  controller/     HTTP boundary; DTO in, DTO out, no entities on the wire
  dto/request/    inbound payloads with Bean Validation annotations
  dto/response/   outbound projections
  entity/         JPA entities
  enums/          status vocabularies persisted as strings
  repository/     Spring Data JPA interfaces
  service/        transactional business rules
```

Smaller domains (`dashboard`, `finance`, `leaderboard`) collapse `dto/request` and
`dto/response` into a single `dto/` package because they are read-only.

### Layering rules

| Rule | Where it is enforced |
| --- | --- |
| Controllers never return JPA entities | every `*Controller` returns a DTO or `ResponseEntity<DTO>` |
| Business validation lives in services | `@Transactional` methods in `*/service` |
| Repositories hold queries only | `*/repository` interfaces |
| Cross-module reads go through the owning service | e.g. `PredictionService` calls `WalletService.adjust` rather than touching `WalletRepository` |

---

## 2. Bootstrap and configuration

### `config/`

| Class | Responsibility |
| --- | --- |
| `DevDataSeeder` | `@Profile("dev")` only. Inserts one admin (`admin@gmail.com` / `123456789`) if absent, links the `ADMIN` role seeded by the Flyway baseline. Idempotent. Nothing else is seeded — bulk demo data comes from `demo_data_script.sql` at the repository root. |
| `AsyncMailConfig` | Thread pool for post-commit mail dispatch. `app.mail.async=false` switches to synchronous sending so tests can assert immediately after an HTTP call. |
| `OpenApiConfig` | Swagger metadata and the bearer security scheme. UI at `/swagger-ui.html`. |

### Configuration surface (`application.yml`)

Every value is environment-overridable. The groups that matter:

| Prefix | Controls |
| --- | --- |
| `spring.datasource` / `spring.jpa` | PostgreSQL connection, UTC timezone, `ddl-auto: none`, `default_batch_fetch_size: 100` to collapse lazy-collection N+1 into `IN` queries |
| `spring.flyway` | migration toggle and baseline behaviour |
| `spring.mail` | SMTP host plus **mandatory** connect/read/write timeouts (5s). JavaMail defaults to an infinite wait; hosts that silently drop outbound SMTP would otherwise hang the request thread until nginx returns 504 |
| `storage.s3` | bucket, region, endpoint, credentials, presigned-URL TTL. `bucket-name` has **no default** so a misconfigured deploy fails at startup instead of writing to the wrong bucket |
| `vnpay` | merchant code, hash secret, pay URL, return URLs, min/max top-up amount |
| `wallet.withdrawal` | feature flag, minimum amount, transfer-content template, receipt limits, risk thresholds, export row cap |
| `app.cors` | allowed origins/methods/headers, credentials |
| `app.security.rate-limit` | per-endpoint-class limits and windows, cache size, trusted proxies |
| `app.prediction` | takeout rates, wager bounds, odds and payout caps, display seed |
| `app.auth` | JWT secret, access TTL (15 min), refresh TTL (7 days), OTP TTLs, refresh-cookie name/flags, Google client id |
| `management` | only `health` is exposed, with liveness/readiness probes and `show-details: never` |

### Profiles

| Profile | Differences |
| --- | --- |
| `dev` | SQL logging off, object storage defaults to the MinIO container (`localhost:9000`, `minioadmin`) |
| `prod` | `refresh-cookie-secure=true`, `SameSite=Strict`, `server.forward-headers-strategy: native` so the app behind nginx sees the real client IP and https scheme (used by rate limiting, VNPay `vnp_IpAddr`, and cookie flags) |

---

## 3. Cross-cutting concerns

### 3.1 `security/`

The filter chain is stateless. `SecurityConfig` disables CSRF, form login, HTTP Basic and
logout, sets `SessionCreationPolicy.STATELESS`, and installs three filters before
`UsernamePasswordAuthenticationFilter`:

```text
RateLimitingFilter -> JwtAuthenticationFilter -> AccountStatusEnforcementFilter
```

| Class | Responsibility |
| --- | --- |
| `JwtService` | signs and verifies access tokens; TTL from `app.auth.access-token-ttl-minutes` |
| `JwtAuthenticationFilter` | reads the `Authorization: Bearer` header, populates the `SecurityContext` |
| `CustomUserDetailsService` | loads the user and maps `user_roles` to `ROLE_*` authorities |
| `AccountAwareUserDetails` | carries `UserStatus` alongside the principal so the next filter can act without a second query |
| `AccountAccessPolicy` | decides which statuses may reach which paths |
| `AccountStatusEnforcementFilter` | rejects suspended/banned accounts with `403` and its own body `{"code": "ACCOUNT_SUSPENDED"\|"ACCOUNT_BANNED", "message": ...}`; the frontend interceptor keys off exactly these codes |
| `RateLimitingFilter` | Caffeine-backed counters per endpoint class (login, upload, prediction submit, forgot-password, reset-password) |
| `RestAuthenticationEntryPoint` / `RestAccessDeniedHandler` | JSON `401` / `403` instead of Spring's HTML defaults |
| `ProductionCookiePropertiesValidator` | fails startup under `prod` if the refresh cookie is not `Secure` |
| `CorsProperties` / `AppSecurityProperties` | typed binding for `app.cors.*` and `app.security.*` |

Response headers set on every request: Content-Security-Policy (frame-src limited to
`youtube-nocookie.com`, img-src to `i.ytimg.com`), `Referrer-Policy: strict-origin-when-cross-origin`,
`X-Frame-Options: DENY`, and a Permissions-Policy denying camera, microphone and geolocation.

**Authorization is prefix-driven.** Adding a controller under an existing prefix inherits
its role automatically:

| Matcher | Access |
| --- | --- |
| `/api/v1/auth/**`, `/api/v1/files/download/**`, `/actuator/health**`, `/uploads/**`, `/v3/api-docs**`, `/swagger-ui/**`, `/error` | permit all |
| `GET` on `/api/v1/{horses,tournaments,races,blogs,standings,leaderboard}/**`, `/api/v1/racing-summary`, `/api/v1/championships/*/standings`, `/api/v1/wallet/vnpay/**` | permit all |
| `/api/v1/admin/**` | `ROLE_ADMIN` |
| `/api/v1/owner/**` | `ROLE_HORSE_OWNER` |
| `/api/v1/jockey/**` | `ROLE_JOCKEY` |
| `/api/v1/referee/**` | `ROLE_REFEREE` |
| `/api/v1/organizer/**` | `ROLE_ORGANIZER` |
| everything else | authenticated |

`@EnableMethodSecurity` is on, so some controllers additionally carry `@PreAuthorize`
(`AdminUserController`, `AdminFinanceController`, `AdminPredictionController`,
`AdminDisputeController`, `AdminWalletEnforcementController`, `RefereeController`,
`RefereeContractController`, `AdminDashboardController`). These are belt-and-braces on top
of the prefix rules.

### 3.2 `common/error/`

`GlobalExceptionHandler` is the single translation point from exception to HTTP response.
Every error returns the same `ApiErrorResponse` record:

```json
{
  "timestamp": "2026-08-03T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/predictions",
  "fieldErrors": { "amount": "must be greater than or equal to 10000" }
}
```

| Exception | Status |
| --- | --- |
| `MethodArgumentNotValidException`, `ConstraintViolationException` | 400 with populated `fieldErrors` |
| `IllegalArgumentException`, `HttpMessageNotReadableException`, `MultipartException`, `MissingServletRequestPartException` | 400 |
| `ResponseStatusException` | the status it carries (services use this for business rejections) |
| `NoResourceFoundException` | 404 |
| anything else | 500, message flattened to `Unexpected server error` |

One response does **not** use this shape: `AccountStatusEnforcementFilter` runs inside the
filter chain, before `@ControllerAdvice` can see the request, and writes
`{"code": ..., "message": ...}` directly. That is why the frontend interceptor checks for a
`code` field on `403` responses specifically.

### 3.3 `filestorage/`

| Class | Responsibility |
| --- | --- |
| `ObjectStorage` | interface over the object store |
| `S3ObjectStorage` / `S3Configuration` / `S3Properties` | AWS SDK v2 client; works against MinIO locally and Cloudflare R2 in production because both speak S3 |
| `StoredFileMetadata` + repository | database row per uploaded object: owner, content type, visibility |
| `FileStorageService` | upload, download, presigned URL issuance |
| `FileAccessAuthorizationService` | decides whether the caller may read a private object |
| `FileStorageController` | `POST /files/upload`, public `GET /files/download/{name}`, authenticated `GET /files/private/{name}` |

A file is only usable in the environment whose database holds its metadata row. Pointing a
`dev` database at the production bucket produces dangling references in both directions.

`common/upload/HorseFileStorageService` wraps this for horse images and evidence documents
with its own size limits (`app.upload.horse-image-max-bytes`, `horse-evidence-max-bytes`).

### 3.4 `notification/`

`NotificationService` writes rows other modules produce as a side effect of workflow
transitions (approvals, contract decisions, settlement outcomes). `NotificationController`
exposes list, unread count, mark-one-read and mark-all-read. Notifications are persisted,
not pushed — the frontend `NotificationBell` polls.

---

## 4. Domain modules

### 4.1 `auth/`

Entities: `AuthSession` (refresh-token family), `EmailVerificationToken`, `PasswordResetToken`.

| Service | Responsibility |
| --- | --- |
| `AuthService` | register, verify email, login, refresh, logout, forgot/reset password |
| `OneTimeTokenService` | issue and redeem OTP-style tokens with TTL |
| `TokenHashService` | tokens are stored hashed, never in plaintext |
| `OAuth2ProviderService` / `GoogleOAuth2ProviderService` | Google ID-token verification for `POST /auth/oauth/{provider}` |

Access tokens are returned in the response body; the refresh token is set as an HttpOnly
cookie (`app.auth.refresh-cookie-name`). `auth/email/` holds the dispatcher and SMTP sender.

### 4.2 `user/`

Entities: `User`, `Role`, `UserRole`, `UserRoleHistory`, `UserStatusHistory`, `RoleRequest`,
`HorseOwnerProfile`, `RefereeProfile`.

| Service | Responsibility |
| --- | --- |
| `UserService` | profile read/update, admin user search and detail |
| `UserRoleRequestService` | a user applies for `HORSE_OWNER`, `JOCKEY` or `REFEREE` |
| `AdminRoleRequestService` | approve / pass-CV / reject; grants the role and writes `UserRoleHistory` |
| `AccountEnforcementService` | `suspend`, `restore`, `ban`, `reopen`; every transition appends to `UserStatusHistory` with the acting admin |
| `OwnerProfileService`, `RefereeProfileService` | role-specific profile documents |

Status vocabularies: `UserStatus{ACTIVE, PENDING_EMAIL_VERIFY, SUSPENDED, INACTIVE, BANNED}`,
`RoleRequestStatus{PENDING, APPROVED, REJECTED, CANCELLED}`, `UserRoleStatus`, `ProfileStatus`.

### 4.3 `organization/`

One organizer account maps to one organization. `OrganizationService` covers self-service
registration (`POST /organizations`) and the admin KYB review path (approve, reject,
suspend, reactivate). Approval is what grants the `ORGANIZER` role; suspension revokes
access without deleting the tournament history. Migration `V8` added KYB idempotency keys so
a resubmitted application does not create a duplicate organization.

### 4.4 `horse/`

`Horse` and `HorseDocument`. Owners create and update their own horses
(`/api/v1/owner/horses`), attach evidence documents, and wait for admin approval
(`/api/v1/admin/horses/{id}/approve|reject`). Only approved horses appear on the public
endpoints and are selectable during tournament registration.

### 4.5 `tournament/`

`Tournament` plus `TournamentStatus`:

```text
DRAFT -> PENDING_APPROVAL -> APPROVED -> OPEN_REGISTRATION -> CLOSED_REGISTRATION
      -> PARTICIPANTS_LOCKED -> SCHEDULE_PUBLISHED -> ONGOING -> COMPLETED
                                                   (POSTPONED is reachable from APPROVED)
```

| Service | Responsibility |
| --- | --- |
| `TournamentService` | public listing/search/detail, organizer CRUD and submission, admin approval and status changes |
| `TournamentParticipationGuardService` | rejects a registration or jockey application when the same party already holds an active entry in an overlapping tournament. It compares against `ACTIVE_OWNER_STATUSES` and `ACTIVE_JOCKEY_APPLICATION_STATUSES` rather than a single status value |
| `TournamentScheduler` | `@Scheduled(fixedRate = 60000)` — advances tournaments whose window has elapsed |

`V25` added the prize-pool column.

### 4.6 `tournamentregistration/`

`TournamentRegistration` with `RegistrationStatus{PENDING, APPROVED, REJECTED, WITHDRAWN}`.
An owner submits a horse into a tournament; the organizer (or an admin) approves or rejects;
the owner may withdraw. Three controllers expose the same aggregate to the three audiences.

### 4.7 `championship/`

The staffing layer that turns an approved tournament into a runnable field.

| Entity | Meaning |
| --- | --- |
| `JockeyTournamentApplication` | jockey applies to a tournament's jockey pool |
| `JockeyInvitation` | owner offers a contract to a pooled jockey |
| `TournamentParticipant` | the locked owner–horse–jockey triple |
| `RefereeContract` | organizer hires a licensed referee |

| Service | Responsibility |
| --- | --- |
| `JockeyPoolApplicationService` | apply, withdraw, organizer/admin approve or reject |
| `JockeyInvitationContractService` | owner sends contracts, jockey accepts or rejects, admin locks/unlocks the participant list |
| `RefereeContractService` | invite, accept, decline, terminate |
| `AdminChampionshipWorkspaceService` | one aggregated read for the admin championship workspace |

Locking participants is the gate between staffing and scheduling: after
`lock-participants`, the field is frozen and races can be created against it.

### 4.8 `race/`

`Race` and `RaceParticipant`. `RaceStatus`:

```text
SCHEDULED -> CHECKING -> READY -> ONGOING -> FINISHED
          -> RESULT_SUBMITTED -> RESULT_CONFIRMED -> PUBLISHED
                                                     (CANCELLED from any pre-final state)
```

Participant-side enums: `ParticipantStatus`, `ParticipantCheckStatus`,
`ParticipantConfirmationStatus`.

`RaceService` serves the public list/search/detail/results, the admin and organizer CRUD, the
referee assignment, and the three-step result ratification (`confirm-results`,
`reopen-results`, `publish-results`). `PublicRacingSummaryController` returns the homepage
aggregate in one call; `JockeyScheduleController` returns a jockey's upcoming rides.

**`race/media/`** is a self-contained sub-module for YouTube highlights and live streams:

| Piece | Responsibility |
| --- | --- |
| `provider/` | calls the YouTube oEmbed endpoint server-side — the URL is verified against the real provider, not merely embedded in an iframe |
| `policy/` | which media type is permitted for which race state |
| `service/RaceMediaService` | draft, validate, publish, unpublish, re-verify, delete |
| `enums/` | `MediaType`, `MediaStatus{DRAFT, PUBLISHED}`, `MediaVerificationStatus`, `MediaProviderType`, `MediaBlockedReason` |

Admin and organizer get identical media APIs under their own prefixes; the public API exposes
only published, verified media, including a batched `GET /races/highlights?raceIds=` used by
the homepage instead of N single-race calls.

### 4.9 `referee/` and `result/`

`referee/` owns race-day execution: `PreRaceCheck`, `Violation`, `RefereeReport`.
`RefereeRaceDayService` is the ordered workflow —
`listAssignedRaces → getParticipants → savePreRaceChecks → startRace → finishRace →
getResultEntries → submitResults → logIncident/submitReport`, with `advanceNextStep`
driving the state machine from a single endpoint.

`result/` holds the persisted `RaceResult` with `ResultFinishStatus` (finished, did not
finish, disqualified, …) and `ResultRecordStatus`. Results become visible publicly only after
the organizer confirms and publishes them.

### 4.10 `prediction/`

Entities: `RacePrediction`, `StreakPrediction`, `StreakPredictionLeg`, `PredictionSetting`,
`PredictionSettlementJob`.

| Service | Responsibility |
| --- | --- |
| `OddsCalculationService` | pari-mutuel odds with a virtual seed: `odds = (vPool + totalRealBets) * (1 - takeout) / (vHorse + realBetsOnHorse)` |
| `PredictionService` | quote, submit, list; debits the wallet at submit time |
| `StreakPredictionService` | multi-race parlays; fair odds are multiplied, then a single end-margin (`streak-takeout`) is applied once |
| `PredictionSettlementScheduler` | `@Scheduled(fixedDelay = 5000)` polls `prediction_settlement_jobs`, settles or refunds, marks failures for admin retry |

The virtual seed exists to solve cold start and division-by-zero, and to smooth the displayed
line early in a market. It is **display-only**: settlement divides the real pool among real
winners, so the platform carries no book risk. Caps come from `app.prediction.*`
(`min-wager`, `max-wager`, `max-total-odds`, `max-payout`).

`PredictionStatus{PENDING, LOCKED, CORRECT, INCORRECT, CANCELLED, REFUNDED}`.
`V17` widened the money columns to `bigint`; `V37` added the placed odds per streak leg so a
settled leg reprices against the odds shown at bet time, not at settlement time.

Full derivation lives in [`specs/technical/08_prediction-odds-and-payout.md`](../specs/technical/08_prediction-odds-and-payout.md).

### 4.11 `wallet/`

Real money in VND. `WalletService.adjust` is the only write path into the ledger, and it
holds four contracts:

1. **Idempotent** on `(referenceType, referenceId, type)` — enforced by a fast path in code
   and a partial `UNIQUE` index in the database (`UQ_wallet_txn_idem`, `V12`).
2. **Pessimistic write lock** on the wallet row, preventing lost updates under concurrency.
3. **Non-negative guard** and a refusal to move money on a `LOCKED` wallet.
4. **`balance_after` recorded on every entry**, with wallet and ledger written in one
   transaction so history can reconstruct the balance.

`WalletTransactionType`: `TOPUP`, `BET_PLACED`, `BET_PAYOUT`, `BET_REFUND`,
`WITHDRAWAL_HOLD`, `WITHDRAWAL_REFUND`, `ADMIN_ADJUSTMENT`.

| Area | Classes |
| --- | --- |
| Top-up | `TopUpService`, `VNPayService`, `TopUpOrder`, `VNPayPaymentDetails`, `TopUpStatus{INITIATED, PENDING, SUCCESS, FAILED, EXPIRED}` |
| Withdrawal | `WithdrawalService`, `AdminWithdrawalReviewService`, `AdminWithdrawalQueryService`, `WithdrawalRiskAssessmentService`, `WithdrawalPaymentService`, `WithdrawalReceiptService`, `WithdrawalReceiptCleanupService`, `WithdrawalExportService` |
| Bank details | `BankAccountService`, `VietQrService`, `UserBankAccount`, `BankDirectory` |
| Enforcement | `WalletEnforcementService`, `WalletStatus`, `WalletStatusHistory` |
| Reporting | `WalletSummaryService`, `WalletTransactionDetailService` |

Top-up flow: create order → signed VNPay URL → VNPay calls back on `return` and `ipn`. Both
callbacks run the same idempotent handler: verify signature, match the amount, reject orders
already in a terminal state, then credit the wallet keyed on the order id. The callbacks are
public `GET`s by necessity (VNPay calls them server-to-server) — the signature check is the
authentication.

Withdrawal flow: `REQUESTED` places a `WITHDRAWAL_HOLD` immediately so the same balance
cannot be withdrawn twice; `REJECTED` refunds; `PAID` settles; `CANCELLED` is user-initiated
before review. `WithdrawalRiskAssessmentService` scores velocity (`3` requests per `24h` by
default), amount anomaly (`2.0x` the user's history), and recent terminal activity.
`V33`/`V34` added database-level financial invariants and evidence uniqueness.

The feature is gated by `wallet.withdrawal.enabled`.

### 4.12 `finance/`

Admin-only reporting over the wallet ledger, split across two services:

- `AdminFinanceQueryService` — the single headline `summary(from, to)`.
- `AdminFinanceLedgerService` — everything row-level: transaction search and detail, top-up
  search, the reconciliation summary, and `orphanTopUpCredits` (top-ups credited without a
  matching order, which is the signal that a callback was mishandled).

Exports stream from `GET /admin/finance/transactions/export`. `V35`/`V36` added the reporting
indexes.

### 4.13 `dispute/`

`Dispute` and `DisputeAttachment` with `DisputeStatus{OPEN, IN_PROGRESS, ESCALATED, RESOLVED, REJECTED}`,
plus `DisputeCategory`, `DisputePriority`, `DisputeReferenceType`, `DisputeRole`.
Spectators raise disputes against a referenced entity (a race, a settlement, a withdrawal);
admins triage them. `AccountAppealService` is a separate path for suspended or banned users to
contest enforcement — `V29` added the guard preventing repeat appeals against the same action.

### 4.14 `blog/`, `leaderboard/`, `dashboard/`

`blog/` publishes editorial posts by slug (`BlogStatus`, admin CRUD, public read).
`leaderboard/` serves overall standings, per-championship standings, and the spectator
prediction leaderboard. `dashboard/` aggregates the admin overview in a single query set
rather than letting the frontend fan out.

---

## 5. Scheduled jobs

| Job | Cadence | Effect |
| --- | --- | --- |
| `PredictionSettlementScheduler.pollAndProcessJobs` | `fixedDelay = 5s` | drains the settlement job queue; failures are recorded and retryable from the admin UI |
| `TournamentScheduler.checkTournamentStatusTransitions` | `fixedRate = 60s` | moves tournaments across time-driven status boundaries |
| `WithdrawalReceiptCleanupService` | cron `wallet.withdrawal.payment.orphan-cleanup-cron` (default `0 30 3 * * *`) | deletes receipt uploads never attached to a withdrawal within the expiry window |

---

## 6. Persistence

The schema is owned solely by Flyway. There is no `schema.sql` and no hand-maintained DDL
script; `V1__baseline.sql` was generated from the JPA entities and every change since is an
additive migration.

| Range | Theme |
| --- | --- |
| `V1` | baseline: users, roles, horses, tournaments, races, results, referee artefacts, blogs |
| `V2`–`V6` | prediction evolution: dynamic odds, predicted position, head-to-head, streaks, enum cleanup |
| `V7`–`V8` | organizer schema and KYB idempotency |
| `V9`–`V10` | notifications, password-reset attempt tracking |
| `V11`–`V12` | remove point gamification; rename `user_point_accounts`/`point_transactions` to `wallets`/`wallet_transactions`, widen to `bigint`, add `balance_after` and the idempotency index |
| `V13`–`V16` | top-up orders, withdrawal requests, bank accounts |
| `V17`–`V20` | money-column widening, dropped top-3 columns, enum validation, prediction settings |
| `V21`–`V24` | OAuth provider column, performance indexes, race media, live stream |
| `V25`–`V29` | prize pool, enforcement audit, wallet status history, disputes, appeal guard |
| `V30`–`V39` | withdrawal operations, bank directory, receipts, financial invariants, finance indexes, streak leg odds, description widening, VNPay payment details |

Two gotchas the code encodes:

- **`@Lob String` breaks on PostgreSQL** — Hibernate reads such a column as an OID. Long text
  fields use `@JdbcTypeCode(SqlTypes.LONGVARCHAR)`; `V38` widened the wallet transaction
  description accordingly.
- **Migrations run on PostgreSQL only.** Tests use H2 with `create-drop` and Flyway disabled,
  so migration-specific behaviour is covered by dedicated tests
  (`FlywayMigrationNamingTest`, `WithdrawalFinancialInvariantMigrationTest`,
  `FinanceReportingMigrationTest`) rather than by the general suite.

---

## 7. Tests

74 test classes under `backend/src/test`, mirroring the main package tree. They run on H2
with no Docker requirement:

```bash
cd backend && ./mvnw test
```

| Group | Examples |
| --- | --- |
| Security | `RoleAuthorizationIntegrationTest`, `SecurityHardeningIntegrationTest`, `JwtServiceTest`, `RateLimitingFilterTest` |
| Money | `StreakWalletAccountingIntegrationTest`, `WithdrawalPaymentIntegrationTest`, `WithdrawalRiskAssessmentServiceTest`, `TopUpPaymentDetailIntegrationTest` |
| Odds and settlement | `OddsCalculationServiceTest`, `PredictionSettlementSchedulerTest`, `PredictionServiceRefundTest` |
| Workflow | `TournamentRegistrationIntegrationTest`, `JockeyInvitationContractIntegrationTest`, `RefereeRaceResultValidationIntegrationTest` |
| Schema and contracts | `FlywayMigrationNamingTest`, `EnumStatusContractTest`, `SchemaScriptGenerationTest` |

**Isolation convention:** integration tests must call `TestDatabaseCleaner.clean()` in
`@BeforeEach`. Tests that are not `@Transactional` commit rows that otherwise leak into later
tests — this has previously produced foreign-key failures that reproduced only in CI, where
the execution order differs.

---

## 8. Where to start for a common change

| Task | Entry point |
| --- | --- |
| Add an endpoint to an existing domain | the domain's `controller`, then `service`; the URL prefix already decides authorization |
| Add a new role-gated area | add the prefix rule in `SecurityConfig`, then mirror it in `frontend/src/utils/routeAccess.ts` |
| Change a status vocabulary | the `enums` package, the Flyway `CHECK` constraint, and `EnumStatusContractTest` |
| Touch money | `WalletService.adjust` only — never write `wallet_transactions` directly |
| Add a scheduled job | follow `TournamentScheduler`; keep the transactional unit inside the service, not the scheduler |
| Change error shape | `GlobalExceptionHandler` and `ApiErrorResponse`; the frontend `httpClient` reads `code` for account status |
