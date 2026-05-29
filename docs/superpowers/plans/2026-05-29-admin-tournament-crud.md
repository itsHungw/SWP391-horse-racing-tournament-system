# Admin Tournament CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive Tournament Administration panel (Option B: Separate List & Details page) with proper state transition controls and lifecycle lock constraints.

**Architecture:** We will update the backend `Tournament` entity and `TournamentService` to support all lifecycle transitions and enforce edit/delete locks on ongoing/completed tournaments. On the frontend, we will build a dedicated API client, map routes in the router, and implement list and tabbed detail views.

**Tech Stack:** Java, Spring Boot, React, React Router, TailwindCSS.

---

### Task 1: Update Backend Tournament Entity

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/entity/Tournament.java`

- [ ] **Step 1: Add new status transition methods**
  
  Add `startOngoing()` and `completeTournament()` methods to support lifecycle progression.
  
  ```java
      public void startOngoing() {
          this.status = "ONGOING";
          this.updatedAt = LocalDateTime.now();
      }
  
      public void completeTournament() {
          this.status = "COMPLETED";
          this.updatedAt = LocalDateTime.now();
      }
  ```

- [ ] **Step 2: Commit changes**
  
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/tournament/entity/Tournament.java
  git commit -m "backend: add ongoing and completed status methods to Tournament entity"
  ```

---

### Task 2: Implement Locks and Expanded Status Transition in TournamentService

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java`

- [ ] **Step 1: Add ongoing/completed edit locks**
  
  Modify `updateTournament` and `deleteTournament` to prevent editing or deleting ongoing or completed tournaments. Also, enforce that only draft tournaments can be deleted.
  
  ```java
      @Transactional
      public TournamentResponse updateTournament(Long id, TournamentRequest req) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
  
          if (java.util.List.of("ONGOING", "COMPLETED").contains(tournament.getStatus())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot modify an ongoing or completed tournament");
          }
          // ... rest of method remains unchanged
  ```
  
  And update `deleteTournament`:
  
  ```java
      @Transactional
      public void deleteTournament(Long id) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
          if (!"DRAFT".equals(tournament.getStatus())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft tournaments can be deleted. Please cancel active tournaments instead");
          }
          tournament.cancel();
          tournament.softDelete();
          tournamentRepository.save(tournament);
      }
  ```

- [ ] **Step 2: Update status transition logic**
  
  Update `updateStatus` to support all lifecycle transitions:
  
  ```java
      @Transactional
      public void updateStatus(Long id, String status) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
          
          String upperStatus = status.toUpperCase();
          switch (upperStatus) {
              case "OPEN_REGISTRATION":
                  tournament.openRegistration();
                  break;
              case "CLOSED_REGISTRATION":
                  tournament.closeRegistration();
                  break;
              case "ONGOING":
                  tournament.startOngoing();
                  break;
              case "COMPLETED":
                  tournament.completeTournament();
                  break;
              case "CANCELLED":
                  tournament.cancel();
                  break;
              default:
                  throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid tournament status: " + status);
          }
          tournamentRepository.save(tournament);
      }
  ```

- [ ] **Step 3: Commit changes**
  
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java
  git commit -m "backend: implement lifecycle locking and transition logic in TournamentService"
  ```

---

### Task 3: Implement Backend Integration Tests

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentAdminControllerTest.java`

- [ ] **Step 1: Write integration tests**
  
  Create tests checking that Admin can perform CRUD operations, that editing ONGOING tournaments fails with 400, and that status transitions proceed correctly.
  
  *(Placeholder for complete test class code - to be expanded by the implementing subagent)*

- [ ] **Step 2: Run tests**
  
  Run: `.\mvnw.cmd test -Dtest=TournamentAdminControllerTest`
  Expected: PASS

- [ ] **Step 3: Commit tests**
  
  ```bash
  git add backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentAdminControllerTest.java
  git commit -m "test: add integration tests for admin tournament CRUD and status transitions"
  ```

---

### Task 4: Create Frontend Admin Tournament API Client

**Files:**
- Create: `frontend/src/api/adminTournamentApi.ts`

- [ ] **Step 1: Implement API functions**
  
  Create the API client for admin tournament operations.
  
  ```typescript
  import { httpClient } from "./httpClient";
  import type { Tournament } from "../types/racing";
  
  export interface CreateTournamentPayload {
    name: string;
    code: string;
    description?: string;
    location: string;
    startDate: string;
    endDate: string;
    registrationStartAt: string;
    registrationEndAt: string;
    maxHorses?: number;
  }
  
  export async function getAdminTournaments(): Promise<Tournament[]> {
    const response = await httpClient.get<Tournament[]>("/admin/tournaments");
    return response.data;
  }
  
  export async function getTournamentDetail(id: number): Promise<Tournament> {
    const response = await httpClient.get<Tournament>(`/admin/tournaments/${id}`);
    return response.data;
  }
  
  export async function createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
    const response = await httpClient.post<Tournament>("/admin/tournaments", payload);
    return response.data;
  }
  
  export async function updateTournament(id: number, payload: CreateTournamentPayload): Promise<Tournament> {
    const response = await httpClient.put<Tournament>(`/admin/tournaments/${id}`, payload);
    return response.data;
  }
  
  export async function deleteTournament(id: number): Promise<void> {
    await httpClient.delete(`/admin/tournaments/${id}`);
  }
  
  export async function updateTournamentStatus(id: number, status: string): Promise<void> {
    await httpClient.put(`/admin/tournaments/${id}/status`, null, {
      params: { status }
    });
  }
  ```

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/api/adminTournamentApi.ts
  git commit -m "frontend: create admin tournament api client"
  ```

---

### Task 5: Configure App Router Mappings

**Files:**
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Map routes**
  
  Import `AdminTournamentListPage` and `AdminTournamentDetailPage` and map them:
  
  ```typescript
  import { AdminTournamentListPage } from "../pages/admin/AdminTournamentListPage";
  import { AdminTournamentDetailPage } from "../pages/admin/AdminTournamentDetailPage";
  ```
  
  And update `/admin/tournaments` mappings:
  
  ```typescript
          <Route path="admin/tournaments" element={adminRoute(<AdminTournamentListPage />)} />
          <Route path="admin/tournaments/:id" element={adminRoute(<AdminTournamentDetailPage />)} />
  ```

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/routes/AppRouter.tsx
  git commit -m "frontend: map tournament pages in app router"
  ```

---

### Task 6: Implement AdminTournamentListPage

**Files:**
- Create: `frontend/src/pages/admin/AdminTournamentListPage.tsx`

- [ ] **Step 1: Write Tournament List View**
  
  Build the view displaying overview cards, filters, list table with colored badges, and a "Create Tournament" form modal.
  
  *(Placeholder for complete component code - to be implemented by subagent using clean aesthetics and red accent brand colors)*

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/pages/admin/AdminTournamentListPage.tsx
  git commit -m "frontend: implement AdminTournamentListPage UI"
  ```

---

### Task 7: Implement AdminTournamentDetailPage

**Files:**
- Create: `frontend/src/pages/admin/AdminTournamentDetailPage.tsx`

- [ ] **Step 1: Write Tournament Detail View**
  
  Build the tabbed view (Tournament Settings, Races placeholder, Registrations placeholder) with the top status control bar, confirmation modals, and input locks for ongoing/completed states.
  
  *(Placeholder for complete component code - to be implemented by subagent)*

- [ ] **Step 2: Commit**
  
  ```bash
  git add frontend/src/pages/admin/AdminTournamentDetailPage.tsx
  git commit -m "frontend: implement AdminTournamentDetailPage UI"
  ```
