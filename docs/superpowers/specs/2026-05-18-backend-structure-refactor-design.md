# Backend Structure Refactor Design

## 1. Purpose

This design standardizes the backend around a domain-first package structure before substantial implementation begins.

The goal is to make the codebase easier to grow, easier to navigate, and better aligned with the system's business modules.

## 2. Current State

The backend currently has a root-level layer-first structure:

```text
com.example.horseracingtournamentsystem
├─ config
├─ controller
├─ dto
├─ model
├─ repository
└─ service
```

This is acceptable for a small CRUD application, but it does not fit the planned scope of this system, which already includes separate domains such as auth, users, horses, tournaments, races, predictions, notifications, file storage, and AI insight.

The documentation also contains a baseline mismatch:

- `docs/specs/technical/01_tech-stack.md` still states Java 17+ and Spring Boot 3.x.
- The current auth plan targets Java 21 and Spring Boot 4.

## 3. Recommended Architecture

Use a **domain-first outer structure** with **layering inside each domain**.

```text
com.example.horseracingtournamentsystem
├─ auth
│  ├─ controller
│  ├─ dto
│  ├─ model
│  ├─ repository
│  └─ service
├─ user
│  ├─ controller
│  ├─ dto
│  ├─ model
│  ├─ repository
│  └─ service
├─ horse
├─ tournament
├─ race
├─ referee
├─ result
├─ prediction
├─ blog
├─ notification
├─ filestorage
├─ aiinsight
├─ security
├─ common
│  ├─ config
│  ├─ exception
│  ├─ response
│  └─ util
└─ BackendApplication.java
```

## 4. Design Principles

### 4.1 Domain-first at package level

Files that change together should live together. Each business area owns its controllers, DTOs, models, repositories, and services instead of spreading them across global folders.

### 4.2 Layering remains intact inside each domain

The internal dependency flow remains:

```text
Controller -> Service -> Repository -> Database
```

This refactor changes package organization, not the architectural responsibilities.

### 4.3 Shared code is explicit

Cross-cutting code should live outside business domains:

- `security` for authentication and authorization infrastructure,
- `common.config` for shared configuration,
- `common.exception` for global exception handling,
- `common.response` for shared API envelopes,
- `common.util` for truly reusable helpers.

Shared code must stay small and intentional; domain logic should not leak into `common`.

## 5. Package Responsibilities

| Package | Responsibility |
| --- | --- |
| `auth` | registration, verification, login, refresh sessions, password reset |
| `user` | user profile, roles, role requests |
| `horse` | horse lifecycle and approvals |
| `tournament` | tournaments and tournament registration |
| `race` | race setup, invitations, participant assignments |
| `referee` | pre-race checks, violations, referee reports |
| `result` | official results and rankings |
| `prediction` | spectator prediction game |
| `blog` | blogs and reading rewards |
| `notification` | notification delivery and inbox |
| `filestorage` | storage abstractions and implementations |
| `aiinsight` | AI Race Insight feature |
| `security` | JWT, current user lookup, access-denied handling |
| `common` | shared technical infrastructure only |

## 6. Documentation Changes

### 6.1 `docs/specs/technical/02_backend-architecture.md`

Update the document to say:

- the backend is organized by domain,
- each domain follows controller/service/repository layering,
- shared infrastructure belongs to `security` and `common`,
- package examples should match the final directory tree.

### 6.2 `docs/specs/technical/01_tech-stack.md`

Update the backend baseline to:

- Java 21,
- Spring Boot 4.x.

This keeps the general technical documentation consistent with the current implementation direction and auth plan.

### 6.3 Auth plan consistency

Review auth planning documents and keep them aligned with the final package layout. The existing auth plan is already largely domain-first and should remain the reference pattern for future modules.

## 7. Scope of the Refactor

Included:

- create the final domain-first package tree,
- remove the empty root-level layer packages,
- update backend architecture documentation,
- update tech stack documentation,
- ensure the auth plan remains consistent with the final package strategy.

Excluded:

- implementing business features,
- renaming business concepts,
- adding new endpoints,
- changing database schema,
- changing runtime behavior.

## 8. Testing and Verification

Because the backend currently contains almost no application code, the refactor is mostly structural.

Verification should include:

1. the new package tree exists,
2. obsolete empty root-layer folders are removed,
3. docs mention domain-first organization consistently,
4. Java/Spring baseline documentation is synchronized,
5. the existing backend test suite still passes.

## 9. Expected Benefits

- easier navigation as the codebase grows,
- clearer domain boundaries,
- better support for parallel development,
- lower risk of oversized global service/controller folders,
- package structure that reflects the business model rather than an early-stage tutorial layout.
