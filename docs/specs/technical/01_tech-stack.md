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
- SQL Server JDBC driver.
- Lombok for entity/DTO boilerplate reduction.
- SpringDoc OpenAPI UI dependency is present for API documentation support.

Build file: `backend/pom.xml`.

## 2. Database

- Primary database engine: Microsoft SQL Server.
- Main legacy schema: `backend/src/main/resources/schema.sql`.
- Flyway migration directory: `backend/src/main/resources/db/migration`.
- Current migrations:
  - `V1__baseline_schema.sql`: baseline marker for existing deployments.
  - `V2__blog_and_point_foundation.sql`: idempotent blog, point account, point transaction, point settings, blog reward tables.
- Legacy/setup scripts: `database/001_create_tables.sql`, `database/002_bootstrap_seed.sql`, `database/003_auth.sql`, `database/004_owner_profile.sql`, `database/004_create_blogs_table.sql`, `database/900_dev_seed.sql`.

## 3. Frontend

- React 19.
- TypeScript 5.8.
- Vite 6.
- React Router 7.
- Axios.
- Tailwind CSS 4 with `@tailwindcss/vite`.
- Lucide React icons.
- Vitest, React Testing Library, jsdom.

Build file: `frontend/package.json`.

## 4. Runtime Configuration

Backend configuration files:

- `application.yml`: base datasource, JPA, Flyway, multipart, mail, CORS, auth, upload, rate limit.
- `application-dev.yml`: SQL logging for development.
- `application-prod.yml`: stricter refresh cookie security.

Important environment variables:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `AUTH_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_FRONTEND_BASE_URL`
- `APP_UPLOAD_ROOT`
- `APP_MAIL_ENABLED`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`

## 5. Test Stack

- Backend: Spring Boot test starters, Spring Security test, H2 for tests.
- Frontend: Vitest and React Testing Library.
- Test coverage focuses on integration workflows, API clients, protected routes, page behavior, and race-day state utilities.
