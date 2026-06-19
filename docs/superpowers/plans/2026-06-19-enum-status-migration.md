# Enum Status Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the status migration from raw strings to Java enums without changing the JSON values consumed by the frontend, and normalize legacy SQL data before Hibernate reads it.

**Architecture:** Entity status fields and all repository query parameters use their domain enum types. Services compare and transition enum values only; controllers parse external strings once when compatibility or custom validation is required, while response enums continue to serialize as their unchanged uppercase names. Flyway maps known legacy values to valid enum constants and rejects unsupported persisted values instead of allowing delayed hydration failures.

**Tech Stack:** Java 21, Spring Boot 4.0.6, Spring Data JPA, Hibernate, Jackson, Flyway, SQL Server, JUnit 5, Maven.

---

### Task 1: Lock the enum persistence and API contract

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/common/enums/EnumStatusContractTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthRegistrationIntegrationTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/user/entity/UserEntityMappingTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/championship/TournamentParticipantRepositoryTest.java`
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java`

- [ ] **Step 1: Add a reflection contract test**

Assert every migrated entity status field has the expected enum Java type and `@Enumerated(EnumType.STRING)`. Assert Jackson serializes representative enum values as the same uppercase strings used by existing clients.

- [ ] **Step 2: Convert existing test expectations to enums**

Replace removed entity constants such as `User.STATUS_ACTIVE` and `RaceResult.STATUS_CONFIRMED` with the corresponding enum constants.

- [ ] **Step 3: Run the focused tests to capture RED**

Run: `.\mvnw.cmd -Dtest=EnumStatusContractTest,AuthRegistrationIntegrationTest,UserEntityMappingTest,TournamentParticipantRepositoryTest,RaceIntegrationTest test`

Expected: build fails because production repository/service/controller signatures still mix `String` and enum status types.

### Task 2: Make domain and repository types consistent

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/championship/repository/JockeyInvitationRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/championship/repository/JockeyTournamentApplicationRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/RacePredictionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/repository/TournamentRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournamentregistration/repository/TournamentRegistrationRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/result/repository/RaceResultRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/RoleRequestRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/user/repository/UserRoleRepository.java`

- [ ] **Step 1: Change derived-query parameters to property enum types**

For every `status`, `statusIn`, and nested `...StatusIn` property path, use the exact enum type declared by the mapped entity property. Keep external free-text filters as strings only when the query explicitly converts the database value.

- [ ] **Step 2: Replace fully-qualified enum types with imports**

Use domain imports so method signatures remain readable and future mismatches are visible in review.

- [ ] **Step 3: Compile production sources**

Run: `.\mvnw.cmd -DskipTests compile`

Expected: remaining errors are limited to service/controller/DTO call sites, not repository declarations.

### Task 3: Complete service and controller migration

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/championship/service/AdminChampionshipWorkspaceService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/championship/service/JockeyInvitationContractService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/championship/service/JockeyPoolApplicationService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/dashboard/service/AdminDashboardService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/leaderboard/service/LeaderboardService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/AdminPredictionController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/controller/SpectatorPredictionController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/service/StreakPredictionService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/AdminRaceController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java`

- [ ] **Step 1: Replace removed constants and string comparisons**

Use enum identity/equality for domain logic and typed collections for status sets. Do not recreate compatibility string constants on entities.

- [ ] **Step 2: Parse only at API boundaries**

Where a controller must retain a `String` request parameter, normalize and convert it with `Enum.valueOf`, translating invalid input to the existing `400 Bad Request` behavior. Internal service methods accept enums.

- [ ] **Step 3: Preserve response JSON values**

Pass enum values to enum DTO fields. For legacy DTO fields that intentionally remain `String`, call `name()` at mapping time and handle nullable enum values explicitly.

- [ ] **Step 4: Compile production sources**

Run: `.\mvnw.cmd -DskipTests compile`

Expected: `BUILD SUCCESS` with zero enum type errors.

### Task 4: Normalize legacy SQL values safely

**Files:**
- Modify: `backend/src/main/resources/db/migration/V6__cleanup_enum_statuses.sql`
- Modify: `demo_data_script.sql`

- [ ] **Step 1: Correct known legacy mappings**

Map race `SCHEDULED_PUBLIC`/`SCHEDULED_PRIVATE` to `SCHEDULED`; map tournament `SCHEDULED_PUBLIC` and `SCHEDULED` to `SCHEDULE_PUBLISHED`, and `SCHEDULED_PRIVATE` to `PARTICIPANTS_LOCKED`. Never write `UPCOMING`, because it is a discovery scope rather than a `TournamentStatus` constant.

- [ ] **Step 2: Add fail-fast validation**

Use SQL Server `IF EXISTS ... THROW` guards for every migrated table so Flyway stops with the table and column identified when an unknown value exists.

- [ ] **Step 3: Make demo data enum-valid at insert time**

Replace legacy tournament `SCHEDULED_PUBLIC` values with `SCHEDULE_PUBLISHED`; keep races as `SCHEDULED` and race participants as `APPROVED`.

### Task 5: Remove migration artifacts and verify end to end

**Files:**
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/fix_enums2.js`
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/fix_enums3.js`
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/fix_enums4.js`
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/fix_enums5.js`
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/fix.js`

- [ ] **Step 1: Remove one-off source rewrite scripts**

Delete the incomplete absolute-path scripts so they cannot be rerun and corrupt the now-typed code.

- [ ] **Step 2: Run focused enum tests**

Run: `.\mvnw.cmd -Dtest=EnumStatusContractTest,AuthRegistrationIntegrationTest,UserEntityMappingTest,TournamentParticipantRepositoryTest,RaceIntegrationTest test`

Expected: all selected tests pass.

- [ ] **Step 3: Run the complete backend suite**

Run: `.\mvnw.cmd test`

Expected: `BUILD SUCCESS`, zero test failures and zero test errors.

- [ ] **Step 4: Run frontend tests affected by status JSON contracts**

Run: `npm test -- --run`

Expected: all frontend tests pass and enum JSON values remain compatible with existing string unions.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only the user's existing feature work plus deliberate enum migration changes remain.
