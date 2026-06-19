package com.example.horseracingtournamentsystem.tournament;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;
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
import org.springframework.jdbc.core.JdbcTemplate;
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
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private RaceRepository raceRepository;

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
        TestDatabaseCleaner.clean(jdbcTemplate);
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
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(adminUser, adminRole, adminUser));

        User specUser = User.pending("Spectator User", "spec@example.com", "hash");
        specUser.verifyEmail();
        specUser = userRepository.save(specUser);
        userRoleRepository.save(com.example.horseracingtournamentsystem.user.entity.UserRole.active(specUser, specRole, adminUser));

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
                    "startDate": "2099-07-01",
                    "endDate": "2099-07-15",
                    "registrationStartAt": "2099-06-01T00:00:00",
                    "registrationEndAt": "2099-06-25T00:00:00",
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
    void publicDiscoveryFiltersChampionshipsAndIncludesSummaryData() throws Exception {
        Tournament summer = Tournament.create(
                "Summer Gold Championship", "SUMMER_GOLD", "Premium summer series", "Belmont Park",
                LocalDate.of(2099, 7, 1), LocalDate.of(2099, 7, 20),
                LocalDateTime.of(2099, 6, 1, 9, 0), LocalDateTime.of(2099, 6, 25, 18, 0),
                32, adminUser
        );
        summer.openRegistration();
        summer = tournamentRepository.save(summer);
        raceRepository.save(Race.create(
                summer, "Belmont Sprint", "BELMONT_SPRINT",
                LocalDateTime.of(2099, 7, 3, 14, 0), 1200, 12, adminUser
        ));

        Tournament completed = Tournament.create(
                "Summer Heritage Championship", "SUMMER_HERITAGE", "Completed series", "Saratoga",
                LocalDate.of(2099, 5, 1), LocalDate.of(2099, 5, 20),
                LocalDateTime.of(2099, 4, 1, 9, 0), LocalDateTime.of(2099, 4, 20, 18, 0),
                24, adminUser
        );
        completed.completeTournament();
        tournamentRepository.save(completed);

        mockMvc.perform(get("/api/v1/tournaments/search")
                        .param("search", "gold")
                        .param("status", "OPEN_REGISTRATION")
                        .param("year", "2099")
                        .param("sortBy", "REGISTRATION_CLOSING_SOON")
                        .param("page", "0")
                        .param("size", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Summer Gold Championship"))
                .andExpect(jsonPath("$.content[0].raceCount").value(1))
                .andExpect(jsonPath("$.content[0].participantCount").value(0))
                .andExpect(jsonPath("$.content[0].nextRace.name").value("Belmont Sprint"))
                .andExpect(jsonPath("$.content[0].nextRace.raceDateTime").value("2099-07-03T14:00:00"));
    }

    @Test
    void publicDiscoveryPaginatesAndSortsLatestChampionships() throws Exception {
        Tournament older = Tournament.create(
                "Heritage Cup", "HERITAGE_CUP", "Older public championship", "Belmont Park",
                LocalDate.of(2098, 7, 1), LocalDate.of(2098, 7, 20),
                LocalDateTime.of(2098, 6, 1, 9, 0), LocalDateTime.of(2098, 6, 25, 18, 0),
                32, adminUser
        );
        older.completeTournament();
        tournamentRepository.save(older);

        Tournament newer = Tournament.create(
                "Future Cup", "FUTURE_CUP", "Latest public championship", "Belmont Park",
                LocalDate.of(2099, 7, 1), LocalDate.of(2099, 7, 20),
                LocalDateTime.of(2099, 6, 1, 9, 0), LocalDateTime.of(2099, 6, 25, 18, 0),
                32, adminUser
        );
        newer.openRegistration();
        tournamentRepository.save(newer);

        mockMvc.perform(get("/api/v1/tournaments/search")
                        .param("sortBy", "LATEST")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content[0].name").value("Future Cup"));
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

    @Test
    void registrationStartInPastReturnsBadRequest() throws Exception {
        String body = """
                {
                    "name": "Future Derby",
                    "code": "FUTURE_DERBY",
                    "description": "Registration must not start in the past",
                    "location": "Saratoga Tracks",
                    "startDate": "2099-07-01",
                    "endDate": "2099-07-15",
                    "registrationStartAt": "2000-06-01T00:00:00",
                    "registrationEndAt": "2099-06-25T00:00:00",
                    "maxHorses": 50
                }
                """;

        mockMvc.perform(post("/api/v1/admin/tournaments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration start time cannot be in the past"));
    }

    @Test
    void registrationEndAtTournamentStartReturnsBadRequest() throws Exception {
        String body = """
                {
                    "name": "Future Derby",
                    "code": "FUTURE_DERBY",
                    "description": "Registration must finish before the tournament starts",
                    "location": "Saratoga Tracks",
                    "startDate": "2099-07-01",
                    "endDate": "2099-07-15",
                    "registrationStartAt": "2099-06-01T00:00:00",
                    "registrationEndAt": "2099-07-01T00:00:00",
                    "maxHorses": 50
                }
                """;

        mockMvc.perform(post("/api/v1/admin/tournaments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration end time must be before tournament start date"));
    }

    @Test
    void updatingRegistrationEndAfterTournamentStartReturnsBadRequest() throws Exception {
        com.example.horseracingtournamentsystem.tournament.entity.Tournament tournament =
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Future Derby", "FUTURE_DERBY", "Desc", "Loc",
                LocalDate.of(2099, 7, 1), LocalDate.of(2099, 7, 15),
                LocalDateTime.of(2099, 6, 1, 0, 0), LocalDateTime.of(2099, 6, 25, 0, 0),
                20, adminUser
            );
        tournament = tournamentRepository.save(tournament);

        String updateBody = """
                {
                    "name": "Updated Future Derby",
                    "code": "FUTURE_DERBY",
                    "description": "Desc",
                    "location": "Loc",
                    "startDate": "2099-07-01",
                    "endDate": "2099-07-15",
                    "registrationStartAt": "2099-06-01T00:00:00",
                    "registrationEndAt": "2099-07-01T00:01:00",
                    "maxHorses": 20
                }
                """;

        mockMvc.perform(put("/api/v1/admin/tournaments/" + tournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Registration end time must be before tournament start date"));
    }

    @Test
    void adminCannotDeleteActiveTournament() throws Exception {
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t = 
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby", "DB_26", "Desc", "Loc", 
                LocalDate.now(), LocalDate.now().plusDays(5),
                LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                20, adminUser
            );
        t.openRegistration(); // sets status to OPEN_REGISTRATION
        t = tournamentRepository.save(t);

        mockMvc.perform(delete("/api/v1/admin/tournaments/" + t.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminCannotModifyActiveTournament() throws Exception {
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t = 
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby", "DB_26", "Desc", "Loc", 
                LocalDate.now(), LocalDate.now().plusDays(5),
                LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                20, adminUser
            );
        t.openRegistration(); // status is OPEN_REGISTRATION
        t = tournamentRepository.save(t);

        String updateBody = """
                {
                    "name": "Updated Name",
                    "code": "DB_26",
                    "description": "Desc",
                    "location": "Loc",
                    "startDate": "2099-07-01",
                    "endDate": "2099-07-15",
                    "registrationStartAt": "2099-06-01T00:00:00",
                    "registrationEndAt": "2099-06-25T00:00:00",
                    "maxHorses": 50
                }
                """;

        mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminCanTransitionToAllStatuses() throws Exception {
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t = 
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby", "DB_26", "Desc", "Loc", 
                LocalDate.now(), LocalDate.now().plusDays(5),
                LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                20, adminUser
            );
        t = tournamentRepository.save(t);

        // Transition to OPEN_REGISTRATION
        mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("status", "OPEN_REGISTRATION"))
                .andExpect(status().isOk());

        // Transition to ONGOING
        mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("status", "PARTICIPANTS_LOCKED"))
                .andExpect(status().isOk());

        // Transition to ONGOING
        mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("status", "ONGOING"))
                .andExpect(status().isOk());

        // Transition to COMPLETED
        mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk());
    }

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
                    "startDate": "2099-07-01",
                    "endDate": "2099-07-15",
                    "registrationStartAt": "2099-06-01T00:00:00",
                    "registrationEndAt": "2099-06-25T00:00:00",
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
                .andExpect(status().isOk());

        com.example.horseracingtournamentsystem.tournament.entity.Tournament updated = 
            tournamentRepository.findById(t.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(TournamentStatus.OPEN_REGISTRATION, updated.getStatus());
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

        // 2. CLOSED_REGISTRATION past startDate stays closed until participants are locked
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t2 = 
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby 2", "DB_2", "Desc", "Loc", 
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(5),
                LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(2),
                20, adminUser
        );
        t2.closeRegistration();
        t2 = tournamentRepository.save(t2);

        // 3. PARTICIPANTS_LOCKED past startDate stays locked until schedule is published
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t3 =
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby 3", "DB_3", "Desc", "Loc",
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(5),
                LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(2),
                20, adminUser
            );
        t3.lockParticipants();
        t3 = tournamentRepository.save(t3);

        // 4. SCHEDULE_PUBLISHED past startDate -> ONGOING
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t4 =
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby 4", "DB_4", "Desc", "Loc",
                LocalDate.now().minusDays(1), LocalDate.now().plusDays(5),
                LocalDateTime.now().minusDays(5), LocalDateTime.now().minusDays(2),
                20, adminUser
            );
        t4.lockParticipants();
        t4.publishSchedule();
        t4 = tournamentRepository.save(t4);

        // Run scheduler
        tournamentScheduler.checkTournamentStatusTransitions();

        // Assertions
        com.example.horseracingtournamentsystem.tournament.entity.Tournament updatedT1 = 
            tournamentRepository.findById(t1.getId()).orElseThrow();
        com.example.horseracingtournamentsystem.tournament.entity.Tournament updatedT2 = 
            tournamentRepository.findById(t2.getId()).orElseThrow();
        com.example.horseracingtournamentsystem.tournament.entity.Tournament updatedT3 =
            tournamentRepository.findById(t3.getId()).orElseThrow();
        com.example.horseracingtournamentsystem.tournament.entity.Tournament updatedT4 =
            tournamentRepository.findById(t4.getId()).orElseThrow();

        org.junit.jupiter.api.Assertions.assertEquals(TournamentStatus.CLOSED_REGISTRATION, updatedT1.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(TournamentStatus.CLOSED_REGISTRATION, updatedT2.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(TournamentStatus.PARTICIPANTS_LOCKED, updatedT3.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals(TournamentStatus.ONGOING, updatedT4.getStatus());
    }
}
