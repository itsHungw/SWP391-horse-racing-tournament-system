package com.example.horseracingtournamentsystem.user;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleHistoryRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
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
class AdminUserRoleManagementIntegrationTest {

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
    private UserRoleHistoryRepository userRoleHistoryRepository;

    private User admin;
    private User applicant;
    private String adminToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        userRoleHistoryRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        roleRepository.save(Role.of("HORSE_OWNER", "Horse owner"));
        roleRepository.save(Role.of("JOCKEY", "Jockey"));
        roleRepository.save(Role.of("REFEREE", "Referee"));
        roleRepository.save(Role.of("ORGANIZER", "Organizer"));

        admin = userRepository.save(User.pending("Admin User", "admin-role@example.com", "hash"));
        admin.verifyEmail();
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));

        applicant = userRepository.save(User.pending("Role Applicant", "applicant-role@example.com", "hash"));
        applicant.verifyEmail();
        userRoleRepository.save(UserRole.active(applicant, spectatorRole, admin));

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void adminCanAssignMultiplePersonalRolesByStableRoleName() throws Exception {
        String body = """
                {
                    "roleNames": ["SPECTATOR", "HORSE_OWNER", "JOCKEY"],
                    "reason": "Approved cross-discipline participation."
                }
                """;

        mockMvc.perform(put("/api/v1/admin/users/{id}/roles", applicant.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", containsInAnyOrder("SPECTATOR", "HORSE_OWNER", "JOCKEY")));
    }
}
