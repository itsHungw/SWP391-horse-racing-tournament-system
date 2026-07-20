package com.example.horseracingtournamentsystem.wallet;

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
class WalletEnforcementIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRoleRepository userRoleRepository;

    private User admin;
    private User target;
    private String token;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));
        admin = activeUser("Wallet Admin", "wallet-admin@example.com");
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        target = activeUser("Wallet Target", "wallet-target@example.com");
        userRoleRepository.save(UserRole.active(target, spectatorRole, admin));
        token = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
    }

    @Test
    void adminCanFreezeAndRestoreWithdrawalsWithAudit() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/{id}/wallet-control", target.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.walletStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.canWithdraw").value(true));

        transition("lock", "Financial review", "LOCKED", false);

        mockMvc.perform(post("/api/v1/admin/users/{id}/wallet/lock", target.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Duplicate\"}"))
                .andExpect(status().isConflict());

        transition("unlock", "Review completed", "ACTIVE", true);

        mockMvc.perform(get("/api/v1/admin/users/{id}/wallet-status-history", target.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].publicReason").value("Review completed"))
                .andExpect(jsonPath("$[1].publicReason").value("Financial review"));
    }

    @Test
    void adminCannotFreezeOwnWallet() throws Exception {
        mockMvc.perform(post("/api/v1/admin/users/{id}/wallet/lock", admin.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Self action\"}"))
                .andExpect(status().isForbidden());
    }

    private void transition(String action, String reason, String statusValue, boolean canWithdraw) throws Exception {
        mockMvc.perform(post("/api/v1/admin/users/{id}/wallet/{action}", target.getId(), action)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"" + reason + "\",\"internalNote\":\"CASE-27\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.walletStatus").value(statusValue))
                .andExpect(jsonPath("$.canWithdraw").value(canWithdraw));
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
