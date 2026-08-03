# Horse Racing Tournament System

A platform for running professional horse-racing championships end to end: organizers host
tournaments, owners enter horses, jockeys contract to ride, referees officiate and file
results, admins govern the whole thing, and spectators follow races and place real-money
predictions on them.

Built as an SWP391 capstone project. Java 21 / Spring Boot backend, React / TypeScript
frontend, PostgreSQL, deployed at [app.aqueduct.me](https://app.aqueduct.me).

---

## Contents

- [What the system does](#what-the-system-does)
- [Architecture](#architecture)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Tests](#tests)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## What the system does

### Roles

| Role | Responsibility |
| --- | --- |
| Spectator | browses races, follows results, tops up a wallet, places predictions |
| Horse owner | registers horses, enters them into tournaments, contracts jockeys |
| Jockey | applies to tournament jockey pools, accepts riding contracts, rides a schedule |
| Referee | performs pre-race checks, runs race day, submits the result package |
| Organizer | operates one organization: creates tournaments, vets entries, hires referees, schedules races, ratifies results |
| Admin | platform governance: role approvals, KYB review, tournament approval, disputes, finance, enforcement |

A single account can hold several roles, and the header switches between the corresponding
workspaces.

### Three moderation gates

The platform is B2B2C — organizers run the events, the platform governs them. Three gates
separate self-service from published fact:

1. **Onboarding.** An organization registers, an admin reviews the KYB submission, approval
   grants the `ORGANIZER` role.
2. **Tournament approval.** An organizer drafts a tournament and submits it; an admin
   approves or rejects before registration can open.
3. **Result confirmation.** A referee submits the result package; the organizer confirms and
   publishes, or reopens it for correction. Nothing is public — and no wager settles — until
   it is published.

### Money

Wallets hold real VND. Top-ups run through VNPay; withdrawals go through a request-and-review
flow with a hold placed at request time. Predictions are pari-mutuel: winners divide the real
pool after a configured takeout, so the platform carries no book risk. Every movement is a
row in an append-only ledger that records the balance after the entry.

---

## Architecture

```text
                    ┌─────────────────────────┐
   browser ────────▶│  React SPA (Vercel)     │
                    │  role-gated workspaces  │
                    └───────────┬─────────────┘
                                │ HTTPS  /api/v1
                    ┌───────────▼─────────────┐
                    │  nginx (TLS)            │
                    └───────────┬─────────────┘
                                │ 127.0.0.1:8080
                    ┌───────────▼─────────────┐        ┌──────────────┐
                    │  Spring Boot            │───────▶│  Cloudflare  │
                    │  stateless JWT          │        │  R2 (S3 API) │
                    │  domain modules         │        └──────────────┘
                    └───────────┬─────────────┘
                                │ JDBC                 ┌──────────────┐
                    ┌───────────▼─────────────┐        │  VNPay       │
                    │  PostgreSQL (Flyway)    │◀──────▶│  payments    │
                    └─────────────────────────┘        └──────────────┘
```

**Backend** is a domain-first modular monolith. Each module owns its controllers, DTOs,
entities, repositories and services; cross-module work goes through the owning service rather
than another module's repository. Authorization is decided by URL prefix in one place, so a
new controller under `/api/v1/organizer/**` inherits organizer access automatically.

**Frontend** is a single-page app with lazy-loaded role workspaces. Public pages ship
eagerly; the admin, organizer, owner, jockey and referee bundles are never downloaded by an
anonymous visitor.

**Session model** — a short-lived access token held in memory only, plus an HttpOnly refresh
cookie. No credential is written to `localStorage`, and a `401` triggers one silent refresh
and a replay of the original request.

---

## Technology

| Layer | Choice |
| --- | --- |
| Language | Java 21, TypeScript 5.8 |
| Backend | Spring Boot 4.0.6 — Web MVC, Data JPA, Security, Validation, Actuator, Mail |
| Persistence | PostgreSQL 17, Flyway (39 migrations), Hibernate |
| Auth | JWT access tokens, HttpOnly refresh cookies, Google OAuth, BCrypt |
| Object storage | AWS SDK v2 S3 client — MinIO locally, Cloudflare R2 in production |
| Payments | VNPay (sandbox and production), VietQR for withdrawal transfers |
| API docs | springdoc-openapi (Swagger UI) |
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 4, Axios, framer-motion |
| Charts / OCR | lightweight-charts, tesseract.js |
| Tests | JUnit + Spring Boot Test on H2 (74 classes), Vitest + Testing Library (96 files) |
| CI/CD | GitHub Actions to GHCR and a DigitalOcean droplet; Vercel for the frontend |

---

## Repository layout

```text
.
├── backend/                Spring Boot service (see backend/README.md)
├── frontend/               React SPA (see frontend/README.md)
├── docs/                   product specs, source reference, BA notes, audits
├── infra/                  nginx config, database backup script, prod env template
├── documents/              SWP391 deliverable templates and completed reports
├── pptx/                   defense and business-flow presentation decks
├── docker-compose.yml      local PostgreSQL + MinIO
├── docker-compose.prod.yml production stack for the VPS
├── demo_data_script.sql    full demo dataset (no money rows — see below)
├── run.ps1                 loads .env, then runs the backend on Windows
├── DESIGN.md               design system
└── PRODUCT.md              product positioning and voice
```

---

## Local development

**Prerequisites:** Docker, JDK 21, Node 20+.

### 1. Start the local infrastructure

```bash
cp .env.example .env
docker compose up -d
```

This brings up PostgreSQL on `localhost:5432` and MinIO on `localhost:9000` (console on
`9001`), and creates the dev bucket. Defaults come from `.env`:
`horseracing` / `horseracing` / `local123` for the database, `minioadmin` / `minioadmin` for
object storage.

### 2. Run the backend

```bash
cd backend && SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

On Windows, run `./run.ps1` from the repository root instead — it loads `.env` into the
process environment first, because Spring Boot does not read `.env` natively and Maven only
inherits the shell's environment.

Flyway builds the schema on first boot. The API is on `http://localhost:8080`, Swagger UI on
`http://localhost:8080/swagger-ui.html`.

### 3. Run the frontend

```bash
cd frontend && npm install && npm run dev
```

Vite serves `http://localhost:5173` and proxies `/api` and `/uploads` to the backend, so no
CORS setup is needed locally.

### Accounts

The `dev` profile seeds exactly one account on first boot — `admin@gmail.com` / `123456789`
— and nothing else. It never runs under `prod`, so there is no default credential in
production.

For a populated environment, run `demo_data_script.sql` against a database that has already
been migrated. It creates admins, referees, owners, jockeys, organizers, organizations,
tournaments across every lifecycle stage, races, results and referee reports.

It deliberately seeds **no money**: no wallets, wallet transactions, top-up orders,
predictions or withdrawals. A balance inserted directly into the database has no top-up order
or admin action to reconcile against, so the transaction history could not reconstruct it —
the real-money ledger must be written by the application. To demonstrate the money flow, top
up through VNPay sandbox and place a wager on an upcoming race.

### Resetting the database

```bash
docker compose down -v && docker compose up -d
```

Required once after pulling a change that rewrites migration history.

---

## Configuration

All configuration is environment variables, resolved by
`backend/src/main/resources/application.yml` and the `application-dev.yml` /
`application-prod.yml` overlays. `.env` is gitignored — keep `.env.example` current instead.

| Group | Variables |
| --- | --- |
| Database | `DB_URL`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` |
| Auth | `AUTH_JWT_SECRET`, `GOOGLE_CLIENT_ID`, `APP_AUTH_COOKIE_SECURE` |
| Object storage | `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_REGION`, `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_ACCESS_KEY`, `OBJECT_STORAGE_SECRET_KEY` |
| Payments | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_FRONTEND_RETURN_URL`, `VNPAY_MIN_AMOUNT`, `VNPAY_MAX_AMOUNT` |
| Mail | `APP_MAIL_ENABLED`, `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` |
| CORS | `APP_CORS_ALLOWED_ORIGINS` |
| Rate limiting | `APP_RATE_LIMIT_*` |
| Predictions | `APP_PREDICTION_*` |
| Withdrawals | `WALLET_WITHDRAWAL_*` |

Each environment pairs **its own database** with **its own object store**, and the two must
never be crossed — a stored file is only usable in the environment whose database holds its
metadata row.

| | Database | Object store | Spring profile |
| --- | --- | --- | --- |
| Local | PostgreSQL (Docker) | MinIO (Docker, S3-compatible) | `dev` |
| Cloud | PostgreSQL on the VPS | Cloudflare R2 bucket | `prod` |

Two settings are deliberately strict:

- **`OBJECT_STORAGE_BUCKET` has no default.** A misconfigured deploy fails at startup rather
  than writing into the wrong bucket.
- **SMTP timeouts are mandatory.** JavaMail waits forever by default. Hosts that silently
  drop outbound SMTP would otherwise hang the request thread until nginx returns a 504, so
  connect/read/write timeouts are set to 5s and the failure surfaces in the logs.

---

## Tests

```bash
cd backend  && ./mvnw test     # JUnit on H2 — no Docker required
cd frontend && npm test -- --run
```

Backend integration tests must call `TestDatabaseCleaner.clean()` in `@BeforeEach`. Tests
that are not `@Transactional` commit rows that leak into later tests; skipping the cleaner has
previously produced foreign-key failures that reproduced only in CI, where the ordering
differs.

---

## Deployment

The frontend deploys itself through Vercel's GitHub integration and is intentionally not part
of the workflow.

The backend pipeline (`.github/workflows/deploy.yml`) runs on pushes to `main` that touch
`backend/**`, `docker-compose.prod.yml`, or the workflow itself:

```text
./mvnw verify  →  build linux/amd64 image  →  push to GHCR  →  SSH to droplet  →  compose up
```

On the VPS, `docker-compose.prod.yml` runs the backend alongside a self-hosted PostgreSQL on
the same Docker network. Neither is published to the internet: PostgreSQL is only reachable
inside the network, and the backend binds to `127.0.0.1:8080`, with nginx on the host
terminating TLS and proxying to it. Resource limits are sized for a 4 GB droplet.

Set `SPRING_PROFILES_ACTIVE=prod`. The backend receives
`DB_URL=jdbc:postgresql://postgres:5432/${DB_NAME}` from `docker-compose.prod.yml`, while
`infra/.env.prod` supplies the credentials and the Cloudflare R2 variables
(`OBJECT_STORAGE_REGION=auto` for R2). Production requires a `Secure` refresh cookie —
`ProductionCookiePropertiesValidator` fails startup otherwise — and enables
`forward-headers-strategy: native` so rate limiting, VNPay's `vnp_IpAddr` and cookie flags see
the real client IP and scheme through nginx.

`infra/` holds the nginx server block, the database backup script, and the production env
template.

---

## Documentation

### Working on the code

| Document | Covers |
| --- | --- |
| [docs/reference/backend-source-guide.md](docs/reference/backend-source-guide.md) | every backend package, the security chain, schedulers, migrations, test conventions |
| [docs/reference/frontend-source-guide.md](docs/reference/frontend-source-guide.md) | routing and guards, session handling, API layer, design tokens, component map |
| [docs/reference/api-endpoints.md](docs/reference/api-endpoints.md) | all 264 endpoints with their access requirements |
| [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md) | per-service quick starts |

### Understanding the product

Start at [docs/README.md](docs/README.md), which sets out two reading paths — one for the
project report, one for developers. The specifications live under
[docs/specs/](docs/specs/): product scope and roles, domain model and business rules,
database design and status lifecycles, technical architecture, and the
[prediction odds and payout model](docs/specs/technical/08_prediction-odds-and-payout.md).

[docs/ba/](docs/ba/) holds the business-analysis notes for the organizer role and the
wallet/payments feature; [docs/db/](docs/db/) holds schema notes and the demo-database
runbook; [docs/reports/](docs/reports/) holds audits.
