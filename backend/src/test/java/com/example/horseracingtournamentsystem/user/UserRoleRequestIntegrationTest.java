package com.example.horseracingtournamentsystem.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.RoleRequest;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.RoleRequestRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class UserRoleRequestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRequestRepository roleRequestRepository;

    private String userToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        roleRequestRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        roleRepository.save(Role.of("HORSE_OWNER", "Horse Owner"));
        roleRepository.save(Role.of("JOCKEY", "Jockey"));
        roleRepository.save(Role.of("REFEREE", "Referee"));
        roleRepository.save(Role.of("ORGANIZER", "Organizer"));

        User user = User.pending("Minh Quan", "quan@example.com", "hash", "0909123456");
        user.verifyEmail();
        user.updateProfile(
                "Minh Quan",
                "0909123456",
                "MALE",
                LocalDate.of(2000, 1, 2),
                "Ho Chi Minh City",
                null
        );
        userRepository.save(user);

        userToken = jwtService.generateToken(user.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void userCanSubmitAndListOwnRoleRequests() throws Exception {
        String submitRequest = """
                {
                    "requestedRole": "JOCKEY",
                    "reason": "I have race-day experience and want to join tournament lineups.",
                    "resumeUrl": "/api/v1/files/private/minh-quan.pdf"
                }
                """;

        mockMvc.perform(post("/api/v1/role-requests")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedRole").value("JOCKEY"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.cvReviewStatus").value("NOT_REVIEWED"))
                .andExpect(jsonPath("$.resumeUrl").value("/api/v1/files/private/minh-quan.pdf"))
                .andExpect(jsonPath("$.rejectReason").doesNotExist());

        mockMvc.perform(get("/api/v1/role-requests/my")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].requestedRole").value("JOCKEY"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].cvReviewStatus").value("NOT_REVIEWED"))
                .andExpect(jsonPath("$[0].resumeUrl").value("/api/v1/files/private/minh-quan.pdf"));
    }

    @Test
    void submitRoleRequestRequiresResumeUrl() throws Exception {
        String submitRequest = """
                {
                    "requestedRole": "JOCKEY",
                    "reason": "I have race-day experience and want to join tournament lineups."
                }
                """;

        mockMvc.perform(post("/api/v1/role-requests")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.resumeUrl").value("Resume file is required"));
    }

    @Test
    void userCanRequestAnotherPersonalRoleWhenAlreadyHasActivePersonalRole() throws Exception {
        User user = userRepository.findWithUserRolesByEmail("quan@example.com").orElseThrow();
        Role jockeyRole = roleRepository.findByName("JOCKEY").orElseThrow();
        userRoleRepository.save(UserRole.active(user, jockeyRole, user));

        String submitRequest = """
                {
                    "requestedRole": "HORSE_OWNER",
                    "reason": "I want to manage ownership workflows after joining the circuit.",
                    "resumeUrl": "https://example.com/resumes/owner.pdf"
                }
                """;

        mockMvc.perform(post("/api/v1/role-requests")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedRole").value("HORSE_OWNER"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void userCanRequestDifferentPersonalRoleWhenAnotherPersonalRequestIsPending() throws Exception {
        User user = userRepository.findByEmail("quan@example.com").orElseThrow();
        roleRequestRepository.save(RoleRequest.pending(
                user,
                "JOCKEY",
                "I have race-day experience and want to join tournament lineups.",
                "https://example.com/resumes/jockey.pdf"
        ));

        String submitRequest = """
                {
                    "requestedRole": "REFEREE",
                    "reason": "I want to support tournament integrity and review workflows.",
                    "resumeUrl": "https://example.com/resumes/referee.pdf"
                }
                """;

        mockMvc.perform(post("/api/v1/role-requests")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedRole").value("REFEREE"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void organizerAccountCannotRequestPersonalParticipationRole() throws Exception {
        User user = userRepository.findWithUserRolesByEmail("quan@example.com").orElseThrow();
        Role organizerRole = roleRepository.findByName("ORGANIZER").orElseThrow();
        userRoleRepository.save(UserRole.active(user, organizerRole, user));

        String submitRequest = """
                {
                    "requestedRole": "JOCKEY",
                    "reason": "I want to ride in selected championships.",
                    "resumeUrl": "https://example.com/resumes/jockey.pdf"
                }
                """;

        mockMvc.perform(post("/api/v1/role-requests")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitRequest))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Organizer accounts cannot request personal participation roles"));
    }
}
