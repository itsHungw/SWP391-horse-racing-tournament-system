package com.example.horseracingtournamentsystem.point;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.repository.PointSettingRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class AdminPointSettingsIntegrationTest {

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
    private PointSettingRepository pointSettingRepository;

    private String adminToken;
    private String spectatorToken;

    @BeforeEach
    void setUp() {
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();

        Role adminRole = roleRepository.save(Role.of("ADMIN", "Administrator"));
        Role spectatorRole = roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        User admin = userRepository.save(User.pending("Admin User", "admin@example.com", "hash"));
        admin.verifyEmail();
        User spectator = userRepository.save(User.pending("Spectator User", "spectator@example.com", "hash"));
        spectator.verifyEmail();

        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
        userRoleRepository.save(UserRole.active(spectator, spectatorRole, admin));

        adminToken = jwtService.generateToken(admin.getEmail(), Set.of("ADMIN"));
        spectatorToken = jwtService.generateToken(spectator.getEmail(), Set.of("SPECTATOR"));
    }

    @Test
    void adminCanFetchDefaultPointSettings() throws Exception {
        mockMvc.perform(get("/api/v1/admin/point-settings")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.FIRST_LOGIN_BONUS").value(0))
                .andExpect(jsonPath("$.BLOG_REWARD_POINTS").value(0))
                .andExpect(jsonPath("$.DAILY_BLOG_REWARD_LIMIT").value(0))
                .andExpect(jsonPath("$.PREDICTION_ENTRY_COST").value(0))
                .andExpect(jsonPath("$.PREDICTION_CORRECT_REWARD").value(0));
    }

    @Test
    void adminCanUpdatePointSettings() throws Exception {
        mockMvc.perform(put("/api/v1/admin/point-settings")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "FIRST_LOGIN_BONUS": 1,
                                  "BLOG_REWARD_POINTS": 2,
                                  "DAILY_BLOG_REWARD_LIMIT": 3,
                                  "PREDICTION_ENTRY_COST": 4,
                                  "PREDICTION_CORRECT_REWARD": 5
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.FIRST_LOGIN_BONUS").value(1))
                .andExpect(jsonPath("$.BLOG_REWARD_POINTS").value(2))
                .andExpect(jsonPath("$.DAILY_BLOG_REWARD_LIMIT").value(3))
                .andExpect(jsonPath("$.PREDICTION_ENTRY_COST").value(4))
                .andExpect(jsonPath("$.PREDICTION_CORRECT_REWARD").value(5));

        assertSettingValue(PointSettingKey.FIRST_LOGIN_BONUS, 1);
        assertSettingValue(PointSettingKey.BLOG_REWARD_POINTS, 2);
        assertSettingValue(PointSettingKey.DAILY_BLOG_REWARD_LIMIT, 3);
        assertSettingValue(PointSettingKey.PREDICTION_ENTRY_COST, 4);
        assertSettingValue(PointSettingKey.PREDICTION_CORRECT_REWARD, 5);
    }

    @Test
    void rejectsNegativePointSettings() throws Exception {
        mockMvc.perform(put("/api/v1/admin/point-settings")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "FIRST_LOGIN_BONUS": -1,
                                  "BLOG_REWARD_POINTS": 0,
                                  "DAILY_BLOG_REWARD_LIMIT": 0,
                                  "PREDICTION_ENTRY_COST": 0,
                                  "PREDICTION_CORRECT_REWARD": 0
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsNonAdminPointSettingsAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/point-settings")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + spectatorToken))
                .andExpect(status().isForbidden());
    }

    private void assertSettingValue(PointSettingKey key, int expectedValue) {
        org.assertj.core.api.Assertions.assertThat(pointSettingRepository.findById(key))
                .get()
                .extracting("value")
                .isEqualTo(expectedValue);
    }
}
