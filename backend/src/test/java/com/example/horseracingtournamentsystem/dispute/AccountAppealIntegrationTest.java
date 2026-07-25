package com.example.horseracingtournamentsystem.dispute;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.testsupport.TestDatabaseCleaner;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserStatusHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
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
class AccountAppealIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtService jwtService;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired UserRoleRepository userRoleRepository;
    @Autowired UserStatusHistoryRepository historyRepository;
    @Autowired WalletRepository walletRepository;

    private User admin;
    private User target;
    private User other;
    private String adminToken;
    private String targetToken;

    @BeforeEach
    void setUp() {
        TestDatabaseCleaner.clean(jdbcTemplate);
        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        admin = activeUser("Appeal Admin", "appeal-admin@example.com");
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        User backupAdmin = activeUser("Backup Admin", "appeal-backup@example.com");
        userRoleRepository.save(UserRole.active(backupAdmin, adminRole, admin));

        target = activeUser("Appealing User", "appealing-user@example.com");
        userRoleRepository.save(UserRole.active(target, spectatorRole, admin));
        other = activeUser("Other User", "other-appeal@example.com");
        userRoleRepository.save(UserRole.active(other, spectatorRole, admin));

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
        targetToken = jwtService.generateToken(target.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void suspendedUserCreatesAppealForLatestDecision() throws Exception {
        enforce(target, "suspend", "Automated activity is under review", false);
        Long decisionId = latestDecisionId(target);

        mockMvc.perform(post("/api/v1/me/account-appeal")
                        .header(HttpHeaders.AUTHORIZATION, bearer(targetToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(appealBody("Please reconsider this activity.")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.decisionId").value(decisionId))
                .andExpect(jsonPath("$.decisionStatus").value("SUSPENDED"))
                .andExpect(jsonPath("$.appeal.status").value("OPEN"))
                .andExpect(jsonPath("$.appeal.referenceType").value("ACCOUNT_ENFORCEMENT"));

        mockMvc.perform(get("/api/v1/me/account-appeal")
                        .header(HttpHeaders.AUTHORIZATION, bearer(targetToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appeal.description").value("Please reconsider this activity."));
    }

    @Test
    void bannedUserCanCreateAppeal() throws Exception {
        enforce(target, "suspend", "Review started", false);
        enforce(target, "ban", "Confirmed platform policy violation", false);

        mockMvc.perform(post("/api/v1/me/account-appeal")
                        .header(HttpHeaders.AUTHORIZATION, bearer(targetToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(appealBody("I am requesting a final review.")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.decisionStatus").value("BANNED"));
    }

    @Test
    void duplicateAppealForSameDecisionReturnsConflict() throws Exception {
        enforce(target, "suspend", "Review started", false);
        submitAppeal(targetToken, "First appeal").andExpect(status().isCreated());
        submitAppeal(targetToken, "Duplicate appeal").andExpect(status().isConflict());
    }

    @Test
    void activeUserWithoutRestrictedDecisionCannotAppeal() throws Exception {
        submitAppeal(targetToken, "There is no restricted decision")
                .andExpect(status().isConflict());
    }

    @Test
    void suppliedDecisionIdCannotOverrideServerSelectedDecision() throws Exception {
        enforce(other, "suspend", "Other user review", false);
        Long otherDecisionId = latestDecisionId(other);
        enforce(target, "suspend", "Target user review", false);
        Long targetDecisionId = latestDecisionId(target);

        mockMvc.perform(post("/api/v1/me/account-appeal")
                        .header(HttpHeaders.AUTHORIZATION, bearer(targetToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "decisionId": %d,
                                  "description": "Use my actual current decision",
                                  "evidenceUrls": []
                                }
                                """.formatted(otherDecisionId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.decisionId").value(targetDecisionId));
    }

    @Test
    void resolvingAppealDoesNotChangeAccountOrWalletStatus() throws Exception {
        enforce(target, "suspend", "Financial and account review", true);
        String response = submitAppeal(targetToken, "Evidence attached separately")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number appealIdValue = com.jayway.jsonpath.JsonPath.read(response, "$.appeal.id");
        long appealId = appealIdValue.longValue();

        mockMvc.perform(put("/api/v1/admin/disputes/{id}/status", appealId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "RESOLVED",
                                  "resolutionNote": "Appeal reviewed"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        User reloaded = userRepository.findById(target.getId()).orElseThrow();
        Wallet wallet = walletRepository.findById(target.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, reloaded.getStatus());
        assertTrue(wallet.isLocked());
    }

    private org.springframework.test.web.servlet.ResultActions submitAppeal(String token, String description)
            throws Exception {
        return mockMvc.perform(post("/api/v1/me/account-appeal")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(appealBody(description)));
    }

    private void enforce(User user, String action, String reason, boolean lockWallet) throws Exception {
        String body = action.equals("suspend")
                ? "{\"reason\":\"" + reason + "\",\"lockWallet\":" + lockWallet + "}"
                : "{\"reason\":\"" + reason + "\"}";
        mockMvc.perform(post("/api/v1/admin/users/{id}/{action}", user.getId(), action)
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }

    private Long latestDecisionId(User user) {
        return historyRepository.findByUserIdOrderByChangedAtDescIdDesc(user.getId()).getFirst().getId();
    }

    private String appealBody(String description) {
        return "{\"description\":\"" + description + "\",\"evidenceUrls\":[]}";
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private User activeUser(String name, String email) {
        User user = userRepository.save(User.pending(name, email, "hash"));
        user.verifyEmail();
        userRepository.save(user);
        return user;
    }
}
