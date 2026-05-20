package com.example.horseracingtournamentsystem.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.auth.email.EmailSender;
import com.example.horseracingtournamentsystem.auth.entity.EmailVerificationToken;
import com.example.horseracingtournamentsystem.auth.repository.EmailVerificationTokenRepository;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthRegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private CapturingEmailSender emailSender;

    @BeforeEach
    void cleanDatabase() {
        emailSender.clear();
        emailVerificationTokenRepository.deleteAll();
        userRoleRepository.deleteAll();
        roleRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registerCreatesPendingUserWithSpectatorRole() throws Exception {
        roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Spec Tator","email":"spec@example.com","password":"Password123!"}
                                """))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("spec@example.com").orElseThrow();
        assertThat(user.getStatus()).isEqualTo(User.STATUS_PENDING_EMAIL_VERIFY);
        assertThat(user.isEmailVerified()).isFalse();
        assertThat(user.isPhoneVerified()).isFalse();
        assertThat(user.isAgeVerified()).isFalse();
        assertThat(user.isProfileCompleted()).isFalse();
        assertThat(userRoleRepository.findByUserIdAndStatus(user.getId(), UserRole.STATUS_ACTIVE))
                .hasSize(1);
    }

    @Test
    void registerStoresOptionalPhoneWhenProvided() throws Exception {
        roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Phone User","email":"phone@example.com","password":"Password123!","phone":"0909123456"}
                                """))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("phone@example.com").orElseThrow();
        assertThat(user.getPhone()).isEqualTo("0909123456");
        assertThat(user.isPhoneVerified()).isFalse();
    }

    @Test
    void registerNormalizesEmailAndSendsVerificationEmail() throws Exception {
        roleRepository.save(Role.of("SPECTATOR", "Spectator"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Spec Tator","email":"Spec@Example.COM","password":"Password123!"}
                                """))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("spec@example.com").orElseThrow();
        assertThat(user.getEmail()).isEqualTo("spec@example.com");
        assertThat(emailSender.verificationEmails())
                .containsExactly(new SentEmail("spec@example.com", emailSender.verificationEmails().get(0).rawToken()));

        String sentToken = emailSender.verificationEmails().get(0).rawToken();
        EmailVerificationToken savedToken = emailVerificationTokenRepository.findAll().get(0);
        assertThat(savedToken.getUser().getId()).isEqualTo(user.getId());
        assertThat(savedToken.getTokenHash()).isEqualTo(sha256(sentToken));
    }

    @Test
    void verifyEmailActivatesPendingUser() throws Exception {
        String rawToken = "verification-token";
        User user = userRepository.save(User.pending("Verify User", "verify@example.com", "hash"));
        emailVerificationTokenRepository.save(EmailVerificationToken.create(
                user,
                sha256(rawToken),
                LocalDateTime.now().plusHours(1)
        ));

        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + rawToken + "\"}"))
                .andExpect(status().isOk());

        User verifiedUser = userRepository.findByEmail("verify@example.com").orElseThrow();
        assertThat(verifiedUser.getStatus()).isEqualTo(User.STATUS_ACTIVE);
        assertThat(verifiedUser.isEmailVerified()).isTrue();
    }

    @Test
    void resendVerificationEmailIssuesNewTokenForPendingUser() throws Exception {
        String oldRawToken = "old-verification-token";
        User user = userRepository.save(User.pending("Pending User", "pending@example.com", "hash"));
        EmailVerificationToken oldToken = emailVerificationTokenRepository.save(EmailVerificationToken.create(
                user,
                sha256(oldRawToken),
                LocalDateTime.now().plusHours(1)
        ));

        mockMvc.perform(post("/api/auth/resend-verification-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"Pending@Example.COM\"}"))
                .andExpect(status().isOk());

        assertThat(emailSender.verificationEmails())
                .containsExactly(new SentEmail("pending@example.com", emailSender.verificationEmails().get(0).rawToken()));
        assertThat(emailVerificationTokenRepository.findById(oldToken.getId()).orElseThrow().getUsedAt())
                .isNotNull();
        assertThat(emailVerificationTokenRepository.findAll())
                .hasSize(2);
    }

    private String sha256(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    @TestConfiguration
    static class EmailTestConfig {

        @Bean
        @Primary
        CapturingEmailSender capturingEmailSender() {
            return new CapturingEmailSender();
        }
    }

    static class CapturingEmailSender implements EmailSender {

        private final List<SentEmail> verificationEmails = new ArrayList<>();
        private final List<SentEmail> passwordResetEmails = new ArrayList<>();

        @Override
        public void sendEmailVerification(String email, String rawToken) {
            verificationEmails.add(new SentEmail(email, rawToken));
        }

        @Override
        public void sendPasswordReset(String email, String rawToken) {
            passwordResetEmails.add(new SentEmail(email, rawToken));
        }

        List<SentEmail> verificationEmails() {
            return verificationEmails;
        }

        void clear() {
            verificationEmails.clear();
            passwordResetEmails.clear();
        }
    }

    record SentEmail(String email, String rawToken) {
    }
}
