# PostgreSQL Status Query Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove SQL Server leftovers and harden status/enum query handling before merge.

**Architecture:** Keep schema ownership in Flyway, make entity mappings dialect-safe, and keep status filters typed at the repository boundary. Add focused regression tests around enum contracts and organizer registration filtering.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, Hibernate 7, Flyway, PostgreSQL runtime, H2 PostgreSQL mode for local tests.

---

### Task 1: Organizer Registration Status Filter

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/tournamentregistration/TournamentRegistrationIntegrationTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/repository/TournamentRegistrationRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/service/TournamentRegistrationService.java`

- [x] Add a failing MockMvc test that calls `/api/v1/organizer/tournament-registrations?status=PENDING` and proves only pending rows are returned.
- [x] Run the focused test and confirm the existing `String` repository parameter is the risk being covered.
- [x] Change the repository method to accept `RegistrationStatus`.
- [x] Parse organizer status in the service exactly like the admin path and return `400` for invalid values.
- [x] Re-run the focused test.

### Task 2: PostgreSQL-Safe Blog Content Mapping

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/common/enums/EnumStatusContractTest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/blog/entity/Blog.java`

- [x] Add a failing contract test that asserts `Blog.content` does not use SQL Server `NVARCHAR(MAX)`.
- [x] Replace the SQL Server column definition with Hibernate `@JdbcTypeCode(SqlTypes.LONGVARCHAR)`.
- [x] Re-run the contract test.

### Task 3: Forward-Only Status Validation Migration

**Files:**
- Create: `backend/src/main/resources/db/migration/V19__validate_current_status_enums.sql`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/common/enums/EnumStatusContractTest.java`

- [x] Add a failing test that validates the new migration whitelists `PENDING_APPROVAL` and `APPROVED`.
- [x] Add a forward-only Flyway migration that raises exceptions for unsupported status values using the current enum sets.
- [x] Re-run the migration contract test.

### Task 4: User Status Domain Methods

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/entity/User.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/service/UserService.java`

- [x] Replace reflection-based status updates with domain methods on `User`.
- [x] Keep admin profile status updates and soft-delete/ban semantics unchanged.
- [x] Verify existing admin user tests still pass.

### Task 5: Query Cleanup and Verification

**Files:**
- Modify: repositories with brittle nullable `CAST(:param AS ...)` filters.

- [x] Replace nullable filter casts with JPQL `:param IS NULL` checks where safe.
- [x] Replace enum string literals in JPQL with fully-qualified enum constants.
- [x] Run backend tests and frontend build.
- [x] Record verification results in the final summary.

## Completed Verification

- `.\mvnw.cmd "-Dtest=EnumStatusContractTest,TournamentRegistrationIntegrationTest#organizerFiltersTournamentRegistrationsByTypedStatus" test` passed: 8 tests.
- `.\mvnw.cmd test` passed: 190 tests, 0 failures/errors, 1 skipped.
- `npm run build` passed. Vite still reports the pre-existing large chunk warning.
- PostgreSQL migration check passed on a temporary database in `hrts-postgres`: applied `V1` through `V19`.
- `git diff --check` passed.
