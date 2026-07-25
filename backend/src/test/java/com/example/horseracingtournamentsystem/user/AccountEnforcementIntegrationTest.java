package com.example.horseracingtournamentsystem.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
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
class AccountEnforcementIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRoleRepository userRoleRepository;

    private User admin;
    private User target;
    private String adminToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        admin = activeUser("Enforcement Admin", "enforcement-admin@example.com");
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));

        User backupAdmin = activeUser("Backup Admin", "backup-admin@example.com");
        userRoleRepository.save(UserRole.active(backupAdmin, adminRole, admin));

        target = activeUser("Target User", "target-user@example.com");
        userRoleRepository.save(UserRole.active(target, spectatorRole, admin));

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void adminCanSuspendRestoreBanAndReopenWithAuditHistory() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users/{id}/suspend", target.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "reason": "Account activity is under review",
                                  "internalNote": "Case RACE-42",
                                  "lockWallet": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));

        transition("restore", "Review completed", "ACTIVE");

        mockMvc.perform(post("/api/v1/admin/users/{id}/ban", target.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Direct ban is not permitted\"}"))
                .andExpect(status().isConflict());

        transition("suspend", "Second review", "SUSPENDED");
        transition("ban", "Confirmed policy violation", "BANNED");
        transition("reopen", "Appeal accepted for review", "SUSPENDED");

        mockMvc.perform(get("/api/v1/admin/users/{id}/status-history", target.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].publicReason").value("Appeal accepted for review"))
                .andExpect(jsonPath("$[4].internalNote").value("Case RACE-42"));
    }

    @Test
    void adminCannotSuspendOwnAccount() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users/{id}/suspend", admin.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Self action\",\"lockWallet\":false}"))
                .andExpect(status().isForbidden());
    }

    private void transition(String action, String reason, String expectedStatus) throws Exception {
        String body = action.equals("suspend")
                ? "{\"reason\":\"" + reason + "\",\"lockWallet\":false}"
                : "{\"reason\":\"" + reason + "\"}";

        mockMvc.perform(post("/api/v1/admin/users/{id}/{action}", target.getId(), action)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(expectedStatus));
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
