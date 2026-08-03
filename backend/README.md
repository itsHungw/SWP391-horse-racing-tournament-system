# Backend

Spring Boot 4 service on Java 21. Serves the whole API under `/api/v1`, owns the PostgreSQL
schema through Flyway, and integrates with S3-compatible object storage and VNPay.

For the package-by-package walkthrough see
[docs/reference/backend-source-guide.md](../docs/reference/backend-source-guide.md); for the
endpoint inventory see [docs/reference/api-endpoints.md](../docs/reference/api-endpoints.md).

## Requirements

- JDK 21
- PostgreSQL 17 and an S3-compatible object store — both provided by the repository-root
  `docker-compose.yml` (PostgreSQL + MinIO)

## Running

From the repository root, start the infrastructure once:

```bash
cp .env.example .env && docker compose up -d
```

Then run the service:

```bash
cd backend && SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

On Windows use `./run.ps1` from the repository root — it loads `.env` into the process
environment before invoking Maven, which Spring Boot does not do on its own.

| Surface | URL |
| --- | --- |
| API | `http://localhost:8080/api/v1` |
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |
| Health | `http://localhost:8080/actuator/health` |

The `dev` profile seeds one admin on first boot (`admin@gmail.com` / `123456789`) and nothing
else. It is disabled under `prod`.

## Tests

```bash
./mvnw test        # unit + integration on H2, no Docker required
./mvnw verify      # what CI runs
```

74 test classes mirror the main package tree. Two conventions matter:

- **Call `TestDatabaseCleaner.clean()` in `@BeforeEach`** for integration tests. Tests that
  are not `@Transactional` commit rows that leak into later tests, which has produced
  foreign-key failures reproducing only in CI.
- **Migrations are PostgreSQL-only.** Tests run on H2 with `create-drop` and Flyway disabled,
  so migration behaviour is covered by dedicated tests (`FlywayMigrationNamingTest`,
  `WithdrawalFinancialInvariantMigrationTest`, `FinanceReportingMigrationTest`) rather than by
  the general suite.

## Package structure

```text
com.example.horseracingtournamentsystem
├── auth            registration, login, refresh, OAuth, password reset
├── blog            editorial content
├── championship    jockey pool, contracts, participant locking
├── common          error contract, upload helpers
├── config          mail async, OpenAPI, dev seeder
├── dashboard       admin overview
├── dispute         disputes and account appeals
├── filestorage     object storage and access control
├── finance         admin ledger reporting
├── horse           horse registry
├── leaderboard     standings
├── notification    in-app notifications
├── organization    organizer onboarding and KYB
├── prediction      wagers, odds, settlement
├── race            scheduling, results, race media
├── referee         race-day operations
├── result          race result persistence
├── security        JWT, filters, CORS, rate limiting
├── tournament      tournament lifecycle
├── tournamentregistration
├── user            profiles, roles, enforcement
└── wallet          VND ledger, VNPay, withdrawals
```

Each domain follows `controller → service → repository → entity`, with request and response
DTOs at the boundary. Controllers never return entities.

## Rules that are easy to break

| Rule | Why |
| --- | --- |
| Authorization is decided by URL prefix in `SecurityConfig` | a new controller under an existing prefix inherits its role; a new prefix must be added there **and** mirrored in `frontend/src/utils/routeAccess.ts` |
| All money moves through `WalletService.adjust` | it is the only path that is idempotent, row-locked, non-negative-guarded and ledger-writing |
| The schema is owned solely by Flyway | there is no `schema.sql`; `V1__baseline.sql` was generated from the entities and every change since is additive |
| Long text columns need `@JdbcTypeCode(SqlTypes.LONGVARCHAR)` | `@Lob String` breaks on PostgreSQL — Hibernate reads the column as an OID |
| Business rejections use `ResponseStatusException` | `GlobalExceptionHandler` turns it into the standard `ApiErrorResponse`; ad-hoc exceptions become opaque 500s |

## Build

```bash
./mvnw -DskipTests clean package     # produces target/*.jar
docker build -t horse-racing-backend .
```

The Dockerfile is multi-stage: dependencies resolve in a cached layer, the JAR builds on
`eclipse-temurin:21-jdk`, and the runtime image is `21-jre` running as a non-root user with
`-XX:MaxRAMPercentage=75.0`. Tests are skipped inside the image because CI runs them natively
first.
