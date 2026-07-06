# Tournament Total Prize Pool Feature Design Spec

This document describes the design for adding a total prize pool (tổng tiền thưởng) field to tournaments.

## Goal
To allow organizers to input a total prize pool (in VND) for a tournament upon creation and modification, and to display this prize pool to all workspace users (organizers, owners, jockeys) and public spectators.

## Requirements
- The field is **required** and must be greater than or equal to `0`.
- Stored as a `BIGINT` (in VND) in the database to align with the `Wallet` model's use of `long`.
- Formatted as a currency string on the frontend (e.g. `150,000,000 VND` or formatted Vietnamese currency).

---

## Proposed Changes

### 1. Database Layer
- **New Migration**: `V25__add_tournament_prize_pool.sql` under `backend/src/main/resources/db/migration/`
  ```sql
  ALTER TABLE tournaments ADD COLUMN total_prize_pool BIGINT NOT NULL DEFAULT 0;
  ALTER TABLE tournaments ADD CONSTRAINT chk_tournament_prize_pool CHECK (total_prize_pool >= 0);
  ```

### 2. Backend Layer

#### [Tournament.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/entity/Tournament.java)
- Add the `totalPrizePool` field:
  ```java
  @Column(name = "total_prize_pool", nullable = false)
  private long totalPrizePool;
  ```
- Update static factory `create` methods to accept `totalPrizePool`.
- Update `update` methods to accept `totalPrizePool`.

#### [TournamentRequest.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/request/TournamentRequest.java)
- Add `@NotNull` and `@Min(0)` validation constraints:
  ```java
  @NotNull(message = "Total prize pool is required")
  @Min(value = 0, message = "Total prize pool must be greater than or equal to 0")
  private Long totalPrizePool;
  ```

#### [TournamentResponse.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/response/TournamentResponse.java)
- Add `private long totalPrizePool;` to build payload.

#### [TournamentSummaryResponse.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/response/TournamentSummaryResponse.java)
- Add `private long totalPrizePool;` to build payload.

#### [TournamentService.java](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java)
- Update mapping functions `mapToResponse` and `mapToSummary` to copy `totalPrizePool` from `Tournament` entity.
- Map request fields in `createTournament`, `createForOrganizer`, and `updateTournament`.

---

### 3. Frontend Layer

#### [types/racing.ts](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/types/racing.ts)
- Add `totalPrizePool: number;` to the `Tournament` and `TournamentSummary` types.

#### [pages/organizer/OrganizerTournamentFormPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/organizer/OrganizerTournamentFormPage.tsx)
- Add an input field for `totalPrizePool` of type `number`, set `min={0}` and `required`.
- Update standard payload sent to `createOrganizerTournament`.

#### [pages/organizer/OrganizerTournamentDetailPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/organizer/OrganizerTournamentDetailPage.tsx)
- Update setup form fields (`renderSetupForm`) to include `totalPrizePool`.
- Synchronize form state, `loadDetail` handler, and PUT request parameters.

#### [pages/public/ChampionshipsPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/public/ChampionshipsPage.tsx)
- Display `totalPrizePool` on the `FocusCard` and `ChampionshipRow` components.

#### [pages/public/ChampionshipDetailPage.tsx](file:///e:/SWP391_Project/SWP391-horse-racing-tournament-system/frontend/src/pages/public/ChampionshipDetailPage.tsx)
- Display `totalPrizePool` inside the Hero Info segment formatted as a currency string.

---

## Verification Plan
- **Backend Tests**: Run maven test suite to verify no regressions in tournament validation.
- **Frontend Build**: Run `npm run build` to verify typings and import mappings.
