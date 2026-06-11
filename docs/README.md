# Horse Racing Tournament Management System Documentation

This folder documents the current source code of the Horse Racing Tournament Management System. It is written for two audiences:

- lecturers/reviewers who need to understand the product scope, business process, database design, and implementation evidence;
- developers who need a source-aligned reference for backend packages, frontend routes, APIs, migrations, and tests.

The documentation follows the source structure in `backend/src` and `frontend/src`. When the source changes, update the matching document in this folder.

## Source Snapshot

- Backend: Spring Boot 4, Java 21, Spring Web, Spring Data JPA, Spring Security, Flyway, SQL Server.
- Frontend: React 19, Vite 6, TypeScript, React Router 7, Axios, Tailwind CSS 4.
- Database: schema is owned solely by the Flyway baseline in `backend/src/main/resources/db/migration/V1__baseline.sql` (SQL Server), generated from the JPA entities.
- Tests: backend integration/unit tests under `backend/src/test`, frontend Vitest tests under `frontend/src`.

## Reading Path For Project Report

1. `specs/product/01_project-overview.md`
2. `specs/product/02_scope-and-non-goals.md`
3. `specs/product/03_roles-and-user-stories.md`
4. `specs/business/01_domain-model.md`
5. `specs/business/03_workflows.md`
6. `specs/data/01_database-design.md`
7. `specs/technical/01_tech-stack.md`
8. `specs/technical/02_backend-architecture.md`
9. `specs/technical/03_frontend-architecture.md`
10. `specs/delivery/01_implementation-checklist.md`

## Reading Path For Developers

1. `specs/technical/01_tech-stack.md`
2. `specs/technical/02_backend-architecture.md`
3. `specs/technical/03_frontend-architecture.md`
4. `specs/technical/04_api-and-ui.md`
5. `specs/data/01_database-design.md`
6. `specs/data/02_erd-and-status-lifecycles.md`
7. `specs/business/02_business-rules.md`

## Documentation Structure

- `specs/product/`: product overview, scope, roles, user stories.
- `specs/business/`: business domain, rules, workflows, prediction game, blog rewards.
- `specs/technical/`: tech stack, backend/frontend architecture, API/UI contract, errors, AI notes, file storage.
- `specs/data/`: schema, relationships, status lifecycles, migration notes.
- `specs/delivery/`: implementation and verification checklist.
- `superpowers/`: implementation design notes and task plans created during development.
- `reports/`: audits and task history.

## Core System Layers

The product has two connected layers:

1. Core racing operations: account, role approval, horse management, tournament registration, championship participation, race scheduling, referee race-day operations, results.
2. Engagement layer: public blogs, blog reward points, spectator prediction challenges, prediction settlement, admin audit.

Game points are internal virtual points only. The application does not support deposits, withdrawals, cash conversion, odds, or user-to-user betting pools.
