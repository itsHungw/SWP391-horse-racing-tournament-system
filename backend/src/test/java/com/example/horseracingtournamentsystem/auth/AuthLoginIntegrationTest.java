package com.example.horseracingtournamentsystem.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.auth.dto.request.RegisterRequest;
import com.example.horseracingtournamentsystem.auth.repository.AuthSessionRepository;
import com.example.horseracingtournamentsystem.auth.service.AuthService;
import com.example.horseracingtournamentsystem.point.entity.PointSetting;
import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.repository.PointSettingRepository;
import com.example.horseracingtournamentsystem.point.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.point.repository.UserPointAccountRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthLoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private AuthSessionRepository authSessionRepository;

    @Autowired
    private PointTransactionRepository pointTransactionRepository;

    @Autowired
    private UserPointAccountRepository userPointAccountRepository;

    @Autowired
    private PointSettingRepository pointSettingRepository;

    @Autowired
    private AuthService authService;

    @BeforeEach
    void setUp() {
        authSessionRepository.deleteAll();
        pointTransactionRepository.deleteAll();
        userPointAccountRepository.deleteAll();
        pointSettingRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void shouldLoginSuccessfullyAfterEmailVerified() throws Exception {
        // 1. Tạo role SPECTATOR để phục vụ đăng ký
        roleRepository.save(Role.of("SPECTATOR", "Spectator Role"));

        // 2. Đăng ký SPECTATOR
        RegisterRequest reg = new RegisterRequest("Anh B", "testlogin@example.com", "validPassword123", null);
        authService.register(reg);

        // 3. Kích hoạt Email thủ công từ database
        User user = userRepository.findByEmail("testlogin@example.com").orElseThrow();
        user.verifyEmail();
        userRepository.save(user);

        // 4. Tiến hành POST login
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"testlogin@example.com\",\"password\":\"validPassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value("testlogin@example.com"))
                .andExpect(jsonPath("$.fullName").value("Anh B"));

        org.assertj.core.api.Assertions.assertThat(authSessionRepository.findAll()).hasSize(1);
        org.assertj.core.api.Assertions.assertThat(authSessionRepository.findAll().get(0).getRefreshTokenHash())
                .doesNotContain("refresh_token");
    }

    @Test
    void firstSuccessfulLoginGrantsConfiguredFirstLoginBonus() throws Exception {
        setPointSetting(PointSettingKey.FIRST_LOGIN_BONUS, 25);
        User user = registerVerifiedSpectator("Bonus User", "bonus@example.com");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bonus@example.com\",\"password\":\"validPassword123\"}"))
                .andExpect(status().isOk());

        org.assertj.core.api.Assertions.assertThat(userPointAccountRepository.findById(user.getId()))
                .get()
                .extracting("pointBalance")
                .isEqualTo(25);
        org.assertj.core.api.Assertions.assertThat(pointTransactionRepository.findAll()).hasSize(1);
        org.assertj.core.api.Assertions.assertThat(pointTransactionRepository.findAll().get(0).getTransactionType().name())
                .isEqualTo("FIRST_LOGIN_BONUS");
        org.assertj.core.api.Assertions.assertThat(pointTransactionRepository.findAll().get(0).getAmount()).isEqualTo(25);
        org.assertj.core.api.Assertions.assertThat(pointTransactionRepository.findAll().get(0).getDescription())
                .contains("First login bonus");
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(user.getId()).orElseThrow().getLastLoginAt())
                .isNotNull();
    }

    @Test
    void secondSuccessfulLoginDoesNotGrantFirstLoginBonusAgain() throws Exception {
        setPointSetting(PointSettingKey.FIRST_LOGIN_BONUS, 25);
        User user = registerVerifiedSpectator("Repeat Bonus User", "repeat-bonus@example.com");

        login("repeat-bonus@example.com");
        login("repeat-bonus@example.com");

        org.assertj.core.api.Assertions.assertThat(userPointAccountRepository.findById(user.getId()))
                .get()
                .extracting("pointBalance")
                .isEqualTo(25);
        org.assertj.core.api.Assertions.assertThat(pointTransactionRepository.findAll()).hasSize(1);
    }

    @Test
    void zeroFirstLoginBonusDoesNotCreatePointRecords() throws Exception {
        setPointSetting(PointSettingKey.FIRST_LOGIN_BONUS, 0);
        User user = registerVerifiedSpectator("Zero Bonus User", "zero-bonus@example.com");

        login("zero-bonus@example.com");

        org.assertj.core.api.Assertions.assertThat(userPointAccountRepository.findById(user.getId())).isEmpty();
        org.assertj.core.api.Assertions.assertThat(pointTransactionRepository.findAll()).isEmpty();
        org.assertj.core.api.Assertions.assertThat(userRepository.findById(user.getId()).orElseThrow().getLastLoginAt())
                .isNotNull();
    }

    @Test
    void shouldRefreshAccessTokenAndRotateRefreshCookie() throws Exception {
        roleRepository.save(Role.of("SPECTATOR", "Spectator Role"));
        RegisterRequest reg = new RegisterRequest("Refresh User", "refresh@example.com", "validPassword123", null);
        authService.register(reg);
        User user = userRepository.findByEmail("refresh@example.com").orElseThrow();
        user.verifyEmail();
        userRepository.save(user);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"refresh@example.com\",\"password\":\"validPassword123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        Cookie refreshCookie = loginResult.getResponse().getCookie("refresh_token");

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        org.assertj.core.api.Assertions.assertThat(authSessionRepository.findAll()).hasSize(2);
        org.assertj.core.api.Assertions.assertThat(authSessionRepository.findAll())
                .anyMatch(session -> session.getRevokedAt() != null && session.getReplacedBySession() != null);
    }

    @Test
    void shouldLogoutAndClearRefreshCookie() throws Exception {
        roleRepository.save(Role.of("SPECTATOR", "Spectator Role"));
        RegisterRequest reg = new RegisterRequest("Logout User", "logout@example.com", "validPassword123", null);
        authService.register(reg);
        User user = userRepository.findByEmail("logout@example.com").orElseThrow();
        user.verifyEmail();
        userRepository.save(user);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"logout@example.com\",\"password\":\"validPassword123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        Cookie refreshCookie = loginResult.getResponse().getCookie("refresh_token");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refresh_token", 0));

        org.assertj.core.api.Assertions.assertThat(authSessionRepository.findAll())
                .allMatch(session -> session.getRevokedAt() != null);
    }

    @Test
    void shouldRejectLoginWithInvalidCredentials() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"wrong@example.com\",\"password\":\"wrongpassword\"}"))
                .andExpect(status().isBadRequest());
    }

    private User registerVerifiedSpectator(String fullName, String email) {
        roleRepository.save(Role.of("SPECTATOR", "Spectator Role"));
        authService.register(new RegisterRequest(fullName, email, "validPassword123", null));
        User user = userRepository.findByEmail(email).orElseThrow();
        user.verifyEmail();
        return userRepository.save(user);
    }

    private void login(String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "validPassword123"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk());
    }

    private void setPointSetting(PointSettingKey key, int value) {
        PointSetting setting = pointSettingRepository.findById(key)
                .orElseGet(() -> PointSetting.defaultSetting(key, key.name()));
        setting.updateValue(value, null);
        pointSettingRepository.save(setting);
    }

}
