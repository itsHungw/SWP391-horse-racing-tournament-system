# Tournament Auto-Transition Scheduler & Postponed Lifecycle Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> 
> **Note on Git**: Do NOT execute any version control (`git`) commands on the user's workspace. All commit/stage actions are manual tasks for the user.

**Goal:** Implement the Spring Boot background scheduler for automated tournament status transitions and update the postponed tournament state to allow detailed editing and reopen transitions.

**Architecture:** Enable scheduling in `BackendApplication.java`, implement `TournamentScheduler.java` executing periodically in a transaction to handle auto-transitions, and update detail page forms and buttons on the frontend.

**Tech Stack:** Java, Spring Boot, React, TypeScript, TailwindCSS

---

### Task 1: Enable Scheduling in Backend
**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/BackendApplication.java`

- [ ] **Step 1: Add `@EnableScheduling` annotation to BackendApplication**
  Modify `BackendApplication.java` to add:
  ```java
  package com.example.horseracingtournamentsystem;

  import org.springframework.boot.SpringApplication;
  import org.springframework.boot.autoconfigure.SpringBootApplication;
  import org.springframework.scheduling.annotation.EnableScheduling;

  @SpringBootApplication
  @EnableScheduling
  public class BackendApplication {
      public static void main(String[] args) {
          SpringApplication.run(BackendApplication.class, args);
      }
  }
  ```
- [ ] **Step 2: Verify the backend compiles**
  No tests are needed yet, just check that it compiles:
  Set `JAVA_HOME` to `C:\Users\ADMIN\.jdks\ms-21.0.11` and run:
  `$env:JAVA_HOME="C:\Users\ADMIN\.jdks\ms-21.0.11"; ./mvnw.cmd compile`
  Expected: BUILD SUCCESS

---

### Task 2: Create Background Scheduler Service
**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/scheduler/TournamentScheduler.java`

- [ ] **Step 1: Write the Scheduler implementation**
  Create `TournamentScheduler.java` with the following content:
  ```java
  package com.example.horseracingtournamentsystem.tournament.scheduler;

  import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
  import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
  import lombok.RequiredArgsConstructor;
  import lombok.extern.slf4j.Slf4j;
  import org.springframework.scheduling.annotation.Scheduled;
  import org.springframework.stereotype.Component;
  import org.springframework.transaction.annotation.Transactional;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import java.util.List;

  @Component
  @RequiredArgsConstructor
  @Slf4j
  public class TournamentScheduler {

      private final TournamentRepository tournamentRepository;

      @Scheduled(fixedRate = 60000) // Run every 60 seconds
      @Transactional
      public void checkTournamentStatusTransitions() {
          log.debug("Scanning active tournaments for status auto-transitions...");
          LocalDateTime now = LocalDateTime.now();
          LocalDate today = LocalDate.now();

          List<Tournament> activeTournaments = tournamentRepository.findAllByStatusInAndDeletedAtIsNull(
                  List.of("OPEN_REGISTRATION", "CLOSED_REGISTRATION", "ONGOING")
          );

          for (Tournament t : activeTournaments) {
              try {
                  if ("OPEN_REGISTRATION".equals(t.getStatus())) {
                      if (now.isAfter(t.getRegistrationEndAt()) || now.isEqual(t.getRegistrationEndAt())) {
                          t.closeRegistration();
                          tournamentRepository.save(t);
                          log.info("Auto-transitioned Tournament ID {} from OPEN_REGISTRATION to CLOSED_REGISTRATION", t.getId());
                      }
                  } else if ("CLOSED_REGISTRATION".equals(t.getStatus())) {
                      if (today.isAfter(t.getStartDate()) || today.isEqual(t.getStartDate())) {
                          t.startOngoing();
                          tournamentRepository.save(t);
                          log.info("Auto-transitioned Tournament ID {} from CLOSED_REGISTRATION to ONGOING", t.getId());
                      }
                  } else if ("ONGOING".equals(t.getStatus())) {
                      if (today.isAfter(t.getEndDate())) {
                          t.completeTournament();
                          tournamentRepository.save(t);
                          log.info("Auto-transitioned Tournament ID {} from ONGOING to COMPLETED", t.getId());
                      }
                  }
              } catch (Exception e) {
                  log.error("Failed to auto-transition status for Tournament ID {}: {}", t.getId(), e.getMessage());
              }
          }
      }
  }
  ```
- [ ] **Step 2: Verify compiling**
  Set `JAVA_HOME` to `C:\Users\ADMIN\.jdks\ms-21.0.11` and run:
  `$env:JAVA_HOME="C:\Users\ADMIN\.jdks\ms-21.0.11"; ./mvnw.cmd compile`
  Expected: BUILD SUCCESS

---

### Task 3: Implement Backend Integration Tests for Scheduler & Postponed
**Files:**
- Modify: `backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentIntegrationTest.java`

- [ ] **Step 1: Write integration tests**
  Add these test cases to `TournamentIntegrationTest.java`:
  ```java
      @Autowired
      private com.example.horseracingtournamentsystem.tournament.scheduler.TournamentScheduler tournamentScheduler;

      @Test
      void adminCanEditPostponedTournament() throws Exception {
          com.example.horseracingtournamentsystem.tournament.entity.Tournament t = 
              com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                  "Derby", "DB_26", "Desc", "Loc", 
                  LocalDate.now().plusDays(10), LocalDate.now().plusDays(15),
                  LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(5),
                  20, adminUser
              );
          t.postpone(); // status is POSTPONED
          t = tournamentRepository.save(t);

          String updateBody = """
                  {
                      "name": "Updated Postponed Name",
                      "code": "DB_26",
                      "description": "Updated description",
                      "location": "New Location",
                      "startDate": "2026-07-01",
                      "endDate": "2026-07-15",
                      "registrationStartAt": "2026-06-01T00:00:00",
                      "registrationEndAt": "2026-06-25T00:00:00",
                      "maxHorses": 40
                  }
                  """;

          mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId())
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content(updateBody))
                  .andExpect(status().isOk())
                  .andExpect(jsonPath("$.name").value("Updated Postponed Name"))
                  .andExpect(jsonPath("$.location").value("New Location"));
      }

      @Test
      void adminCanReopenPostponedTournament() throws Exception {
          com.example.horseracingtournamentsystem.tournament.entity.Tournament t = 
              com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                  "Derby", "DB_26", "Desc", "Loc", 
                  LocalDate.now().plusDays(10), LocalDate.now().plusDays(15),
                  LocalDateTime.now().plusDays(1), LocalDateTime.now().plusDays(5),
                  20, adminUser
              );
          t.postpone(); // status is POSTPONED
          t = tournamentRepository.save(t);

          mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId() + "/status")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .param("status", "OPEN_REGISTRATION"))
                  .andExpect(status().isOk())
                  .andExpect(jsonPath("$.status").value("OPEN_REGISTRATION"));
      }

      @Test
      void schedulerAutoTransitionsActiveTournaments() {
          // 1. OPEN_REGISTRATION past registrationEndAt -> CLOSED_REGISTRATION
          com.example.horseracingtournamentsystem.tournament.entity.Tournament t1 = 
              com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                  "Derby 1", "DB_1", "Desc", "Loc", 
                  LocalDate.now().plusDays(10), LocalDate.now().plusDays(15),
                  LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(1),
                  20, adminUser
              );
          t1.openRegistration();
          t1 = tournamentRepository.save(t1);

          // 2. CLOSED_REGISTRATION past startDate -> ONGOING
          com.example.horseracingtournamentsystem.tournament.entity.Tournament t2 = 
              com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                  "Derby 2", "DB_2", "Desc", "Loc", 
                  LocalDate.now().minusDays(1), LocalDate.now().plusDays(5),
                  LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(2),
                  20, adminUser
              );
          t2.closeRegistration();
          t2 = tournamentRepository.save(t2);

          // Run scheduler
          tournamentScheduler.checkTournamentStatusTransitions();

          // Assertions
          com.example.horseracingtournamentsystem.tournament.entity.Tournament updatedT1 = 
              tournamentRepository.findById(t1.getId()).orElseThrow();
          com.example.horseracingtournamentsystem.tournament.entity.Tournament updatedT2 = 
              tournamentRepository.findById(t2.getId()).orElseThrow();

          org.junit.jupiter.api.Assertions.assertEquals("CLOSED_REGISTRATION", updatedT1.getStatus());
          org.junit.jupiter.api.Assertions.assertEquals("ONGOING", updatedT2.getStatus());
      }
  ```
- [ ] **Step 2: Run tests and verify they pass**
  Set `JAVA_HOME` to `C:\Users\ADMIN\.jdks\ms-21.0.11` and run:
  `$env:JAVA_HOME="C:\Users\ADMIN\.jdks\ms-21.0.11"; ./mvnw.cmd test -Dtest=TournamentIntegrationTest`
  Expected: BUILD SUCCESS (all tests pass)

---

### Task 4: Update Frontend Tournament List Page
**Files:**
- Modify: `frontend/src/pages/admin/AdminTournamentListPage.tsx`

- [ ] **Step 1: Rename references from CANCELLED/Suspended to POSTPONED/Postponed**
  Edit `AdminTournamentListPage.tsx` to:
  * In the status filter dropdown:
    ```tsx
    <option value="POSTPONED">Postponed</option>
    ```
  * In the status badge display logic inside table mapping:
    ```tsx
    t.status === "POSTPONED"
      ? "bg-orange-100 text-orange-800"
    ```
  * In the status text renderer inside table mapping:
    ```tsx
    t.status === "POSTPONED" ? "POSTPONED" : t.status.replace("_", " ")
    ```
- [ ] **Step 2: Verify no compile errors in list page**
  Run: `npx tsc -b` inside `frontend` directory.
  Expected: exit 0

---

### Task 5: Update Frontend Tournament Detail Page
**Files:**
- Modify: `frontend/src/pages/admin/AdminTournamentDetailPage.tsx`

- [ ] **Step 1: Modify form unlocking and getBadgeStyle**
  Edit `AdminTournamentDetailPage.tsx`:
  * Sửa đổi `isLocked` để cho phép chỉnh sửa giải đấu đang bị POSTPONED:
    ```typescript
    const isLocked = ["ONGOING", "COMPLETED"].includes(tournament.status);
    ```
  * Sửa đổi `getBadgeStyle` cho trường hợp `"POSTPONED"`:
    ```typescript
    case "POSTPONED":
      return "bg-orange-100 text-orange-800 border-orange-200";
    ```
- [ ] **Step 2: Sửa đổi Nhãn hiển thị và Nút hành động**
  Trong phần hiển thị trạng thái và nút hành động của `AdminTournamentDetailPage.tsx`:
  * Tên trạng thái ở badge tiêu đề:
    ```tsx
    {tournament.status === "POSTPONED" ? "POSTPONED" : tournament.status.replace("_", " ")}
    ```
  * Ở các khối kiểm tra trạng thái hiển thị nút:
    * Xóa nút `"Cancel Tournament"` / `"Suspend Tournament"` ở trạng thái `"DRAFT"`.
    * Đổi tên nút `"Suspend Tournament"` thành `"Postpone Tournament"` và đặt giá trị transition mục tiêu là `"POSTPONED"` khi trạng thái là `"OPEN_REGISTRATION"` hoặc `"CLOSED_REGISTRATION"`.
    * Xóa nút tạm dừng / hoãn khỏi trạng thái `"ONGOING"`.
    * Thêm khối hiển thị nút khi trạng thái là `"POSTPONED"` để chỉ có nút mở lại đăng ký:
      ```tsx
      {tournament.status === "POSTPONED" && (
        <button
          onClick={() => setShowStatusModal({ show: true, targetStatus: "OPEN_REGISTRATION" })}
          className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Reopen Registration
        </button>
      )}
      ```
  * Cập nhật các câu thông báo thành công và Modal Xác nhận để tham chiếu trạng thái mới `"POSTPONED"` thay vì `"CANCELLED"` hay `"SUSPENDED"`.
- [ ] **Step 3: Verify the frontend builds cleanly**
  Run: `npm run build` inside `frontend` directory.
  Expected: exit 0
