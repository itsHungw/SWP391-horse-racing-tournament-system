package com.example.horseracingtournamentsystem.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.auth.email.EmailSender;
import com.example.horseracingtournamentsystem.auth.dto.request.ResetPasswordRequest;
import com.example.horseracingtournamentsystem.auth.repository.AuthSessionRepository;
import com.example.horseracingtournamentsystem.auth.repository.EmailVerificationTokenRepository;
import com.example.horseracingtournamentsystem.auth.repository.PasswordResetTokenRepository;
import com.example.horseracingtournamentsystem.auth.service.AuthService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthPasswordResetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestEmailSender emailSender;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private AuthSessionRepository authSessionRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private AuthService authService;

    @BeforeEach
    void cleanDatabase() {
        emailSender.clear();
        authSessionRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        emailVerificationTokenRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void forgotPasswordReturnsGenericSuccessForUnknownEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"missing@example.com"}
                                """))
                .andExpect(status().isNoContent());

        assertThat(emailSender.passwordResetEmails()).isEmpty();
    }

    @Test
    void resetPasswordChangesPasswordAndRevokesRefreshSessions() throws Exception {
        registerAndVerifyUser("rider@example.com", "OldPassword123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rider@example.com","password":"OldPassword123"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(loginResult.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("refresh_token");

        User user = userRepository.findByEmail("rider@example.com").orElseThrow();
        assertThat(authSessionRepository.findByUserIdAndRevokedAtIsNull(user.getId())).hasSize(1);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rider@example.com"}
                                """))
                .andExpect(status().isNoContent());

        String otp = emailSender.passwordResetEmails().getFirst().rawToken();

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"rider@example.com",
                                  "token":"%s"
                                }
                                """.formatted(otp)))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"rider@example.com",
                                  "token":"%s",
                                  "newPassword":"NewPassword123",
                                  "confirmPassword":"NewPassword123"
                                }
                                """.formatted(otp)))
                .andExpect(status().isNoContent());

        assertThat(authSessionRepository.findByUserIdAndRevokedAtIsNull(user.getId())).isEmpty();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rider@example.com","password":"OldPassword123"}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rider@example.com","password":"NewPassword123"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void resetPasswordRollsBackConsumedTokenWhenPasswordUpdateFails() throws Exception {
        registerAndVerifyUser("rollback@example.com", "OldPassword123");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rollback@example.com"}
                                """))
                .andExpect(status().isNoContent());

        String otp = emailSender.passwordResetEmails().getFirst().rawToken();
        User user = userRepository.findByEmail("rollback@example.com").orElseThrow();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"rollback@example.com",
                                  "token":"%s",
                                  "newPassword":"TriggerRollback123",
                                  "confirmPassword":"TriggerRollback123"
                                }
                                """.formatted(otp)))
                .andExpect(status().isInternalServerError());

        assertThat(passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())).hasSize(1);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"rollback@example.com","password":"OldPassword123"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void resetPasswordLocksTokenAfterFiveWrongOtpAttempts() throws Exception {
        registerAndVerifyUser("lock@example.com", "OldPassword123");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lock@example.com"}
                                """))
                .andExpect(status().isNoContent());

        String correctOtp = emailSender.passwordResetEmails().getFirst().rawToken();

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email":"lock@example.com",
                                      "token":"000000",
                                      "newPassword":"NewPassword123",
                                      "confirmPassword":"NewPassword123"
                                    }
                                    """))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"lock@example.com",
                                  "token":"%s",
                                  "newPassword":"NewPassword123",
                                  "confirmPassword":"NewPassword123"
                                }
                                """.formatted(correctOtp)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void verifyResetCodeLocksTokenAfterFiveWrongOtpAttempts() throws Exception {
        registerAndVerifyUser("verify-lock@example.com", "OldPassword123");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"verify-lock@example.com"}
                                """))
                .andExpect(status().isNoContent());

        String correctOtp = emailSender.passwordResetEmails().getFirst().rawToken();

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {
                                      "email":"verify-lock@example.com",
                                      "token":"000000"
                                    }
                                    """))
                    .andExpect(status().isBadRequest());
        }

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"verify-lock@example.com",
                                  "token":"%s"
                                }
                                """.formatted(correctOtp)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void concurrentPasswordResetRequestsLeaveOnlyOneActiveToken() throws Exception {
        registerAndVerifyUser("issuance-race@example.com", "OldPassword123");

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<?> first = executor.submit(() -> {
                await(start);
                authService.requestPasswordReset("issuance-race@example.com");
            });
            Future<?> second = executor.submit(() -> {
                await(start);
                authService.requestPasswordReset("issuance-race@example.com");
            });

            start.countDown();
            first.get();
            second.get();
        } finally {
            executor.shutdownNow();
        }

        User user = userRepository.findByEmail("issuance-race@example.com").orElseThrow();
        assertThat(passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())).hasSize(1);
        assertThat(emailSender.passwordResetEmails()).hasSize(2);
    }

    @Test
    void concurrentResetSubmissionsConsumeOtpExactlyOnce() throws Exception {
        registerAndVerifyUser("consume-race@example.com", "OldPassword123");
        authService.requestPasswordReset("consume-race@example.com");
        String otp = emailSender.passwordResetEmails().getFirst().rawToken();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Boolean> first = executor.submit(() -> resetPasswordAfter(start, otp, "NewPassword123"));
            Future<Boolean> second = executor.submit(() -> resetPasswordAfter(start, otp, "OtherPassword123"));

            start.countDown();
            assertThat(List.of(first.get(), second.get())).containsExactlyInAnyOrder(true, false);
        } finally {
            executor.shutdownNow();
        }

        User user = userRepository.findByEmail("consume-race@example.com").orElseThrow();
        assertThat(passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())).isEmpty();
    }

    private boolean resetPasswordAfter(CountDownLatch start, String otp, String password) {
        await(start);
        try {
            authService.resetPassword(new ResetPasswordRequest(
                    "consume-race@example.com",
                    otp,
                    password,
                    password
            ));
            return true;
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private static void await(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
    }

    private void registerAndVerifyUser(String email, String password) throws Exception {
        roleRepository.findByName("SPECTATOR")
                .orElseGet(() -> roleRepository.save(Role.of("SPECTATOR", "Spectator")));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName":"Reset Rider",
                                  "email":"%s",
                                  "password":"%s",
                                  "phone":"0912345678"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isCreated());

        String verificationCode = emailSender.verificationEmails().getFirst().rawToken();

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s"}
                                """.formatted(verificationCode)))
                .andExpect(status().isOk());

        emailSender.clear();
    }

    @TestConfiguration
    static class TestEmailConfig {

        @Bean
        @Primary
        TestEmailSender emailSender() {
            return new TestEmailSender();
        }

        @Bean
        @Primary
        PasswordEncoder rollbackTestingPasswordEncoder() {
            PasswordEncoder delegate = new BCryptPasswordEncoder();
            return new PasswordEncoder() {
                @Override
                public String encode(CharSequence rawPassword) {
                    if ("TriggerRollback123".contentEquals(rawPassword)) {
                        throw new IllegalStateException("TEST_PASSWORD_ENCODING_FAILURE");
                    }
                    return delegate.encode(rawPassword);
                }

                @Override
                public boolean matches(CharSequence rawPassword, String encodedPassword) {
                    return delegate.matches(rawPassword, encodedPassword);
                }
            };
        }
    }

    static class TestEmailSender implements EmailSender {

        private final List<SentEmail> verificationEmails = new CopyOnWriteArrayList<>();
        private final List<SentEmail> passwordResetEmails = new CopyOnWriteArrayList<>();

        @Override
        public void sendEmailVerification(String email, String rawToken) {
            verificationEmails.add(new SentEmail(email, rawToken));
        }

        @Override
        public void sendPasswordReset(String email, String rawToken) {
            passwordResetEmails.add(new SentEmail(email, rawToken));
        }

        void clear() {
            verificationEmails.clear();
            passwordResetEmails.clear();
        }

        List<SentEmail> verificationEmails() {
            return verificationEmails;
        }

        List<SentEmail> passwordResetEmails() {
            return passwordResetEmails;
        }
    }

    record SentEmail(String email, String rawToken) {
    }
}
