# Public Racing Discovery and Scalability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build scalable, premium public Championship and Race discovery with paginated backend search, Next to Post, Upcoming/Results Agenda, Calendar day panels, and official public results.

**Architecture:** Keep current array endpoints temporarily for compatibility and add paginated `/tournaments/search` and `/races/search` discovery endpoints. Add `/racing-summary` and `/races/{id}/results`, then migrate public discovery pages and Home to the bounded APIs. Frontend filter/view state is URL-driven.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, JUnit/MockMvc, React 19, React Router, TypeScript, Tailwind CSS, Vitest/Testing Library.

---

### Task 1: Paginated Championship Discovery API

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/response/TournamentSummaryResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/repository/TournamentRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/controller/TournamentController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentIntegrationTest.java`

- [ ] Write failing MockMvc tests for `/api/v1/tournaments/search` pagination, search, status, year, sort enum, race count, and nested `nextRace`.
- [ ] Run the focused tournament tests and confirm the discovery tests fail because the endpoint is missing.
- [ ] Add database-level public filtering and stable sort mapping.
- [ ] Map the paged entities to `TournamentSummaryResponse`, including `raceCount`, `participantCount`, and nested nearest future `nextRace`.
- [ ] Re-run focused tournament tests and commit the passing slice.

### Task 2: Paginated Race Discovery, Summary, and Public Results APIs

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/dto/response/RaceSummaryResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/dto/response/PublicRaceResultResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/dto/response/PublicRacingSummaryResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceParticipantRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/result/repository/RaceResultRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/RaceController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java`

- [ ] Write failing MockMvc tests for `/api/v1/races/search` Upcoming/Results scopes, date/tournament/search filters, sort, pagination, participant count, and prediction-open flag.
- [ ] Write failing tests proving `/api/v1/races/{id}/results` hides submitted finish order and exposes confirmed/published official results without internal notes.
- [ ] Write a failing test for `/api/v1/racing-summary`.
- [ ] Run focused race tests and verify RED.
- [ ] Implement repository-level discovery filtering, summary mapping, safe result mapping, and aggregate summary.
- [ ] Re-run focused race tests and commit the passing slice.

### Task 3: Frontend Discovery Contracts and Shared Utilities

**Files:**
- Modify: `frontend/src/types/racing.ts`
- Modify: `frontend/src/api/racingApi.ts`
- Create: `frontend/src/pages/public/racingDiscovery.ts`
- Create: `frontend/src/pages/public/racingDiscovery.test.ts`
- Create: `frontend/src/pages/public/components/PublicPagination.tsx`
- Create: `frontend/src/pages/public/components/PublicFilterSheet.tsx`

- [ ] Write failing unit tests for URL state parsing/serialization, In Focus selection, Next to Post selection, agenda grouping, and calendar time-slot grouping.
- [ ] Run focused tests and verify RED.
- [ ] Add typed paged search APIs, public result API, racing summary API, and discovery DTOs.
- [ ] Implement pure discovery/URL/grouping helpers and themed reusable pagination/filter sheet components.
- [ ] Re-run focused tests and commit the passing slice.

### Task 4: Premium Scalable Championships Page

**Files:**
- Modify: `frontend/src/pages/public/ChampionshipsPage.tsx`
- Create: `frontend/src/pages/public/ChampionshipsPage.test.tsx`
- Create: `frontend/src/pages/public/components/ChampionshipFocusCard.tsx`
- Create: `frontend/src/pages/public/components/ChampionshipListCard.tsx`

- [ ] Write failing behavior tests for In Focus priority/empty state, URL-driven search/status/year/sort/page, hybrid list, and pagination.
- [ ] Run focused Championships tests and verify RED.
- [ ] Implement compact hero, In Focus, light sticky controls, mobile filter sheet, hybrid list, and pagination using `/tournaments/search`.
- [ ] Verify role-aware owner registration affordance only changes navigation and does not bypass backend authorization.
- [ ] Re-run focused tests and commit the passing slice.

### Task 5: Action-First Races Agenda, Calendar, and Results

**Files:**
- Modify: `frontend/src/pages/public/RacesPage.tsx`
- Create: `frontend/src/pages/public/RacesPage.test.tsx`
- Create: `frontend/src/pages/public/components/NextToPostCard.tsx`
- Create: `frontend/src/pages/public/components/RaceAgenda.tsx`
- Create: `frontend/src/pages/public/components/RaceCalendar.tsx`
- Create: `frontend/src/pages/public/components/RaceDayPanel.tsx`

- [ ] Write failing behavior tests for default Upcoming Agenda URL state, Next to Post/latest-result fallback, Results wording/CTAs, calendar secondary view, cell overflow, and dense-day time-slot grouping.
- [ ] Run focused Races tests and verify RED.
- [ ] Implement compact hero, Next to Post, two-row desktop controls, mobile filters, paginated Agenda, Calendar, and accessible day panel/bottom sheet.
- [ ] Ensure calendar cells contain no CTAs and day panels own detailed actions.
- [ ] Re-run focused tests and commit the passing slice.

### Task 6: Home and Race Detail Migration

**Files:**
- Modify: `frontend/src/pages/public/HomePage.tsx`
- Modify: `frontend/src/pages/public/RaceDetailPage.tsx`
- Modify: `frontend/src/pages/public/SpectatorBlogPages.test.tsx`
- Modify: `frontend/src/pages/public/RaceDetailPage.test.tsx`

- [ ] Write failing tests that Home uses bounded summary/featured calls and Race Detail shows pending versus official public result states.
- [ ] Run focused tests and verify RED.
- [ ] Migrate Home stats to `/racing-summary`, use bounded discovery calls for featured race, and add official finish order to Race Detail.
- [ ] Re-run focused tests and commit the passing slice.

### Task 7: Verification and Review

**Files:**
- Modify only files required to fix regressions found by verification.

- [ ] Run focused backend race/tournament/result tests.
- [ ] Run the full backend test suite.
- [ ] Run frontend public tests, TypeScript typecheck, and production build.
- [ ] Run the full frontend test suite and separate unrelated pre-existing failures from feature regressions.
- [ ] Verify desktop/mobile public flows with dense, empty, loading, and error states.
- [ ] Review the complete diff against the approved design and commit final fixes.

