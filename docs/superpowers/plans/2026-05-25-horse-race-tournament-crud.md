# Horse, Race, and Tournament CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish clean, highly-cohesive, secure CRUD REST APIs for Horse, Tournament, and Race entities within the `SWP391-horse-racing-tournament-system` backend, complying with standard domain structures, in-place security mappings, and TDD integration tests.

**Architecture:** We align our implementation with the domain-driven layered package structure (Controller, Service, Repository, DTO, Entity). All public read operations are mapped to GET endpoints permitted for unauthenticated users, while all write, update, and delete actions are securely restricted to administrators under `/api/v1/admin/**` path. Soft-delete and inactive status changes are enforced to preserve relational integrity.

**Tech Stack:** Java 21, Spring Boot 3.x/4.x, Spring Data JPA, Hibernate, Bean Validation, Lombok, Spring Security, H2 (test) / MS SQL (prod), MockMvc, JUnit 5.

---

## File Structure & Responsibilities Map

### 1. Tournament Domain
- Create `com/example/horseracingtournamentsystem/tournament/entity/Tournament.java`: JPA Entity mapping to `tournaments` DB table. Enforces domain invariants and status transitions.
- Create `com/example/horseracingtournamentsystem/tournament/repository/TournamentRepository.java`: JPA interface for db querying.
- Create `com/example/horseracingtournamentsystem/tournament/dto/request/TournamentRequest.java`: Input validation model.
- Create `com/example/horseracingtournamentsystem/tournament/dto/response/TournamentResponse.java`: Safe representation model.
- Create `com/example/horseracingtournamentsystem/tournament/service/TournamentService.java`: `@Transactional` service encapsulating business rules, user authorization checks, and validation.
- Create `com/example/horseracingtournamentsystem/tournament/controller/AdminTournamentController.java`: Controller for `/api/v1/admin/tournaments` endpoints.
- Create `com/example/horseracingtournamentsystem/tournament/controller/TournamentController.java`: Controller for public `/api/v1/tournaments` endpoints.
- Create `com/example/horseracingtournamentsystem/tournament/TournamentIntegrationTest.java`: Integration tests for both admin and public flows.

### 2. Horse Domain
- Create `com/example/horseracingtournamentsystem/horse/entity/Horse.java`: JPA Entity mapping to `horses` DB table. Enforces breed, gender, and status mappings.
- Create `com/example/horseracingtournamentsystem/horse/repository/HorseRepository.java`: JPA interface.
- Create `com/example/horseracingtournamentsystem/horse/dto/request/HorseRequest.java`: Validation DTO.
- Create `com/example/horseracingtournamentsystem/horse/dto/response/HorseResponse.java`: Response DTO mapping owner details.
- Create `com/example/horseracingtournamentsystem/horse/service/HorseService.java`: `@Transactional` service.
- Create `com/example/horseracingtournamentsystem/horse/controller/AdminHorseController.java`: Controller for `/api/v1/admin/horses`.
- Create `com/example/horseracingtournamentsystem/horse/controller/HorseController.java`: Controller for `/api/v1/horses`.
- Create `com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java`: Integration tests.

### 3. Race Domain
- Create `com/example/horseracingtournamentsystem/race/entity/Race.java`: JPA Entity mapping to `races` DB table.
- Create `com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`: JPA interface.
- Create `com/example/horseracingtournamentsystem/race/dto/request/RaceRequest.java`: Validation DTO.
- Create `com/example/horseracingtournamentsystem/race/dto/response/RaceResponse.java`: Response DTO.
- Create `com/example/horseracingtournamentsystem/race/service/RaceService.java`: `@Transactional` service.
- Create `com/example/horseracingtournamentsystem/race/controller/AdminRaceController.java`: Controller for `/api/v1/admin/races`.
- Create `com/example/horseracingtournamentsystem/race/controller/RaceController.java`: Controller for `/api/v1/races`.
- Create `com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java`: Integration tests.

### 4. Configuration
- Modify `com/example/horseracingtournamentsystem/security/SecurityConfig.java`: Configure public GET endpoints for Horses, Races, and Tournaments as `permitAll()`.

---

## Bite-Sized Implementation Steps

### Task 1: Permit Public GET Endpoints in SecurityConfig

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java`

- [ ] **Step 1: Write the SecurityConfig change**
  Add `HttpMethod.GET` request matchers for `/api/v1/horses/**`, `/api/v1/tournaments/**`, and `/api/v1/races/**` to be fully permitted.
  Modify `SecurityConfig.java` (specifically lines 42-49):
  ```java
                  .authorizeHttpRequests(auth -> auth
                          .requestMatchers("/error", "/api/v1/auth/**", "/api/v1/files/download/**").permitAll()
                          .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/horses/**", "/api/v1/tournaments/**", "/api/v1/races/**").permitAll()
                          .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                          .requestMatchers("/api/v1/owner/**").hasRole("HORSE_OWNER")
                          .requestMatchers("/api/v1/jockey/**").hasRole("JOCKEY")
                          .requestMatchers("/api/v1/referee/**").hasRole("REFEREE")
                          .anyRequest().authenticated()
                  )
  ```

- [ ] **Step 2: Compile to ensure there are no syntax errors**
  Run: `mvn clean compile` in the `backend` directory.
  Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/security/SecurityConfig.java
  git commit -m "sec: permit public GET routes for horse, race, and tournament"
  ```

---

### Task 2: Implement Tournament Foundation & CRUD

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/entity/Tournament.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/repository/TournamentRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/request/TournamentRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/dto/response/TournamentResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/service/TournamentService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/controller/AdminTournamentController.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/tournament/controller/TournamentController.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/tournament/TournamentIntegrationTest.java`

- [ ] **Step 1: Write Tournament Entity and Repository**
  Implement `Tournament.java` aligning to the `tournaments` DB constraints. Statuses supported: `'DRAFT', 'OPEN_REGISTRATION', 'CLOSED_REGISTRATION', 'ONGOING', 'COMPLETED', 'CANCELLED'`.
  ```java
  package com.example.horseracingtournamentsystem.tournament.entity;

  import com.example.horseracingtournamentsystem.user.entity.User;
  import jakarta.persistence.*;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import lombok.AccessLevel;
  import lombok.Getter;
  import lombok.NoArgsConstructor;

  @Entity
  @Table(name = "tournaments")
  @Getter
  @NoArgsConstructor(access = AccessLevel.PROTECTED)
  public class Tournament {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @Column(name = "name", nullable = false, length = 200)
      private String name;

      @Column(name = "code", nullable = false, unique = true, length = 100)
      private String code;

      @Column(name = "description")
      private String description;

      @Column(name = "location", nullable = false, length = 255)
      private String location;

      @Column(name = "start_date", nullable = false)
      private LocalDate startDate;

      @Column(name = "end_date", nullable = false)
      private LocalDate endDate;

      @Column(name = "registration_start_at", nullable = false)
      private LocalDateTime registrationStartAt;

      @Column(name = "registration_end_at", nullable = false)
      private LocalDateTime registrationEndAt;

      @Column(name = "max_horses")
      private Integer maxHorses;

      @Column(name = "status", nullable = false, length = 40)
      private String status;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "created_by", nullable = false)
      private User createdBy;

      @Column(name = "created_at", nullable = false)
      private LocalDateTime createdAt;

      @Column(name = "updated_at")
      private LocalDateTime updatedAt;

      @Column(name = "deleted_at")
      private LocalDateTime deletedAt;

      public static Tournament create(String name, String code, String description, String location, 
                                      LocalDate startDate, LocalDate endDate, LocalDateTime regStart, 
                                      LocalDateTime regEnd, Integer maxHorses, User creator) {
          Tournament tournament = new Tournament();
          tournament.name = name;
          tournament.code = code;
          tournament.description = description;
          tournament.location = location;
          tournament.startDate = startDate;
          tournament.endDate = endDate;
          tournament.registrationStartAt = regStart;
          tournament.registrationEndAt = regEnd;
          tournament.maxHorses = maxHorses;
          tournament.status = "DRAFT";
          tournament.createdBy = creator;
          tournament.createdAt = LocalDateTime.now();
          return tournament;
      }

      public void update(String name, String description, String location, LocalDate startDate, LocalDate endDate,
                         LocalDateTime regStart, LocalDateTime regEnd, Integer maxHorses) {
          this.name = name;
          this.description = description;
          this.location = location;
          this.startDate = startDate;
          this.endDate = endDate;
          this.registrationStartAt = regStart;
          this.registrationEndAt = regEnd;
          this.maxHorses = maxHorses;
          this.updatedAt = LocalDateTime.now();
      }

      public void cancel() {
          this.status = "CANCELLED";
          this.updatedAt = LocalDateTime.now();
      }

      public void openRegistration() {
          this.status = "OPEN_REGISTRATION";
          this.updatedAt = LocalDateTime.now();
      }

      public void closeRegistration() {
          this.status = "CLOSED_REGISTRATION";
          this.updatedAt = LocalDateTime.now();
      }

      public void softDelete() {
          this.deletedAt = LocalDateTime.now();
      }
  }
  ```

  Create `TournamentRepository.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament.repository;

  import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
  import org.springframework.data.jpa.repository.JpaRepository;
  import java.util.List;
  import java.util.Optional;

  public interface TournamentRepository extends JpaRepository<Tournament, Long> {
      Optional<Tournament> findByIdAndDeletedAtIsNull(Long id);
      List<Tournament> findAllByDeletedAtIsNull();
      List<Tournament> findAllByStatusInAndDeletedAtIsNull(List<String> statuses);
      boolean existsByCodeAndDeletedAtIsNull(String code);
      boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);
  }
  ```

- [ ] **Step 2: Create DTOs & Services**
  Create `TournamentRequest.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament.dto.request;

  import jakarta.validation.constraints.NotBlank;
  import jakarta.validation.constraints.NotNull;
  import jakarta.validation.constraints.Size;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import lombok.*;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public class TournamentRequest {
      @NotBlank(message = "Name is required")
      @Size(max = 200, message = "Name must not exceed 200 characters")
      private String name;

      @NotBlank(message = "Code is required")
      @Size(max = 100, message = "Code must not exceed 100 characters")
      private String code;

      private String description;

      @NotBlank(message = "Location is required")
      @Size(max = 255, message = "Location must not exceed 255 characters")
      private String location;

      @NotNull(message = "Start date is required")
      private LocalDate startDate;

      @NotNull(message = "End date is required")
      private LocalDate endDate;

      @NotNull(message = "Registration start time is required")
      private LocalDateTime registrationStartAt;

      @NotNull(message = "Registration end time is required")
      private LocalDateTime registrationEndAt;

      private Integer maxHorses;
  }
  ```

  Create `TournamentResponse.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament.dto.response;

  import lombok.*;
  import java.time.LocalDate;
  import java.time.LocalDateTime;

  @Getter
  @Setter
  @Builder
  @AllArgsConstructor
  public class TournamentResponse {
      private Long id;
      private String name;
      private String code;
      private String description;
      private String location;
      private LocalDate startDate;
      private LocalDate endDate;
      private LocalDateTime registrationStartAt;
      private LocalDateTime registrationEndAt;
      private Integer maxHorses;
      private String status;
      private String creatorName;
      private LocalDateTime createdAt;
      private LocalDateTime updatedAt;
  }
  ```

  Create `TournamentService.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament.service;

  import com.example.horseracingtournamentsystem.tournament.dto.request.TournamentRequest;
  import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
  import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
  import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import lombok.RequiredArgsConstructor;
  import org.springframework.http.HttpStatus;
  import org.springframework.stereotype.Service;
  import org.springframework.transaction.annotation.Transactional;
  import org.springframework.web.server.ResponseStatusException;
  import java.util.List;
  import java.util.stream.Collectors;

  @Service
  @RequiredArgsConstructor
  @Transactional(readOnly = true)
  public class TournamentService {

      private final TournamentRepository tournamentRepository;
      private final UserRepository userRepository;

      @Transactional
      public TournamentResponse createTournament(TournamentRequest req, String creatorEmail) {
          if (tournamentRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
          }
          if (req.getEndDate().isBefore(req.getStartDate())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
          }
          if (req.getRegistrationEndAt().isBefore(req.getRegistrationStartAt())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration end time cannot be before start time");
          }

          User creator = userRepository.findByEmail(creatorEmail)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator user not found"));

          Tournament tournament = Tournament.create(
                  req.getName(), req.getCode(), req.getDescription(), req.getLocation(),
                  req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                  req.getRegistrationEndAt(), req.getMaxHorses(), creator
          );

          tournamentRepository.save(tournament);
          return mapToResponse(tournament);
      }

      @Transactional
      public TournamentResponse updateTournament(Long id, TournamentRequest req) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

          if (tournamentRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tournament code already exists");
          }
          if (req.getEndDate().isBefore(req.getStartDate())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
          }
          if (req.getRegistrationEndAt().isBefore(req.getRegistrationStartAt())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Registration end time cannot be before start time");
          }

          tournament.update(
                  req.getName(), req.getDescription(), req.getLocation(),
                  req.getStartDate(), req.getEndDate(), req.getRegistrationStartAt(),
                  req.getRegistrationEndAt(), req.getMaxHorses()
          );

          tournamentRepository.save(tournament);
          return mapToResponse(tournament);
      }

      @Transactional
      public void deleteTournament(Long id) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
          tournament.cancel();
          tournament.softDelete();
          tournamentRepository.save(tournament);
      }

      public TournamentResponse getTournamentDetail(Long id) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
          return mapToResponse(tournament);
      }

      public List<TournamentResponse> getAdminTournaments() {
          return tournamentRepository.findAllByDeletedAtIsNull().stream()
                  .map(this::mapToResponse)
                  .collect(Collectors.toList());
      }

      public List<TournamentResponse> getPublicTournaments() {
          return tournamentRepository.findAllByStatusInAndDeletedAtIsNull(
                  List.of("OPEN_REGISTRATION", "CLOSED_REGISTRATION", "ONGOING", "COMPLETED")
          ).stream().map(this::mapToResponse).collect(Collectors.toList());
      }

      @Transactional
      public void updateStatus(Long id, String status) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));
          if (status.equalsIgnoreCase("OPEN_REGISTRATION")) {
              tournament.openRegistration();
          } else if (status.equalsIgnoreCase("CLOSED_REGISTRATION")) {
              tournament.closeRegistration();
          }
          tournamentRepository.save(tournament);
      }

      private TournamentResponse mapToResponse(Tournament t) {
          return TournamentResponse.builder()
                  .id(t.getId())
                  .name(t.getName())
                  .code(t.getCode())
                  .description(t.getDescription())
                  .location(t.getLocation())
                  .startDate(t.getStartDate())
                  .endDate(t.getEndDate())
                  .registrationStartAt(t.getRegistrationStartAt())
                  .registrationEndAt(t.getRegistrationEndAt())
                  .maxHorses(t.getMaxHorses())
                  .status(t.getStatus())
                  .creatorName(t.getCreatedBy().getFullName())
                  .createdAt(t.getCreatedAt())
                  .updatedAt(t.getUpdatedAt())
                  .build();
      }
  }
  ```

- [ ] **Step 3: Create Controllers**
  Create `AdminTournamentController.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament.controller;

  import com.example.horseracingtournamentsystem.tournament.dto.request.TournamentRequest;
  import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
  import com.example.horseracingtournamentsystem.tournament.service.TournamentService;
  import jakarta.validation.Valid;
  import lombok.RequiredArgsConstructor;
  import org.springframework.http.HttpStatus;
  import org.springframework.web.bind.annotation.*;
  import java.security.Principal;
  import java.util.List;

  @RestController
  @RequestMapping("/api/v1/admin/tournaments")
  @RequiredArgsConstructor
  public class AdminTournamentController {

      private final TournamentService tournamentService;

      @PostMapping
      @ResponseStatus(HttpStatus.CREATED)
      public TournamentResponse createTournament(@Valid @RequestBody TournamentRequest req, Principal principal) {
          return tournamentService.createTournament(req, principal.getName());
      }

      @PutMapping("/{id}")
      public TournamentResponse updateTournament(@PathVariable Long id, @Valid @RequestBody TournamentRequest req) {
          return tournamentService.updateTournament(id, req);
      }

      @DeleteMapping("/{id}")
      @ResponseStatus(HttpStatus.NO_CONTENT)
      public void deleteTournament(@PathVariable Long id) {
          tournamentService.deleteTournament(id);
      }

      @GetMapping
      public List<TournamentResponse> listAll() {
          return tournamentService.getAdminTournaments();
      }

      @GetMapping("/{id}")
      public TournamentResponse getDetail(@PathVariable Long id) {
          return tournamentService.getTournamentDetail(id);
      }

      @PutMapping("/{id}/status")
      public void updateStatus(@PathVariable Long id, @RequestParam String status) {
          tournamentService.updateStatus(id, status);
      }
  }
  ```

  Create `TournamentController.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament.controller;

  import com.example.horseracingtournamentsystem.tournament.dto.response.TournamentResponse;
  import com.example.horseracingtournamentsystem.tournament.service.TournamentService;
  import lombok.RequiredArgsConstructor;
  import org.springframework.web.bind.annotation.*;
  import java.util.List;

  @RestController
  @RequestMapping("/api/v1/tournaments")
  @RequiredArgsConstructor
  public class TournamentController {

      private final TournamentService tournamentService;

      @GetMapping
      public List<TournamentResponse> listPublic() {
          return tournamentService.getPublicTournaments();
      }

      @GetMapping("/{id}")
      public TournamentResponse getPublicDetail(@PathVariable Long id) {
          return tournamentService.getTournamentDetail(id);
      }
  }
  ```

- [ ] **Step 4: Write failing/passing tests**
  Create `TournamentIntegrationTest.java`:
  ```java
  package com.example.horseracingtournamentsystem.tournament;

  import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
  import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

  import com.example.horseracingtournamentsystem.security.JwtService;
  import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
  import com.example.horseracingtournamentsystem.user.entity.Role;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.boot.test.context.SpringBootTest;
  import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
  import org.springframework.http.HttpHeaders;
  import org.springframework.http.MediaType;
  import org.springframework.test.web.servlet.MockMvc;
  import org.springframework.transaction.annotation.Transactional;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import java.util.Set;

  @SpringBootTest
  @AutoConfigureMockMvc
  @Transactional
  class TournamentIntegrationTest {

      @Autowired
      private MockMvc mockMvc;

      @Autowired
      private JwtService jwtService;

      @Autowired
      private TournamentRepository tournamentRepository;

      @Autowired
      private UserRepository userRepository;

      @Autowired
      private RoleRepository roleRepository;

      @Autowired
      private UserRoleRepository userRoleRepository;

      private String adminToken;
      private String spectatorToken;
      private User adminUser;

      @BeforeEach
      void setUp() {
          tournamentRepository.deleteAll();
          userRoleRepository.deleteAll();
          roleRepository.deleteAll();
          userRepository.deleteAll();

          Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
          Role specRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

          adminUser = User.pending("Admin User", "admin@example.com", "hash");
          adminUser.verifyEmail();
          adminUser = userRepository.save(adminUser);

          User specUser = User.pending("Spectator User", "spec@example.com", "hash");
          specUser.verifyEmail();
          specUser = userRepository.save(specUser);

          adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
          spectatorToken = jwtService.generateToken(specUser.getEmail(), Set.of("SPECTATOR"));
      }

      @Test
      void adminCanCreateTournament() throws Exception {
          String body = """
                  {
                      "name": "Summer Derby 2026",
                      "code": "SUMMER_26",
                      "description": "Premium summer racing tournament",
                      "location": "Saratoga Tracks",
                      "startDate": "2026-07-01",
                      "endDate": "2026-07-15",
                      "registrationStartAt": "2026-06-01T00:00:00",
                      "registrationEndAt": "2026-06-25T00:00:00",
                      "maxHorses": 50
                  }
                  """;

          mockMvc.perform(post("/api/v1/admin/tournaments")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content(body))
                  .andExpect(status().isCreated())
                  .andExpect(jsonPath("$.name").value("Summer Derby 2026"))
                  .andExpect(jsonPath("$.code").value("SUMMER_26"))
                  .andExpect(jsonPath("$.status").value("DRAFT"));
      }

      @Test
      void spectatorCannotCreateTournament() throws Exception {
          mockMvc.perform(post("/api/v1/admin/tournaments")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content("{}"))
                  .andExpect(status().isForbidden());
      }

      @Test
      void invalidDatesReturnBadRequest() throws Exception {
          String body = """
                  {
                      "name": "Summer Derby 2026",
                      "code": "SUMMER_26",
                      "description": "Premium summer racing tournament",
                      "location": "Saratoga Tracks",
                      "startDate": "2026-07-15",
                      "endDate": "2026-07-01",
                      "registrationStartAt": "2026-06-01T00:00:00",
                      "registrationEndAt": "2026-06-25T00:00:00",
                      "maxHorses": 50
                  }
                  """;

          mockMvc.perform(post("/api/v1/admin/tournaments")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content(body))
                  .andExpect(status().isBadRequest());
      }
  }
  ```

- [ ] **Step 5: Run the tests to make sure they pass**
  Run: `mvn test -Dtest=TournamentIntegrationTest` in the `backend` directory.
  Expected: BUILD SUCCESS with 3 tests passing.

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/tournament/ backend/src/test/java/com/example/horseracingtournamentsystem/tournament/
  git commit -m "feat: implement tournament entities, service, controller, and integration tests"
  ```

---

### Task 3: Implement Horse Foundation & CRUD

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/entity/Horse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/repository/HorseRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/request/HorseRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/dto/response/HorseResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/service/HorseService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/AdminHorseController.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/horse/controller/HorseController.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/horse/HorseIntegrationTest.java`

- [ ] **Step 1: Write Horse Entity and Repository**
  Implement `Horse.java` with gender and status constraints.
  ```java
  package com.example.horseracingtournamentsystem.horse.entity;

  import com.example.horseracingtournamentsystem.user.entity.User;
  import jakarta.persistence.*;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import lombok.AccessLevel;
  import lombok.Getter;
  import lombok.NoArgsConstructor;

  @Entity
  @Table(name = "horses")
  @Getter
  @NoArgsConstructor(access = AccessLevel.PROTECTED)
  public class Horse {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "owner_id", nullable = false)
      private User owner;

      @Column(name = "name", nullable = false, length = 150)
      private String name;

      @Column(name = "registration_code", length = 100, unique = true)
      private String registrationCode;

      @Column(name = "breed", length = 100)
      private String breed;

      @Column(name = "gender", nullable = false, length = 20)
      private String gender; // MALE / FEMALE

      @Column(name = "date_of_birth")
      private LocalDate dateOfBirth;

      @Column(name = "color", length = 50)
      private String color;

      @Column(name = "status", nullable = false, length = 30)
      private String status; // PENDING / APPROVED (ACTIVE) / REJECTED / INACTIVE / SUSPENDED

      @Column(name = "created_at", nullable = false)
      private LocalDateTime createdAt;

      @Column(name = "updated_at")
      private LocalDateTime updatedAt;

      @Column(name = "deleted_at")
      private LocalDateTime deletedAt;

      public static Horse create(User owner, String name, String registrationCode, String breed, 
                                 String gender, LocalDate dateOfBirth, String color) {
          Horse horse = new Horse();
          horse.owner = owner;
          horse.name = name;
          horse.registrationCode = registrationCode;
          horse.breed = breed;
          horse.gender = gender;
          horse.dateOfBirth = dateOfBirth;
          horse.color = color;
          horse.status = "APPROVED"; // Default as APPROVED (ACTIVE) for direct admin actions
          horse.createdAt = LocalDateTime.now();
          return horse;
      }

      public void update(String name, String breed, String gender, LocalDate dateOfBirth, String color) {
          this.name = name;
          this.breed = breed;
          this.gender = gender;
          this.dateOfBirth = dateOfBirth;
          this.color = color;
          this.updatedAt = LocalDateTime.now();
      }

      public void setInactive() {
          this.status = "INACTIVE";
          this.updatedAt = LocalDateTime.now();
      }

      public void softDelete() {
          this.deletedAt = LocalDateTime.now();
      }
  }
  ```

  Create `HorseRepository.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse.repository;

  import com.example.horseracingtournamentsystem.horse.entity.Horse;
  import org.springframework.data.jpa.repository.JpaRepository;
  import java.util.List;
  import java.util.Optional;

  public interface HorseRepository extends JpaRepository<Horse, Long> {
      Optional<Horse> findByIdAndDeletedAtIsNull(Long id);
      List<Horse> findAllByDeletedAtIsNull();
      List<Horse> findAllByStatusAndDeletedAtIsNull(String status);
      Optional<Horse> findByIdAndStatusAndDeletedAtIsNull(Long id, String status);
  }
  ```

- [ ] **Step 2: Create DTOs & Services**
  Create `HorseRequest.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse.dto.request;

  import jakarta.validation.constraints.NotBlank;
  import jakarta.validation.constraints.NotNull;
  import jakarta.validation.constraints.Size;
  import java.time.LocalDate;
  import lombok.*;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public class HorseRequest {
      @NotNull(message = "Owner ID is required")
      private Long ownerId;

      @NotBlank(message = "Horse name is required")
      @Size(max = 150)
      private String name;

      @Size(max = 100)
      private String breed;

      @NotBlank(message = "Gender is required")
      private String gender; // MALE / FEMALE

      private LocalDate dateOfBirth;

      @Size(max = 50)
      private String color;
  }
  ```

  Create `HorseResponse.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse.dto.response;

  import lombok.*;
  import java.time.LocalDate;
  import java.time.LocalDateTime;

  @Getter
  @Setter
  @Builder
  @AllArgsConstructor
  public class HorseResponse {
      private Long id;
      private Long ownerId;
      private String ownerName;
      private String name;
      private String registrationCode;
      private String breed;
      private String gender;
      private LocalDate dateOfBirth;
      private String color;
      private String status;
      private LocalDateTime createdAt;
      private LocalDateTime updatedAt;
  }
  ```

  Create `HorseService.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse.service;

  import com.example.horseracingtournamentsystem.horse.dto.request.HorseRequest;
  import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
  import com.example.horseracingtournamentsystem.horse.entity.Horse;
  import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import lombok.RequiredArgsConstructor;
  import org.springframework.http.HttpStatus;
  import org.springframework.stereotype.Service;
  import org.springframework.transaction.annotation.Transactional;
  import org.springframework.web.server.ResponseStatusException;
  import java.util.List;
  import java.util.UUID;
  import java.util.stream.Collectors;

  @Service
  @RequiredArgsConstructor
  @Transactional(readOnly = true)
  public class HorseService {

      private final HorseRepository horseRepository;
      private final UserRepository userRepository;

      @Transactional
      public HorseResponse createHorse(HorseRequest req) {
          User owner = userRepository.findById(req.getOwnerId())
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

          String code = "HORSE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

          Horse horse = Horse.create(
                  owner, req.getName(), code, req.getBreed(),
                  req.getGender().toUpperCase(), req.getDateOfBirth(), req.getColor()
          );

          horseRepository.save(horse);
          return mapToResponse(horse);
      }

      @Transactional
      public HorseResponse updateHorse(Long id, HorseRequest req) {
          Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));

          User owner = userRepository.findById(req.getOwnerId())
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found"));

          horse.update(req.getName(), req.getBreed(), req.getGender().toUpperCase(), req.getDateOfBirth(), req.getColor());
          horseRepository.save(horse);
          return mapToResponse(horse);
      }

      @Transactional
      public void deleteHorse(Long id) {
          Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
          horse.setInactive();
          horse.softDelete();
          horseRepository.save(horse);
      }

      public HorseResponse getHorseDetail(Long id) {
          Horse horse = horseRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Horse not found"));
          return mapToResponse(horse);
      }

      public List<HorseResponse> getAdminHorses() {
          return horseRepository.findAllByDeletedAtIsNull().stream()
                  .map(this::mapToResponse)
                  .collect(Collectors.toList());
      }

      public List<HorseResponse> getPublicHorses() {
          return horseRepository.findAllByStatusAndDeletedAtIsNull("APPROVED").stream()
                  .map(this::mapToResponse)
                  .collect(Collectors.toList());
      }

      public HorseResponse getPublicHorseDetail(Long id) {
          Horse horse = horseRepository.findByIdAndStatusAndDeletedAtIsNull(id, "APPROVED")
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active horse not found"));
          return mapToResponse(horse);
      }

      private HorseResponse mapToResponse(Horse h) {
          return HorseResponse.builder()
                  .id(h.getId())
                  .ownerId(h.getOwner().getId())
                  .ownerName(h.getOwner().getFullName())
                  .name(h.getName())
                  .registrationCode(h.getRegistrationCode())
                  .breed(h.getBreed())
                  .gender(h.getGender())
                  .dateOfBirth(h.getDateOfBirth())
                  .color(h.getColor())
                  .status(h.getStatus())
                  .createdAt(h.getCreatedAt())
                  .updatedAt(h.getUpdatedAt())
                  .build();
      }
  }
  ```

- [ ] **Step 3: Create Controllers**
  Create `AdminHorseController.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse.controller;

  import com.example.horseracingtournamentsystem.horse.dto.request.HorseRequest;
  import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
  import com.example.horseracingtournamentsystem.horse.service.HorseService;
  import jakarta.validation.Valid;
  import lombok.RequiredArgsConstructor;
  import org.springframework.http.HttpStatus;
  import org.springframework.web.bind.annotation.*;
  import java.util.List;

  @RestController
  @RequestMapping("/api/v1/admin/horses")
  @RequiredArgsConstructor
  public class AdminHorseController {

      private final HorseService horseService;

      @PostMapping
      @ResponseStatus(HttpStatus.CREATED)
      public HorseResponse createHorse(@Valid @RequestBody HorseRequest req) {
          return horseService.createHorse(req);
      }

      @PutMapping("/{id}")
      public HorseResponse updateHorse(@PathVariable Long id, @Valid @RequestBody HorseRequest req) {
          return horseService.updateHorse(id, req);
      }

      @DeleteMapping("/{id}")
      @ResponseStatus(HttpStatus.NO_CONTENT)
      public void deleteHorse(@PathVariable Long id) {
          horseService.deleteHorse(id);
      }

      @GetMapping
      public List<HorseResponse> listAll() {
          return horseService.getAdminHorses();
      }

      @GetMapping("/{id}")
      public HorseResponse getDetail(@PathVariable Long id) {
          return horseService.getHorseDetail(id);
      }
  }
  ```

  Create `HorseController.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse.controller;

  import com.example.horseracingtournamentsystem.horse.dto.response.HorseResponse;
  import com.example.horseracingtournamentsystem.horse.service.HorseService;
  import lombok.RequiredArgsConstructor;
  import org.springframework.web.bind.annotation.*;
  import java.util.List;

  @RestController
  @RequestMapping("/api/v1/horses")
  @RequiredArgsConstructor
  public class HorseController {

      private final HorseService horseService;

      @GetMapping
      public List<HorseResponse> listPublic() {
          return horseService.getPublicHorses();
      }

      @GetMapping("/{id}")
      public HorseResponse getPublicDetail(@PathVariable Long id) {
          return horseService.getPublicHorseDetail(id);
      }
  }
  ```

- [ ] **Step 4: Write failing/passing tests**
  Create `HorseIntegrationTest.java`:
  ```java
  package com.example.horseracingtournamentsystem.horse;

  import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
  import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

  import com.example.horseracingtournamentsystem.horse.entity.Horse;
  import com.example.horseracingtournamentsystem.horse.repository.HorseRepository;
  import com.example.horseracingtournamentsystem.security.JwtService;
  import com.example.horseracingtournamentsystem.user.entity.Role;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.boot.test.context.SpringBootTest;
  import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
  import org.springframework.http.HttpHeaders;
  import org.springframework.http.MediaType;
  import org.springframework.test.web.servlet.MockMvc;
  import org.springframework.transaction.annotation.Transactional;
  import java.time.LocalDate;
  import java.util.Set;

  @SpringBootTest
  @AutoConfigureMockMvc
  @Transactional
  class HorseIntegrationTest {

      @Autowired
      private MockMvc mockMvc;

      @Autowired
      private JwtService jwtService;

      @Autowired
      private HorseRepository horseRepository;

      @Autowired
      private UserRepository userRepository;

      @Autowired
      private RoleRepository roleRepository;

      @Autowired
      private UserRoleRepository userRoleRepository;

      private String adminToken;
      private String spectatorToken;
      private User ownerUser;

      @BeforeEach
      void setUp() {
          horseRepository.deleteAll();
          userRoleRepository.deleteAll();
          roleRepository.deleteAll();
          userRepository.deleteAll();

          Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
          Role specRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

          User adminUser = User.pending("Admin User", "admin@example.com", "hash");
          adminUser.verifyEmail();
          adminUser = userRepository.save(adminUser);

          ownerUser = User.pending("Owner User", "owner@example.com", "hash");
          ownerUser.verifyEmail();
          ownerUser = userRepository.save(ownerUser);

          adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
          spectatorToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("SPECTATOR"));
      }

      @Test
      void adminCanCreateHorse() throws Exception {
          String body = String.format("""
                  {
                      "ownerId": %d,
                      "name": "Secretariat",
                      "breed": "Thoroughbred",
                      "gender": "MALE",
                      "dateOfBirth": "1970-03-30",
                      "color": "Chestnut"
                  }
                  """, ownerUser.getId());

          mockMvc.perform(post("/api/v1/admin/horses")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content(body))
                  .andExpect(status().isCreated())
                  .andExpect(jsonPath("$.name").value("Secretariat"))
                  .andExpect(jsonPath("$.status").value("APPROVED"));
      }

      @Test
      void publicEndPointsReturnsOnlyApprovedHorses() throws Exception {
          Horse horse = Horse.create(ownerUser, "Draft Horse", "H_CODE_1", "Thoroughbred", "MALE", LocalDate.now(), "Black");
          org.springframework.test.util.ReflectionTestUtils.setField(horse, "status", "INACTIVE");
          horseRepository.save(horse);

          mockMvc.perform(get("/api/v1/horses"))
                  .andExpect(status().isOk())
                  .andExpect(jsonPath("$.length()").value(0));
      }
  }
  ```

- [ ] **Step 5: Run tests to verify they pass**
  Run: `mvn test -Dtest=HorseIntegrationTest` in the `backend` directory.
  Expected: BUILD SUCCESS with 2 tests passing.

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/horse/ backend/src/test/java/com/example/horseracingtournamentsystem/horse/
  git commit -m "feat: implement horse entities, service, controller, and integration tests"
  ```

---

### Task 4: Implement Race Foundation & CRUD

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/entity/Race.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/repository/RaceRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/dto/request/RaceRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/dto/response/RaceResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/service/RaceService.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/AdminRaceController.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/race/controller/RaceController.java`
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/race/RaceIntegrationTest.java`

- [ ] **Step 1: Write Race Entity and Repository**
  Implement `Race.java` mapping status to DB columns correctly. Statuses: `'SCHEDULED', 'CHECKING', 'READY', 'ONGOING', 'FINISHED', 'RESULT_SUBMITTED', 'RESULT_CONFIRMED', 'PUBLISHED', 'CANCELLED'`.
  ```java
  package com.example.horseracingtournamentsystem.race.entity;

  import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import jakarta.persistence.*;
  import java.time.LocalDateTime;
  import lombok.AccessLevel;
  import lombok.Getter;
  import lombok.NoArgsConstructor;

  @Entity
  @Table(name = "races")
  @Getter
  @NoArgsConstructor(access = AccessLevel.PROTECTED)
  public class Race {
      @Id
      @GeneratedValue(strategy = GenerationType.IDENTITY)
      private Long id;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "tournament_id", nullable = false)
      private Tournament tournament;

      @Column(name = "name", nullable = false, length = 200)
      private String name;

      @Column(name = "code", nullable = false, unique = true, length = 100)
      private String code;

      @Column(name = "race_at", nullable = false)
      private LocalDateTime raceAt;

      @Column(name = "distance_meter", nullable = false)
      private Integer distanceMeter;

      @Column(name = "max_participants", nullable = false)
      private Integer maxParticipants;

      @Column(name = "min_participants", nullable = false)
      private Integer minParticipants;

      @Column(name = "status", nullable = false, length = 40)
      private String status;

      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "created_by", nullable = false)
      private User createdBy;

      @Column(name = "created_at", nullable = false)
      private LocalDateTime createdAt;

      @Column(name = "updated_at")
      private LocalDateTime updatedAt;

      @Column(name = "deleted_at")
      private LocalDateTime deletedAt;

      public static Race create(Tournament tournament, String name, String code, LocalDateTime raceAt, 
                                 Integer distanceMeter, Integer maxParticipants, User creator) {
          Race race = new Race();
          race.tournament = tournament;
          race.name = name;
          race.code = code;
          race.raceAt = raceAt;
          race.distanceMeter = distanceMeter;
          race.maxParticipants = maxParticipants;
          race.minParticipants = 2; // default
          race.status = "SCHEDULED";
          race.createdBy = creator;
          race.createdAt = LocalDateTime.now();
          return race;
      }

      public void update(Tournament tournament, String name, LocalDateTime raceAt, Integer distanceMeter, Integer maxParticipants) {
          this.tournament = tournament;
          this.name = name;
          this.raceAt = raceAt;
          this.distanceMeter = distanceMeter;
          this.maxParticipants = maxParticipants;
          this.updatedAt = LocalDateTime.now();
      }

      public void cancel() {
          this.status = "CANCELLED";
          this.updatedAt = LocalDateTime.now();
      }

      public void softDelete() {
          this.deletedAt = LocalDateTime.now();
      }
  }
  ```

  Create `RaceRepository.java`:
  ```java
  package com.example.horseracingtournamentsystem.race.repository;

  import com.example.horseracingtournamentsystem.race.entity.Race;
  import org.springframework.data.jpa.repository.JpaRepository;
  import java.util.List;
  import java.util.Optional;

  public interface RaceRepository extends JpaRepository<Race, Long> {
      Optional<Race> findByIdAndDeletedAtIsNull(Long id);
      List<Race> findAllByDeletedAtIsNull();
      List<Race> findAllByTournamentIdAndDeletedAtIsNull(Long tournamentId);
      boolean existsByCodeAndDeletedAtIsNull(String code);
      boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, Long id);
  }
  ```

- [ ] **Step 2: Create DTOs & Services**
  Create `RaceRequest.java`:
  ```java
  package com.example.horseracingtournamentsystem.race.dto.request;

  import jakarta.validation.constraints.Min;
  import jakarta.validation.constraints.NotBlank;
  import jakarta.validation.constraints.NotNull;
  import jakarta.validation.constraints.Size;
  import java.time.LocalDateTime;
  import lombok.*;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public class RaceRequest {
      @NotNull(message = "Tournament ID is required")
      private Long tournamentId;

      @NotBlank(message = "Race name is required")
      @Size(max = 200)
      private String name;

      @NotBlank(message = "Race code is required")
      @Size(max = 100)
      private String code;

      @NotNull(message = "Race date and time is required")
      private LocalDateTime raceDateTime;

      @NotNull(message = "Distance is required")
      @Min(value = 1, message = "Distance must be greater than 0")
      private Integer distanceMeters;

      @NotNull(message = "Max participants is required")
      @Min(value = 2, message = "Max participants must be at least 2")
      private Integer maxParticipants;
  }
  ```

  Create `RaceResponse.java`:
  ```java
  package com.example.horseracingtournamentsystem.race.dto.response;

  import lombok.*;
  import java.time.LocalDateTime;

  @Getter
  @Setter
  @Builder
  @AllArgsConstructor
  public class RaceResponse {
      private Long id;
      private Long tournamentId;
      private String tournamentName;
      private String name;
      private String code;
      private LocalDateTime raceDateTime;
      private Integer distanceMeters;
      private Integer maxParticipants;
      private String status;
      private String creatorName;
      private LocalDateTime createdAt;
      private LocalDateTime updatedAt;
  }
  ```

  Create `RaceService.java`:
  ```java
  package com.example.horseracingtournamentsystem.race.service;

  import com.example.horseracingtournamentsystem.race.dto.request.RaceRequest;
  import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
  import com.example.horseracingtournamentsystem.race.entity.Race;
  import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
  import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
  import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import lombok.RequiredArgsConstructor;
  import org.springframework.http.HttpStatus;
  import org.springframework.stereotype.Service;
  import org.springframework.transaction.annotation.Transactional;
  import org.springframework.web.server.ResponseStatusException;
  import java.util.List;
  import java.util.stream.Collectors;

  @Service
  @RequiredArgsConstructor
  @Transactional(readOnly = true)
  public class RaceService {

      private final RaceRepository raceRepository;
      private final TournamentRepository tournamentRepository;
      private final UserRepository userRepository;

      @Transactional
      public RaceResponse createRace(RaceRequest req, String creatorEmail) {
          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(req.getTournamentId())
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

          if (raceRepository.existsByCodeAndDeletedAtIsNull(req.getCode())) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
          }

          User creator = userRepository.findByEmail(creatorEmail)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Creator not found"));

          Race race = Race.create(
                  tournament, req.getName(), req.getCode(), req.getRaceDateTime(),
                  req.getDistanceMeters(), req.getMaxParticipants(), creator
          );

          raceRepository.save(race);
          return mapToResponse(race);
      }

      @Transactional
      public RaceResponse updateRace(Long id, RaceRequest req) {
          Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));

          Tournament tournament = tournamentRepository.findByIdAndDeletedAtIsNull(req.getTournamentId())
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tournament not found"));

          if (raceRepository.existsByCodeAndIdNotAndDeletedAtIsNull(req.getCode(), id)) {
              throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race code already exists");
          }

          race.update(tournament, req.getName(), req.getRaceDateTime(), req.getDistanceMeters(), req.getMaxParticipants());
          raceRepository.save(race);
          return mapToResponse(race);
      }

      @Transactional
      public void deleteRace(Long id) {
          Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
          race.cancel();
          race.softDelete();
          raceRepository.save(race);
      }

      public RaceResponse getRaceDetail(Long id) {
          Race race = raceRepository.findByIdAndDeletedAtIsNull(id)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found"));
          return mapToResponse(race);
      }

      public List<RaceResponse> getAdminRaces() {
          return raceRepository.findAllByDeletedAtIsNull().stream()
                  .map(this::mapToResponse)
                  .collect(Collectors.toList());
      }

      public List<RaceResponse> getPublicRaces(Long tournamentId) {
          List<Race> races;
          if (tournamentId != null) {
              races = raceRepository.findAllByTournamentIdAndDeletedAtIsNull(tournamentId);
          } else {
              races = raceRepository.findAllByDeletedAtIsNull();
          }
          return races.stream()
                  .map(this::mapToResponse)
                  .collect(Collectors.toList());
      }

      private RaceResponse mapToResponse(Race r) {
          return RaceResponse.builder()
                  .id(r.getId())
                  .tournamentId(r.getTournament().getId())
                  .tournamentName(r.getTournament().getName())
                  .name(r.getName())
                  .code(r.getCode())
                  .raceDateTime(r.getRaceAt())
                  .distanceMeters(r.getDistanceMeter())
                  .maxParticipants(r.getMaxParticipants())
                  .status(r.getStatus())
                  .creatorName(r.getCreatedBy().getFullName())
                  .createdAt(r.getCreatedAt())
                  .updatedAt(r.getUpdatedAt())
                  .build();
      }
  }
  ```

- [ ] **Step 3: Create Controllers**
  Create `AdminRaceController.java`:
  ```java
  package com.example.horseracingtournamentsystem.race.controller;

  import com.example.horseracingtournamentsystem.race.dto.request.RaceRequest;
  import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
  import com.example.horseracingtournamentsystem.race.service.RaceService;
  import jakarta.validation.Valid;
  import lombok.RequiredArgsConstructor;
  import org.springframework.http.HttpStatus;
  import org.springframework.web.bind.annotation.*;
  import java.security.Principal;
  import java.util.List;

  @RestController
  @RequestMapping("/api/v1/admin/races")
  @RequiredArgsConstructor
  public class AdminRaceController {

      private final RaceService raceService;

      @PostMapping
      @ResponseStatus(HttpStatus.CREATED)
      public RaceResponse createRace(@Valid @RequestBody RaceRequest req, Principal principal) {
          return raceService.createRace(req, principal.getName());
      }

      @PutMapping("/{id}")
      public RaceResponse updateRace(@PathVariable Long id, @Valid @RequestBody RaceRequest req) {
          return raceService.updateRace(id, req);
      }

      @DeleteMapping("/{id}")
      @ResponseStatus(HttpStatus.NO_CONTENT)
      public void deleteRace(@PathVariable Long id) {
          raceService.deleteRace(id);
      }

      @GetMapping
      public List<RaceResponse> listAll() {
          return raceService.getAdminRaces();
      }

      @GetMapping("/{id}")
      public RaceResponse getDetail(@PathVariable Long id) {
          return raceService.getRaceDetail(id);
      }
  }
  ```

  Create `RaceController.java`:
  ```java
  package com.example.horseracingtournamentsystem.race.controller;

  import com.example.horseracingtournamentsystem.race.dto.response.RaceResponse;
  import com.example.horseracingtournamentsystem.race.service.RaceService;
  import lombok.RequiredArgsConstructor;
  import org.springframework.web.bind.annotation.*;
  import java.util.List;

  @RestController
  @RequestMapping("/api/v1/races")
  @RequiredArgsConstructor
  public class RaceController {

      private final RaceService raceService;

      @GetMapping
      public List<RaceResponse> listPublic(@RequestParam(required = false) Long tournamentId) {
          return raceService.getPublicRaces(tournamentId);
      }

      @GetMapping("/{id}")
      public RaceResponse getPublicDetail(@PathVariable Long id) {
          return raceService.getRaceDetail(id);
      }
  }
  ```

- [ ] **Step 4: Write failing/passing tests**
  Create `RaceIntegrationTest.java`:
  ```java
  package com.example.horseracingtournamentsystem.race;

  import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
  import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

  import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
  import com.example.horseracingtournamentsystem.security.JwtService;
  import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
  import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
  import com.example.horseracingtournamentsystem.user.entity.Role;
  import com.example.horseracingtournamentsystem.user.entity.User;
  import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
  import com.example.horseracingtournamentsystem.user.repository.UserRepository;
  import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
  import org.junit.jupiter.api.BeforeEach;
  import org.junit.jupiter.api.Test;
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.boot.test.context.SpringBootTest;
  import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
  import org.springframework.http.HttpHeaders;
  import org.springframework.http.MediaType;
  import org.springframework.test.web.servlet.MockMvc;
  import org.springframework.transaction.annotation.Transactional;
  import java.time.LocalDate;
  import java.time.LocalDateTime;
  import java.util.Set;

  @SpringBootTest
  @AutoConfigureMockMvc
  @Transactional
  class RaceIntegrationTest {

      @Autowired
      private MockMvc mockMvc;

      @Autowired
      private JwtService jwtService;

      @Autowired
      private RaceRepository raceRepository;

      @Autowired
      private TournamentRepository tournamentRepository;

      @Autowired
      private UserRepository userRepository;

      @Autowired
      private RoleRepository roleRepository;

      @Autowired
      private UserRoleRepository userRoleRepository;

      private String adminToken;
      private String spectatorToken;
      private Tournament tournament;
      private User adminUser;

      @BeforeEach
      void setUp() {
          raceRepository.deleteAll();
          tournamentRepository.deleteAll();
          userRoleRepository.deleteAll();
          roleRepository.deleteAll();
          userRepository.deleteAll();

          Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
          Role specRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

          adminUser = User.pending("Admin User", "admin@example.com", "hash");
          adminUser.verifyEmail();
          adminUser = userRepository.save(adminUser);

          User specUser = User.pending("Spectator User", "spec@example.com", "hash");
          specUser.verifyEmail();
          specUser = userRepository.save(specUser);

          adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
          spectatorToken = jwtService.generateToken(specUser.getEmail(), Set.of("SPECTATOR"));

          tournament = Tournament.create(
                  "Main Cup", "MC_01", "Main Cup Desc", "Tracks",
                  LocalDate.now(), LocalDate.now().plusDays(10),
                  LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                  20, adminUser
          );
          tournament = tournamentRepository.save(tournament);
      }

      @Test
      void adminCanCreateRace() throws Exception {
          String body = String.format("""
                  {
                      "tournamentId": %d,
                      "name": "Grand Sprint",
                      "code": "SPRINT_01",
                      "raceDateTime": "2026-06-15T14:30:00",
                      "distanceMeters": 1200,
                      "maxParticipants": 12
                  }
                  """, tournament.getId());

          mockMvc.perform(post("/api/v1/admin/races")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content(body))
                  .andExpect(status().isCreated())
                  .andExpect(jsonPath("$.name").value("Grand Sprint"))
                  .andExpect(jsonPath("$.status").value("SCHEDULED"));
      }

      @Test
      void createRaceFailsIfTournamentDoesNotExist() throws Exception {
          String body = """
                  {
                      "tournamentId": 9999,
                      "name": "Grand Sprint",
                      "code": "SPRINT_01",
                      "raceDateTime": "2026-06-15T14:30:00",
                      "distanceMeters": 1200,
                      "maxParticipants": 12
                  }
                  """;

          mockMvc.perform(post("/api/v1/admin/races")
                          .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                          .contentType(MediaType.APPLICATION_JSON)
                          .content(body))
                  .andExpect(status().isNotFound());
      }
  }
  ```

- [ ] **Step 5: Run tests to verify they pass**
  Run: `mvn test -Dtest=RaceIntegrationTest` in the `backend` directory.
  Expected: BUILD SUCCESS with 2 tests passing.

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/example/horseracingtournamentsystem/race/ backend/src/test/java/com/example/horseracingtournamentsystem/race/
  git commit -m "feat: implement race entities, service, controller, and integration tests"
  ```

---

## Verification Before Claiming Completion

### Step 1: Run Full Test Suite
Run: `mvn clean test` in the `backend` directory.
Expected: Build success with all existing tests (auth, users, security) and our new integration tests (Horse, Tournament, Race) passing flawlessly!
No linting/compilation issues.

### Step 2: Validate API Handshakes
Run code audits to guarantee no regression on user registration, authentication or profile services.
Check database constraint mappings.
