# Tournament Total Prize Pool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a total prize pool input field for tournament creation and display it in the workspace and spectator views.

**Architecture:** Database schema migration using Flyway, adding Java entity field/DTO validation, updating backend service mappings, and building frontend input controls and page views.

**Tech Stack:** Java, Spring Boot, Spring Data JPA, Flyway, React, TypeScript, Tailwind CSS, Lucide icons.

---

### Task 1: Database Migration

**Files:**
- Create: `backend/src/main/resources/db/migration/V25__add_tournament_prize_pool.sql`

- [ ] **Step 1: Write database migration SQL**
  Create the Flyway migration file to add the `total_prize_pool` column.
  ```sql
  ALTER TABLE tournaments ADD COLUMN total_prize_pool BIGINT NOT NULL DEFAULT 0;
  ALTER TABLE tournaments ADD CONSTRAINT chk_tournament_prize_pool CHECK (total_prize_pool >= 0);
  ```

---

### Task 2: Backend Entities, DTOs and Mappings

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/entity/Tournament.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/request/TournamentRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/response/TournamentResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/response/TournamentSummaryResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java`

- [ ] **Step 1: Update Tournament entity**
  Add the `totalPrizePool` field mapping, and update the static factories and updates to receive and set this field.
  ```java
  @Column(name = "total_prize_pool", nullable = false)
  private long totalPrizePool;
  
  // Update create/update signatures in Tournament.java:
  public static Tournament create(..., long totalPrizePool, User creator) { ... }
  public void update(..., long totalPrizePool) { ... }
  ```

- [ ] **Step 2: Update TournamentRequest DTO**
  Add validation annotations for `totalPrizePool`.
  ```java
  @NotNull(message = "Total prize pool is required")
  @Min(value = 0, message = "Total prize pool must be greater than or equal to 0")
  private Long totalPrizePool;
  ```

- [ ] **Step 3: Update response DTOs**
  Add the `totalPrizePool` property to `TournamentResponse` and `TournamentSummaryResponse`.
  ```java
  private long totalPrizePool;
  ```

- [ ] **Step 4: Update TournamentService mapper and creation**
  Update the service to map `totalPrizePool` from requests to entities and from entities to responses.

---

### Task 3: Backend Tests Correction & Verification

**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentIntegrationTest.java`

- [ ] **Step 1: Update integration test request bodies**
  Add `"totalPrizePool": 50000000` to the mock JSON bodies in `TournamentIntegrationTest.java` (e.g. `adminCanCreateTournament`, `invalidDatesReturnBadRequest`, etc.) to prevent validation failures.

- [ ] **Step 2: Run maven tests to verify they pass**
  Run: `mvn test -pl backend -Dtest=TournamentIntegrationTest`
  Expected: PASS

---

### Task 4: Frontend Types & Pages Integration

**Files:**
- Modify: `frontend/src/types/racing.ts`
- Modify: `frontend/src/pages/organizer/OrganizerTournamentFormPage.tsx`
- Modify: `frontend/src/pages/organizer/OrganizerTournamentDetailPage.tsx`
- Modify: `frontend/src/pages/public/ChampionshipsPage.tsx`
- Modify: `frontend/src/pages/public/ChampionshipDetailPage.tsx`

- [ ] **Step 1: Update TypeScript types**
  Add `totalPrizePool: number;` to the `Tournament` and `TournamentSummary` types in `frontend/src/types/racing.ts`.

- [ ] **Step 2: Integrate input field in OrganizerTournamentFormPage**
  Add a form input for `totalPrizePool` (numeric, required, min 0) to `OrganizerTournamentFormPage.tsx` and send it in the payload.

- [ ] **Step 3: Integrate input field in OrganizerTournamentDetailPage**
  Add the `totalPrizePool` field to the edit form in the **Controls** tab of `OrganizerTournamentDetailPage.tsx`, and sync form state + PUT parameters.

- [ ] **Step 4: Display prize pool in ChampionshipsPage**
  Display the prize pool formatted using `.toLocaleString()` on the public listing and highlight cards.

- [ ] **Step 5: Display prize pool in ChampionshipDetailPage**
  Render the total prize pool in the Hero Info section.

- [ ] **Step 6: Build verification**
  Run: `npm run build` inside `frontend` directory.
  Expected: Success without TS errors.
