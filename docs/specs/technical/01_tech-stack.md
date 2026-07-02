# Tech Stack

## 1. Backend

- Java 21.
- Spring Boot 4.0.6.
- Spring Web MVC for REST APIs.
- Spring Data JPA for repository/persistence access.
- Spring Security and OAuth2 resource server dependencies for JWT-secured APIs.
- Spring Validation for DTO validation.
- Spring Mail for email verification/reset delivery.
- Flyway for database migration.
- PostgreSQL JDBC driver and Flyway PostgreSQL support.
- AWS SDK S3 for object storage.
- Caffeine for in-memory rate-limit cache.
- Lombok for entity/DTO boilerplate reduction.
- SpringDoc OpenAPI UI dependency is present for API documentation support.

Build file: `backend/pom.xml`.

## 2. Database

- Primary database engine: PostgreSQL.
- Runtime datasource config: `backend/src/main/resources/application.yml`.
- Flyway migration directory: `backend/src/main/resources/db/migration`.
- Current migration sequence: `V1__baseline.sql` through `V18__drop_top3_prediction_columns.sql`.
- Tests use H2 with Spring Boot test dependencies where configured.

Important current migrations:

- `V7__organizer_schema.sql`
- `V8__organizer_kyb_idempotency.sql`
- `V11__remove_gamification.sql`
- `V12__wallet_core_rename.sql`
- `V13__topup_orders.sql`
- `V14__withdrawal_requests.sql`
- `V15__bank_accounts.sql`
- `V16__withdrawal_cancelled_status.sql`
- `V17__widen_prediction_money_to_bigint.sql`
- `V18__drop_top3_prediction_columns.sql`

## 3. Frontend

- React 19.
- TypeScript 5.8.
- Vite 6.
- React Router 7.
- Axios.
- Tailwind CSS 4 with `@tailwindcss/vite`.
- Lucide React icons.
- Framer Motion.
- Lightweight Charts for wallet/performance charting.
- Vitest, React Testing Library, jsdom.

Build file: `frontend/package.json`.

## 4. Runtime Configuration

Backend configuration files:

- `application.yml`: base datasource, JPA, Flyway, multipart, mail, CORS, auth, upload, rate limit, prediction limits, VNPay, withdrawal.
- `application-dev.yml`: SQL logging for development.
- `application-prod.yml`: stricter refresh cookie security.

Important environment variables:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `AUTH_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_FRONTEND_BASE_URL`
- `APP_UPLOAD_ROOT`
- `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_REGION`, optional S3-compatible endpoint/credentials
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_FRONTEND_RETURN_URL`
- `VNPAY_MIN_AMOUNT`, `VNPAY_MAX_AMOUNT`
- `WALLET_WITHDRAWAL_ENABLED`, `WALLET_WITHDRAWAL_MIN_AMOUNT`
- `APP_PREDICTION_MIN_WAGER`, `APP_PREDICTION_MAX_WAGER`, `APP_PREDICTION_MAX_TOTAL_ODDS`, `APP_PREDICTION_MAX_PAYOUT`
- `APP_MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`

## 5. Test Stack

- Backend: Spring Boot test starters, Spring Security test, H2 for tests.
- Frontend: Vitest and React Testing Library.
- Test coverage focuses on integration workflows, API clients, protected routes, page behavior, wallet chart behavior, and race-day state utilities.
