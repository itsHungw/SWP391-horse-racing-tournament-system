package com.example.horseracingtournamentsystem.championship;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JockeyPoolApplicationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    private String adminToken;
    private String jockeyToken;
    private String ownerToken;
    private Tournament openTournament;
    private User adminUser;
    private User jockeyUser;
    private User ownerUser;

    @BeforeEach
    void setUp() {
        tournamentRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Admin"));
        Role jockeyRole = roleRepository.save(Role.of("JOCKEY", "Jockey"));
        Role ownerRole = roleRepository.save(Role.of("HORSE_OWNER", "Horse owner"));

        adminUser = saveActiveUser("Admin User", "admin-pool@example.com");
        jockeyUser = saveActiveUser("Jockey User", "jockey-pool@example.com");
        ownerUser = saveActiveUser("Owner User", "owner-pool@example.com");

        userRoleRepository.save(UserRole.active(adminUser, adminRole, adminUser));
        userRoleRepository.save(UserRole.active(jockeyUser, jockeyRole, adminUser));
        userRoleRepository.save(UserRole.active(ownerUser, ownerRole, adminUser));

        openTournament = Tournament.create(
                "Spring Cup 2026", "SPRING_POOL_2026", "Pool championship", "Saigon Track",
                LocalDate.of(2026, 3, 1), LocalDate.of(2026, 5, 30),
                LocalDateTime.of(2026, 2, 1, 9, 0), LocalDateTime.of(2026, 2, 20, 18, 0),
                20, adminUser
        );
        openTournament.openRegistration();
        openTournament = tournamentRepository.save(openTournament);

        adminToken = jwtService.generateToken(adminUser.getEmail(), Set.of("ADMIN"));
        jockeyToken = jwtService.generateToken(jockeyUser.getEmail(), Set.of("JOCKEY"));
        ownerToken = jwtService.generateToken(ownerUser.getEmail(), Set.of("HORSE_OWNER"));
    }

    @Test
    void jockeyAppliesAndAdminApprovesForChampionshipPool() throws Exception {
        Long applicationId = submitJockeyApplication();

        mockMvc.perform(get("/api/v1/admin/championships/{id}/jockey-pool-applications", openTournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(applicationId))
                .andExpect(jsonPath("$[0].championshipId").value(openTournament.getId()))
                .andExpect(jsonPath("$[0].jockeyId").value(jockeyUser.getId()))
                .andExpect(jsonPath("$[0].jockeyName").value("Jockey User"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].message").value("Available for the full championship."));

        mockMvc.perform(post("/api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/approve",
                        openTournament.getId(), applicationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED_FOR_POOL"))
                .andExpect(jsonPath("$.reviewedBy").value(adminUser.getId()));

        mockMvc.perform(get("/api/v1/owner/championships/{id}/jockey-pool", openTournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jockeyId").value(jockeyUser.getId()))
                .andExpect(jsonPath("$[0].jockeyName").value("Jockey User"))
                .andExpect(jsonPath("$[0].status").value("APPROVED_FOR_POOL"));
    }

    @Test
    void jockeyCannotApplyTwiceToSameChampionshipPool() throws Exception {
        submitJockeyApplication();

        mockMvc.perform(post("/api/v1/jockey/championships/{id}/pool-applications", openTournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Second application"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void jockeyCanListChampionshipsWithOwnApplicationState() throws Exception {
        mockMvc.perform(get("/api/v1/jockey/championships")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(openTournament.getId()))
                .andExpect(jsonPath("$[0].name").value("Spring Cup 2026"))
                .andExpect(jsonPath("$[0].applicationStatus").value("NOT_APPLIED"))
                .andExpect(jsonPath("$[0].applicationId").doesNotExist())
                .andExpect(jsonPath("$[0].canApply").value(true))
                .andExpect(jsonPath("$[0].applicationWindowOpen").value(true))
                .andExpect(jsonPath("$[0].approvedPoolCount").value(0));

        Long applicationId = submitJockeyApplication();

        mockMvc.perform(get("/api/v1/jockey/championships")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(openTournament.getId()))
                .andExpect(jsonPath("$[0].applicationStatus").value("PENDING"))
                .andExpect(jsonPath("$[0].applicationId").value(applicationId))
                .andExpect(jsonPath("$[0].applicationMessage").value("Available for the full championship."))
                .andExpect(jsonPath("$[0].canApply").value(false));
    }

    @Test
    void jockeyCanListOwnPoolApplications() throws Exception {
        Long applicationId = submitJockeyApplication();

        mockMvc.perform(get("/api/v1/jockey/championships/applications")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(applicationId))
                .andExpect(jsonPath("$[0].championshipId").value(openTournament.getId()))
                .andExpect(jsonPath("$[0].championshipName").value("Spring Cup 2026"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].message").value("Available for the full championship."));
    }

    @Test
    void jockeyCanReapplyAfterRejectedApplicationWithoutCreatingDuplicateRow() throws Exception {
        Long applicationId = submitJockeyApplication();

        mockMvc.perform(post("/api/v1/admin/championships/{championshipId}/jockey-pool-applications/{applicationId}/reject",
                        openTournament.getId(), applicationId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":"Need clearer availability note."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        mockMvc.perform(post("/api/v1/jockey/championships/{id}/pool-applications", openTournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Updated availability for all rounds."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(applicationId))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.message").value("Updated availability for all rounds."))
                .andExpect(jsonPath("$.rejectionReason").doesNotExist());
    }

    private Long submitJockeyApplication() throws Exception {
        String location = mockMvc.perform(post("/api/v1/jockey/championships/{id}/pool-applications", openTournament.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + jockeyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Available for the full championship."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.championshipId").value(openTournament.getId()))
                .andExpect(jsonPath("$.jockeyId").value(jockeyUser.getId()))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return Long.valueOf(location.replaceAll(".*\\\"id\\\":(\\d+).*", "$1"));
    }

    private User saveActiveUser(String fullName, String email) {
        User user = User.pending(fullName, email, "hash");
        user.verifyEmail();
        return userRepository.save(user);
    }
}
