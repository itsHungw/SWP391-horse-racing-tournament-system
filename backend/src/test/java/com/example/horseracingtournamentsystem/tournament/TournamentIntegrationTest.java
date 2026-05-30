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
    void adminCannotModifyOngoingOrCompletedTournament() throws Exception {
        com.example.horseracingtournamentsystem.tournament.entity.Tournament t = 
            com.example.horseracingtournamentsystem.tournament.entity.Tournament.create(
                "Derby", "DB_26", "Desc", "Loc", 
                LocalDate.now(), LocalDate.now().plusDays(5),
                LocalDateTime.now(), LocalDateTime.now().plusDays(2),
                20, adminUser
            );
        t.startOngoing(); // status is ONGOING
        t = tournamentRepository.save(t);

        String updateBody = """
                {
                    "name": "Updated Name",
                    "code": "DB_26",
                    "description": "Desc",
                    "location": "Loc",
                    "startDate": "2026-07-01",
                    "endDate": "2026-07-15",
                    "registrationStartAt": "2026-06-01T00:00:00",
                    "registrationEndAt": "2026-06-25T00:00:00",
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
                        .param("status", "ONGOING"))
                .andExpect(status().isOk());

        // Transition to COMPLETED
        mockMvc.perform(put("/api/v1/admin/tournaments/" + t.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .param("status", "COMPLETED"))
                .andExpect(status().isOk());
    }
}
