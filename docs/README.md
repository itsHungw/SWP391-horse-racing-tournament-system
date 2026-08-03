# Horse Racing Tournament Management System Documentation

This folder documents the current source code of the Horse Racing Tournament Management System. It is written for two audiences:

- lecturers/reviewers who need the product scope, business process, database design, and implementation evidence;
- developers who need a source-aligned reference for backend packages, frontend routes, APIs, migrations, and tests.

The documentation follows the source structure in `backend/src` and `frontend/src`. When source behavior changes, update the matching document here.

## Source Snapshot

- Backend: Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA, Spring Security, Flyway, PostgreSQL.
- Frontend: React 19, Vite 6, TypeScript, React Router 7, Axios, Tailwind CSS 4.
- Database: Flyway migrations live in `backend/src/main/resources/db/migration`; the active runtime driver is PostgreSQL.
- Tests: backend tests live under `backend/src/test`; frontend Vitest tests live under `frontend/src`.

## Reading Path For Project Report

1. `specs/product/01_project-overview.md`
2. `specs/product/02_scope-and-non-goals.md`
3. `specs/product/03_roles-and-user-stories.md`
4. `specs/business/01_domain-model.md`
5. `specs/business/02_business-rules.md`
6. `specs/business/03_workflows.md`
7. `specs/data/01_database-design.md`
8. `specs/technical/01_tech-stack.md`
9. `specs/technical/02_backend-architecture.md`
10. `specs/technical/03_frontend-architecture.md`
11. `specs/delivery/01_implementation-checklist.md`

## Reading Path For Developers

1. `reference/backend-source-guide.md` - package-by-package walkthrough of `backend/src`
2. `reference/frontend-source-guide.md` - directory-by-directory walkthrough of `frontend/src`
3. `reference/api-endpoints.md` - all 264 endpoints with their access requirements
4. `specs/technical/01_tech-stack.md`
5. `specs/data/01_database-design.md`
6. `specs/data/02_erd-and-status-lifecycles.md`
7. `specs/business/02_business-rules.md`
8. `specs/technical/08_prediction-odds-and-payout.md`

The `reference/` folder documents the code as it exists and is the place to look when
changing it. The `specs/` folder documents what the product does and why, and is the place to
look when explaining it.

## Documentation Structure

- `reference/`: source-level guides for backend, frontend, and the API surface.
- `specs/product/`: product overview, scope, roles, user stories.
- `specs/business/`: domain model, business rules, workflows, prediction, blog publishing.
- `specs/technical/`: tech stack, backend/frontend architecture, API/UI contract, errors, AI notes, file storage, prediction odds.
- `specs/data/`: schema, relationships, status lifecycles, migration notes.
- `specs/delivery/`: implementation and verification checklist.
- `ba/`: business-analysis notes for organizer and wallet/payment features.
- `superpowers/`: historical implementation design notes and task plans.
- `reports/`: audits and task history.

## Core System Layers

The product has three connected layers:

1. Core racing operations: account, role approval, organization onboarding, horse management, tournament registration, championship participation, race scheduling, referee race-day operations, results.
2. Organizer marketplace layer: approved organizer accounts create and operate tournaments under platform/admin governance.
3. Engagement and money layer: public blogs, VND wallet, VNPay top-up, withdrawal review, spectator prediction wagers, odds, payout settlement, leaderboard and admin audit.

The legacy point gamification model has been removed from the active product. A compatibility endpoint still exposes wallet balance through `/api/v1/point-accounts/me` for older frontend contracts, but the source of truth is the wallet module.
