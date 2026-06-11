# Horse Racing Tournament System

Spring Boot (Java 21) backend + React/Vite frontend. Full product and technical
specs live in [`docs/`](docs/README.md).

## Environments

Each environment pairs **its own database** with **its own object store**. They
must never be mixed (a file is only usable in the environment whose database
holds its metadata row).

| | Database | Object store | Spring profile |
| --- | --- | --- | --- |
| **Local** | SQL Server (Docker) | MinIO (Docker, S3-compatible) | `dev` |
| **Cloud** | managed SQL Server | AWS S3 bucket | `prod` |

Config is selected by `SPRING_PROFILES_ACTIVE` and environment variables; see
`backend/src/main/resources/application.yml` and the `application-dev.yml` /
`application-prod.yml` overlays. `AWS_S3_BUCKET` has no default on purpose, so a
misconfigured deploy fails fast instead of writing to the wrong bucket.

## Local development

Prerequisites: Docker, JDK 21, Node 20+.

```bash
# 1. Start local SQL Server + MinIO (creates the dev database and bucket)
cp .env.example .env
docker compose up -d

# 2. Backend (uses the dev profile -> local DB + MinIO)
cd backend
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run     # PowerShell: $env:SPRING_PROFILES_ACTIVE="dev"; ./mvnw spring-boot:run

# 3. Frontend
cd ../frontend
npm install
npm run dev
```

- MinIO S3 API: `http://localhost:9000` — console: `http://localhost:9001`
  (user/pass from `.env`, default `minioadmin` / `minioadmin`).
- SQL Server: `localhost:1433` (sa / `DB_SA_PASSWORD` from `.env`).
- `.env` is gitignored — never commit real secrets. Keep `.env.example` current.

## Tests

```bash
cd backend  && ./mvnw test     # backend (H2, no Docker needed)
cd frontend && npm test        # frontend (Vitest)
```

## Production notes

Set `SPRING_PROFILES_ACTIVE=prod`. Provide `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`
and `AWS_S3_BUCKET` (real bucket) via the environment. Leave `AWS_S3_ENDPOINT`,
`AWS_S3_ACCESS_KEY`, and `AWS_S3_SECRET_KEY` unset so the AWS SDK uses the real
endpoint and the instance IAM role.
