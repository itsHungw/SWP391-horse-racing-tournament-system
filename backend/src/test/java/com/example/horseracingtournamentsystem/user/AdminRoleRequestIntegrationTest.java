package com.example.horseracingtournamentsystem.user;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
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
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AdminRoleRequestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRequestRepository roleRequestRepository;

    private String adminToken;
    private User admin;
    private User applicant;

    @BeforeEach
    void setUp() {
        roleRequestRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        roleRepository.save(Role.of("JOCKEY", "Jockey"));
        roleRepository.save(Role.of("OWNER", "Owner"));

        admin = userRepository.save(User.pending("Admin User", "admin@example.com", "hash"));
        admin.verifyEmail();
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));

        applicant = User.pending("Minh Quan", "quan@example.com", "hash", "0909123456");
        applicant.verifyEmail();
        ReflectionTestUtils.setField(applicant, "dateOfBirth", LocalDate.of(2000, 1, 2));
        ReflectionTestUtils.setField(applicant, "gender", "MALE");
        ReflectionTestUtils.setField(applicant, "address", "Ho Chi Minh City");
        ReflectionTestUtils.setField(applicant, "profileCompleted", true);
        applicant = userRepository.save(applicant);
        userRoleRepository.save(UserRole.active(applicant, spectatorRole, admin));

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void adminCanListRoleRequestsWithNestedUserDetail() throws Exception {
        roleRequestRepository.save(RoleRequest.pending(
                applicant,
                "JOCKEY",
                "I have racing experience.",
                "https://example.com/cert"
        ));

        mockMvc.perform(get("/api/v1/admin/role-requests")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Minh Quan"))
                .andExpect(jsonPath("$[0].email").value("quan@example.com"))
                .andExpect(jsonPath("$[0].requestedRole").value("JOCKEY"))
                .andExpect(jsonPath("$[0].user.id").value(applicant.getId()))
                .andExpect(jsonPath("$[0].user.phone").value("0909123456"))
                .andExpect(jsonPath("$[0].user.dateOfBirth").value("2000-01-02"))
                .andExpect(jsonPath("$[0].user.gender").value("MALE"))
                .andExpect(jsonPath("$[0].user.address").value("Ho Chi Minh City"))
                .andExpect(jsonPath("$[0].user.emailVerified").value(true))
                .andExpect(jsonPath("$[0].user.profileCompleted").value(true))
                .andExpect(jsonPath("$[0].user.roles", containsInAnyOrder("SPECTATOR")));
    }

    @Test
    void adminCanFilterRoleRequestsByStatus() throws Exception {
        roleRequestRepository.save(RoleRequest.pending(applicant, "JOCKEY", "Pending request", null));
        RoleRequest rejected = RoleRequest.pending(applicant, "OWNER", "Rejected request", null);
        rejected.reject(admin, "Not enough evidence.");
        roleRequestRepository.save(rejected);

        mockMvc.perform(get("/api/v1/admin/role-requests")
                        .param("status", "PENDING")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].requestedRole").value("JOCKEY"));
    }

    @Test
    void adminCanApproveRoleRequest() throws Exception {
        RoleRequest request = roleRequestRepository.save(RoleRequest.pending(
                applicant,
                "JOCKEY",
                "Please approve me.",
                null
        ));

        mockMvc.perform(post("/api/v1/admin/role-requests/{id}/approve", request.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"adminNote\":\"Approved for the next tournament.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.adminNote").value("Approved for the next tournament."))
                .andExpect(jsonPath("$.reviewedAt", notNullValue()))
                .andExpect(jsonPath("$.reviewedBy.id").value(admin.getId()));
    }

    @Test
    void adminCanRejectRoleRequest() throws Exception {
        RoleRequest request = roleRequestRepository.save(RoleRequest.pending(
                applicant,
                "JOCKEY",
                "Please review me.",
                null
        ));

        mockMvc.perform(post("/api/v1/admin/role-requests/{id}/reject", request.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Evidence document is missing.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.adminNote").value("Evidence document is missing."))
                .andExpect(jsonPath("$.reviewedAt", notNullValue()))
                .andExpect(jsonPath("$.reviewedBy.email").value(admin.getEmail()));
    }
}
