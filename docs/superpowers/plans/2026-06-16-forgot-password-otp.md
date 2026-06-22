# Forgot Password OTP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a secure forgot-password flow where a user requests a 6 digit email OTP and then resets their password with `email + OTP + new password`.

**Architecture:** Reuse the existing auth stack instead of adding Redis or a new token system. The backend stores hashed OTPs in `password_reset_tokens`, tracks failed attempts on the token row, locks after 5 wrong attempts, and revokes active refresh sessions on success. The frontend adds a public `/forgot-password` page plus a login link, using the existing auth UI style.

**Tech Stack:** Spring Boot 4, Spring Security, Spring Data JPA, Flyway SQL Server migrations, JavaMail-backed `EmailSender`, React, React Router, Vitest, Testing Library.

---

## File Map

Backend files:

- Create: `backend/src/main/resources/db/migration/V2__password_reset_attempts.sql`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/ForgotPasswordRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/ResetPasswordRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/entity/PasswordResetToken.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/repository/PasswordResetTokenRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/email/SmtpEmailSender.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/email/LoggingEmailSender.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AppSecurityProperties.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/RateLimitingFilter.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/email/SmtpEmailSenderTest.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthPasswordResetIntegrationTest.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/RateLimitingFilterTest.java`

Frontend files:

- Create: `frontend/src/pages/auth/ForgotPasswordPage.tsx`
- Create: `frontend/src/pages/auth/ForgotPasswordPage.test.tsx`
- Modify: `frontend/src/api/authApi.ts`
- Modify: `frontend/src/api/httpClient.ts`
- Modify: `frontend/src/pages/auth/AuthPage.tsx`
- Modify: `frontend/src/pages/auth/AuthPage.test.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`

---

### Task 1: Persist OTP Attempts And Lock State

**Files:**
- Create: `backend/src/main/resources/db/migration/V2__password_reset_attempts.sql`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/entity/PasswordResetToken.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/repository/PasswordResetTokenRepository.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/entity/AuthEntityMappingTest.java`

- [ ] **Step 1: Write the failing entity behavior test**

Add this test to `AuthEntityMappingTest`:

```java
@Test
void passwordResetTokenTracksFailedAttemptsAndLockState() {
    User user = User.pending("Reset User", "reset@example.com", "hash");
    PasswordResetToken token = PasswordResetToken.create(user, "reset", LocalDateTime.now().plusMinutes(10));

    assertThat(token.getFailedAttempts()).isZero();
    assertThat(token.isLocked()).isFalse();

    token.incrementFailedAttempts();
    token.incrementFailedAttempts();
    token.incrementFailedAttempts();
    token.incrementFailedAttempts();
    token.incrementFailedAttempts();
    token.lockNow();

    assertThat(token.getFailedAttempts()).isEqualTo(5);
    assertThat(token.getLockedAt()).isNotNull();
    assertThat(token.isLocked()).isTrue();
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=AuthEntityMappingTest" test
```

Expected: compile failure because `getFailedAttempts`, `incrementFailedAttempts`, `lockNow`, or `isLocked` does not exist.

- [ ] **Step 3: Add Flyway migration**

Create `backend/src/main/resources/db/migration/V2__password_reset_attempts.sql`:

```sql
IF COL_LENGTH(N'dbo.password_reset_tokens', N'failed_attempts') IS NULL
BEGIN
    ALTER TABLE dbo.password_reset_tokens
        ADD failed_attempts int NOT NULL
            CONSTRAINT df_password_reset_tokens_failed_attempts DEFAULT 0 WITH VALUES;
END;

IF COL_LENGTH(N'dbo.password_reset_tokens', N'locked_at') IS NULL
BEGIN
    ALTER TABLE dbo.password_reset_tokens
        ADD locked_at datetime2 NULL;
END;
```

- [ ] **Step 4: Implement token entity fields and methods**

Update `PasswordResetToken` with:

```java
@Column(name = "failed_attempts", nullable = false)
private int failedAttempts;

@Column(name = "locked_at")
private LocalDateTime lockedAt;
```

Set default values in `create(...)`:

```java
token.failedAttempts = 0;
token.lockedAt = null;
```

Add methods:

```java
public void incrementFailedAttempts() {
    this.failedAttempts++;
}

public void lockNow() {
    this.lockedAt = LocalDateTime.now();
}

public boolean isLocked() {
    return lockedAt != null;
}
```

- [ ] **Step 5: Add repository lookups**

Update `PasswordResetTokenRepository`:

```java
package com.example.horseracingtournamentsystem.auth.repository;

import com.example.horseracingtournamentsystem.auth.entity.PasswordResetToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);

    List<PasswordResetToken> findByUserIdAndUsedAtIsNull(Long userId);

    Optional<PasswordResetToken> findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(Long userId);

    Optional<PasswordResetToken> findByUserIdAndTokenHashAndUsedAtIsNull(Long userId, String tokenHash);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=AuthEntityMappingTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/main/resources/db/migration/V2__password_reset_attempts.sql backend/src/main/java/com/example/horseracingtournamentsystem/auth/entity/PasswordResetToken.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/repository/PasswordResetTokenRepository.java backend/src/test/java/com/example/horseracingtournamentsystem/auth/entity/AuthEntityMappingTest.java
git commit -m "feat: track password reset otp attempts"
```

---

### Task 2: Implement Password Reset Token Consumption

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenServiceTest.java`

- [ ] **Step 1: Create the failing token service unit test**

Create `backend/src/test/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenServiceTest.java`:

```java
package com.example.horseracingtournamentsystem.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.auth.entity.PasswordResetToken;
import com.example.horseracingtournamentsystem.auth.repository.EmailVerificationTokenRepository;
import com.example.horseracingtournamentsystem.auth.repository.PasswordResetTokenRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OneTimeTokenServiceTest {

    @Mock
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private TokenHashService tokenHashService;

    private OneTimeTokenService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new OneTimeTokenService(
                emailVerificationTokenRepository,
                passwordResetTokenRepository,
                tokenHashService,
                10,
                10
        );
        user = User.pending("Reset User", "reset@example.com", "hash");
        org.springframework.test.util.ReflectionTestUtils.setField(user, "id", 42L);
        user.verifyEmail();
    }

    @Test
    void createPasswordResetTokenInvalidatesPreviousUnusedTokensAndReturnsSixDigitOtp() {
        PasswordResetToken oldToken = PasswordResetToken.create(user, "old-hash", LocalDateTime.now().plusMinutes(10));
        when(passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(42L)).thenReturn(List.of(oldToken));
        when(tokenHashService.sha256(any())).thenReturn("new-hash");

        String rawOtp = service.createPasswordResetToken(user);

        assertThat(rawOtp).matches("\\d{6}");
        assertThat(oldToken.getUsedAt()).isNotNull();
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void consumePasswordResetTokenLocksLatestTokenAfterFiveWrongAttempts() {
        PasswordResetToken latestToken = PasswordResetToken.create(user, "correct-hash", LocalDateTime.now().plusMinutes(10));
        latestToken.incrementFailedAttempts();
        latestToken.incrementFailedAttempts();
        latestToken.incrementFailedAttempts();
        latestToken.incrementFailedAttempts();

        when(tokenHashService.sha256("000000")).thenReturn("wrong-hash");
        when(passwordResetTokenRepository.findByUserIdAndTokenHashAndUsedAtIsNull(42L, "wrong-hash"))
                .thenReturn(Optional.empty());
        when(passwordResetTokenRepository.findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(42L))
                .thenReturn(Optional.of(latestToken));

        assertThatThrownBy(() -> service.consumePasswordResetToken(user, "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("INVALID_PASSWORD_RESET_TOKEN");

        assertThat(latestToken.getFailedAttempts()).isEqualTo(5);
        assertThat(latestToken.isLocked()).isTrue();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=OneTimeTokenServiceTest" test
```

Expected: compile failure because `consumePasswordResetToken(User, String)` does not exist and `createPasswordResetToken` still returns a long random token.

- [ ] **Step 3: Implement OTP creation and consumption**

Modify `OneTimeTokenService`:

```java
@Transactional
public String createPasswordResetToken(User user) {
    passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())
            .forEach(PasswordResetToken::markUsed);
    String rawToken = randomOtp();
    passwordResetTokenRepository.save(PasswordResetToken.create(
            user,
            tokenHashService.sha256(rawToken),
            LocalDateTime.now().plusMinutes(passwordResetTokenTtlMinutes)
    ));
    return rawToken;
}

@Transactional
public PasswordResetToken consumePasswordResetToken(User user, String rawToken) {
    String tokenHash = tokenHashService.sha256(rawToken);
    Optional<PasswordResetToken> matchingToken =
            passwordResetTokenRepository.findByUserIdAndTokenHashAndUsedAtIsNull(user.getId(), tokenHash);
    if (matchingToken.isEmpty()) {
        registerFailedPasswordResetAttempt(user);
        throw new IllegalArgumentException("INVALID_PASSWORD_RESET_TOKEN");
    }

    PasswordResetToken token = matchingToken.get();
    if (token.isExpired(LocalDateTime.now())) {
        throw new IllegalArgumentException("EXPIRED_PASSWORD_RESET_TOKEN");
    }
    if (token.isLocked()) {
        throw new IllegalArgumentException("LOCKED_PASSWORD_RESET_TOKEN");
    }
    token.markUsed();
    return token;
}

private void registerFailedPasswordResetAttempt(User user) {
    passwordResetTokenRepository.findFirstByUserIdAndUsedAtIsNullOrderByCreatedAtDesc(user.getId())
            .filter(token -> !token.isExpired(LocalDateTime.now()))
            .filter(token -> !token.isLocked())
            .ifPresent(token -> {
                token.incrementFailedAttempts();
                if (token.getFailedAttempts() >= 5) {
                    token.lockNow();
                }
            });
}
```

Leave `randomToken()` in place for refresh tokens in `AuthService`; `OneTimeTokenService` no longer uses it for password reset.

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=OneTimeTokenServiceTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenService.java backend/src/test/java/com/example/horseracingtournamentsystem/auth/service/OneTimeTokenServiceTest.java
git commit -m "feat: consume password reset otp securely"
```

---

### Task 3: Send Password Reset Emails As OTP Codes

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/email/SmtpEmailSender.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/email/LoggingEmailSender.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/email/SmtpEmailSenderTest.java`

- [ ] **Step 1: Update the failing SMTP email test**

In `SmtpEmailSenderTest`, replace `sendPasswordResetSendsBrandedHtmlEmailWithFrontendResetLink` with:

```java
@Test
void sendPasswordResetSendsBrandedHtmlEmailWithSixDigitCode() throws Exception {
    JavaMailSender mailSender = mock(JavaMailSender.class);
    MimeMessage message = configuredMimeMessage(mailSender);
    SmtpEmailSender sender = new SmtpEmailSender(
            mailSender,
            "no-reply@equinepro.local",
            "https://equinepro.example"
    );

    sender.sendPasswordReset("owner@example.com", "928174");

    verify(mailSender).send(message);

    String body = extractBody(message);
    assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("owner@example.com");
    assertThat(message.getSubject()).contains("Reset");
    assertThat(body)
            .contains("EquinePro Elite")
            .contains("Your verification code")
            .contains("928174")
            .contains("Enter this code in the verification screen")
            .doesNotContain("/reset-password?token=")
            .doesNotContain("Reset Password");
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=SmtpEmailSenderTest" test
```

Expected: the updated password reset email test fails because `sendPasswordReset` still renders a frontend reset link.

- [ ] **Step 3: Reuse the existing code email renderer for password reset**

Modify `SmtpEmailSender.sendPasswordReset`:

```java
@Override
public void sendPasswordReset(String email, String rawToken) {
    sendVerificationCodeEmail(
            email,
            "Reset your EquinePro Elite password",
            rawToken
    );
}
```

Remove `buildFrontendUrl(...)`, `buildBrandedEmail(...)`, `buildPlainText(...)`, `buildHtmlEmail(...)`, `frontendBaseUrl`, and the now-unused `UriComponentsBuilder` / `UriUtils` imports only after `sendPasswordReset` no longer calls them.

- [ ] **Step 4: Update logging sender wording**

Modify `LoggingEmailSender.sendPasswordReset` so local/dev logs call the value a reset code:

```java
@Override
public void sendPasswordReset(String email, String rawToken) {
    log.info("Password reset code for {} is {}", email, rawToken);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=SmtpEmailSenderTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/auth/email/SmtpEmailSender.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/email/LoggingEmailSender.java backend/src/test/java/com/example/horseracingtournamentsystem/auth/email/SmtpEmailSenderTest.java
git commit -m "feat: send password reset otp email"
```

---

### Task 4: Add Backend Forgot/Reset Password API

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/ForgotPasswordRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/ResetPasswordRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthPasswordResetIntegrationTest.java`

- [ ] **Step 1: Write failing integration tests**

Create `AuthPasswordResetIntegrationTest.java` with this package, imports, class annotations, and in-memory `EmailSender` test configuration:

```java
package com.example.horseracingtournamentsystem.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.horseracingtournamentsystem.auth.email.EmailSender;
import com.example.horseracingtournamentsystem.auth.repository.AuthSessionRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthPasswordResetIntegrationTest {

@TestConfiguration
static class TestEmailConfig {
    @Bean
    TestEmailSender emailSender() {
        return new TestEmailSender();
    }
}

static class TestEmailSender implements EmailSender {
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

record SentEmail(String email, String token) {
}
```

Add these fields and helper methods to the same test class:

```java
@Autowired
private MockMvc mockMvc;

@Autowired
private TestEmailSender emailSender;

@Autowired
private UserRepository userRepository;

@Autowired
private AuthSessionRepository authSessionRepository;

@AfterEach
void tearDown() {
    emailSender.clear();
}

private void registerAndVerifyUser(String email, String password) throws Exception {
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

    String verificationCode = emailSender.verificationEmails().getFirst().token();

    mockMvc.perform(post("/api/v1/auth/verify-email")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {
                              "email":"%s",
                              "token":"%s"
                            }
                            """.formatted(email, verificationCode)))
            .andExpect(status().isOk());

    emailSender.clear();
}
```

Add tests:

```java
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

    mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email":"rider@example.com"}
                            """))
            .andExpect(status().isNoContent());

    String otp = emailSender.passwordResetEmails().getFirst().token();

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

    User user = userRepository.findByEmail("rider@example.com").orElseThrow();
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
void resetPasswordLocksTokenAfterFiveWrongOtpAttempts() throws Exception {
    registerAndVerifyUser("lock@example.com", "OldPassword123");
    mockMvc.perform(post("/api/v1/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"email":"lock@example.com"}
                            """))
            .andExpect(status().isNoContent());

    String correctOtp = emailSender.passwordResetEmails().getFirst().token();

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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=AuthPasswordResetIntegrationTest" test
```

Expected: 404 or compile failure because endpoints and DTOs do not exist.

- [ ] **Step 3: Add request DTOs**

Create `ForgotPasswordRequest.java`:

```java
package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForgotPasswordRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email
) {
}
```

Create `ResetPasswordRequest.java`:

```java
package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank
        @Email
        @Size(max = 255)
        String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "Reset code must be 6 digits")
        String token,

        @NotBlank
        @Size(min = 8)
        String newPassword,

        @NotBlank
        @Size(min = 8)
        String confirmPassword
) {
}
```

- [ ] **Step 4: Add controller endpoints**

Modify `AuthController` imports and endpoints:

```java
import com.example.horseracingtournamentsystem.auth.dto.request.ForgotPasswordRequest;
import com.example.horseracingtournamentsystem.auth.dto.request.ResetPasswordRequest;
```

Add below `verifyEmail(...)`:

```java
@PostMapping("/forgot-password")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.requestPasswordReset(request.email());
}

@PostMapping("/reset-password")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(request);
}
```

- [ ] **Step 5: Add service methods**

Modify `AuthService` imports:

```java
import com.example.horseracingtournamentsystem.auth.dto.request.ResetPasswordRequest;
```

Add methods:

```java
@Transactional
public void requestPasswordReset(String rawEmail) {
    String email = normalizeEmail(rawEmail);
    userRepository.findByEmail(email)
            .filter(user -> User.STATUS_ACTIVE.equals(user.getStatus()))
            .ifPresent(user -> {
                String rawToken = oneTimeTokenService.createPasswordResetToken(user);
                emailSender.sendPasswordReset(user.getEmail(), rawToken);
            });
}

@Transactional
public void resetPassword(ResetPasswordRequest request) {
    String email = normalizeEmail(request.email());
    if (!request.newPassword().equals(request.confirmPassword())) {
        throw new IllegalArgumentException("PASSWORD_CONFIRMATION_MISMATCH");
    }

    User user = userRepository.findByEmail(email)
            .filter(candidate -> User.STATUS_ACTIVE.equals(candidate.getStatus()))
            .orElseThrow(() -> new IllegalArgumentException("INVALID_PASSWORD_RESET_TOKEN"));

    oneTimeTokenService.consumePasswordResetToken(user, request.token());
    user.changePassword(passwordEncoder.encode(request.newPassword()));
    authSessionRepository.findByUserIdAndRevokedAtIsNull(user.getId())
            .forEach(AuthSession::revokeNow);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=AuthPasswordResetIntegrationTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/ForgotPasswordRequest.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/dto/request/ResetPasswordRequest.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/controller/AuthController.java backend/src/main/java/com/example/horseracingtournamentsystem/auth/service/AuthService.java backend/src/test/java/com/example/horseracingtournamentsystem/auth/AuthPasswordResetIntegrationTest.java
git commit -m "feat: add forgot password otp endpoints"
```

---

### Task 5: Add Rate Limits And TTL Configuration

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/AppSecurityProperties.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/security/RateLimitingFilter.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/security/RateLimitingFilterTest.java`

- [ ] **Step 1: Write failing filter tests**

Add tests to `RateLimitingFilterTest`:

```java
@Test
void limitsForgotPasswordRequestsWithDedicatedLimit() throws Exception {
    AppSecurityProperties properties = new AppSecurityProperties();
    properties.getRateLimit().setEnabled(true);
    properties.getRateLimit().setForgotPasswordLimit(1);
    properties.getRateLimit().setForgotPasswordWindowSeconds(900);
    RateLimitingFilter filter = new RateLimitingFilter(properties, objectMapper, Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC));

    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/forgot-password");
    request.setRemoteAddr("127.0.0.1");
    MockHttpServletResponse firstResponse = new MockHttpServletResponse();
    MockFilterChain firstChain = new MockFilterChain();
    filter.doFilter(request, firstResponse, firstChain);
    assertThat(firstResponse.getStatus()).isEqualTo(200);

    MockHttpServletResponse secondResponse = new MockHttpServletResponse();
    filter.doFilter(request, secondResponse, new MockFilterChain());
    assertThat(secondResponse.getStatus()).isEqualTo(429);
}

@Test
void limitsResetPasswordRequestsWithDedicatedLimit() throws Exception {
    AppSecurityProperties properties = new AppSecurityProperties();
    properties.getRateLimit().setEnabled(true);
    properties.getRateLimit().setResetPasswordLimit(1);
    properties.getRateLimit().setResetPasswordWindowSeconds(900);
    RateLimitingFilter filter = new RateLimitingFilter(properties, objectMapper, Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC));

    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/reset-password");
    request.setRemoteAddr("127.0.0.1");
    filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

    MockHttpServletResponse secondResponse = new MockHttpServletResponse();
    filter.doFilter(request, secondResponse, new MockFilterChain());
    assertThat(secondResponse.getStatus()).isEqualTo(429);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=RateLimitingFilterTest" test
```

Expected: compile failure because dedicated properties do not exist.

- [ ] **Step 3: Add rate-limit properties**

Modify `AppSecurityProperties.RateLimit`:

```java
private int forgotPasswordLimit = 3;
private long forgotPasswordWindowSeconds = 900;
private int resetPasswordLimit = 10;
private long resetPasswordWindowSeconds = 900;
```

- [ ] **Step 4: Update filter rule windows**

Change `LimitRule` to carry a window:

```java
private record LimitRule(String name, int limit, long windowSeconds) {
}
```

Change the refresh call in `doFilterInternal`:

```java
Bucket bucket = buckets.compute(key, (ignored, existing) -> refresh(existing, rule.windowSeconds));
```

Replace `refresh(...)`:

```java
private Bucket refresh(Bucket existing, long ruleWindowSeconds) {
    Instant now = clock.instant();
    long windowSeconds = Math.max(1, ruleWindowSeconds);
    if (existing == null || existing.windowStartedAt.plusSeconds(windowSeconds).isBefore(now)) {
        return new Bucket(now, 0);
    }
    return existing;
}
```

Update existing rules and add new ones:

```java
if ("POST".equals(method) && path.equals("/api/v1/auth/login")) {
    return new LimitRule("login", limits.getLoginLimit(), limits.getWindowSeconds());
}
if ("POST".equals(method) && path.equals("/api/v1/auth/forgot-password")) {
    return new LimitRule("forgot-password", limits.getForgotPasswordLimit(), limits.getForgotPasswordWindowSeconds());
}
if ("POST".equals(method) && path.equals("/api/v1/auth/reset-password")) {
    return new LimitRule("reset-password", limits.getResetPasswordLimit(), limits.getResetPasswordWindowSeconds());
}
if ("POST".equals(method) && path.equals("/api/v1/files/upload")) {
    return new LimitRule("upload", limits.getUploadLimit(), limits.getWindowSeconds());
}
if ("POST".equals(method) && path.equals("/api/v1/predictions")) {
    return new LimitRule("prediction-submit", limits.getPredictionSubmitLimit(), limits.getWindowSeconds());
}
```

- [ ] **Step 5: Update configuration**

In both `backend/src/main/resources/application.yml` and `backend/src/test/resources/application.yml`, set password reset TTL to 10:

```yaml
app:
  auth:
    password-reset-token-ttl-minutes: 10
```

In main `application.yml`, add:

```yaml
app:
  security:
    rate-limit:
      forgot-password-limit: ${APP_RATE_LIMIT_FORGOT_PASSWORD:3}
      forgot-password-window-seconds: ${APP_RATE_LIMIT_FORGOT_PASSWORD_WINDOW_SECONDS:900}
      reset-password-limit: ${APP_RATE_LIMIT_RESET_PASSWORD:10}
      reset-password-window-seconds: ${APP_RATE_LIMIT_RESET_PASSWORD_WINDOW_SECONDS:900}
```

In test `application.yml`, add high limits:

```yaml
app:
  security:
    rate-limit:
      forgot-password-limit: 1000
      forgot-password-window-seconds: 900
      reset-password-limit: 1000
      reset-password-window-seconds: 900
```

- [ ] **Step 6: Run tests**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=RateLimitingFilterTest,AuthPasswordResetIntegrationTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 7: Commit**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/security/AppSecurityProperties.java backend/src/main/java/com/example/horseracingtournamentsystem/security/RateLimitingFilter.java backend/src/main/resources/application.yml backend/src/test/resources/application.yml backend/src/test/java/com/example/horseracingtournamentsystem/security/RateLimitingFilterTest.java
git commit -m "feat: rate limit password reset flow"
```

---

### Task 6: Add Frontend API And Forgot Password Page

**Files:**
- Create: `frontend/src/pages/auth/ForgotPasswordPage.tsx`
- Create: `frontend/src/pages/auth/ForgotPasswordPage.test.tsx`
- Modify: `frontend/src/api/authApi.ts`
- Modify: `frontend/src/api/httpClient.ts`
- Modify: `frontend/src/routes/AppRouter.tsx`

- [ ] **Step 1: Write failing frontend page tests**

Create `frontend/src/pages/auth/ForgotPasswordPage.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forgotPassword, resetPassword } from "../../api/authApi";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("../../api/authApi", () => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a password reset code for a valid email", async () => {
    vi.mocked(forgotPassword).mockResolvedValue();
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "rider@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith("rider@example.com");
    });
    expect(await screen.findByLabelText(/reset code/i)).toBeInTheDocument();
    expect(screen.getByText(/if this email exists/i)).toBeInTheDocument();
  });

  it("resets password with email otp and matching passwords", async () => {
    vi.mocked(forgotPassword).mockResolvedValue();
    vi.mocked(resetPassword).mockResolvedValue();
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<h1>Login page</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "rider@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset code/i }));
    expect(await screen.findByLabelText(/reset code/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/reset code/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: "NewPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "NewPassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith({
        email: "rider@example.com",
        token: "123456",
        newPassword: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
    });
    expect(await screen.findByText(/password changed successfully/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute("href", "/login");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd frontend
npm test -- --run src/pages/auth/ForgotPasswordPage.test.tsx
```

Expected: module not found for `ForgotPasswordPage` or missing API exports.

- [ ] **Step 3: Add auth API methods**

Modify `frontend/src/api/authApi.ts`:

```ts
export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
};

export async function forgotPassword(email: string): Promise<void> {
  await httpClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(data: ResetPasswordPayload): Promise<void> {
  await httpClient.post("/auth/reset-password", data);
}
```

- [ ] **Step 4: Update auth refresh skip list**

Modify `frontend/src/api/httpClient.ts` in `shouldSkipRefresh`:

```ts
url?.includes("/auth/forgot-password") ||
url?.includes("/auth/reset-password") ||
```

Place those lines alongside the other public auth endpoints.

- [ ] **Step 5: Create the page**

Create `ForgotPasswordPage.tsx`:

```tsx
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword, resetPassword } from "../../api/authApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { validateEmail } from "../../utils/validation";

type Step = "email" | "reset" | "success";

export function ForgotPasswordPage() {
  useDocumentTitle("Forgot Password");

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmitReset = useMemo(
    () => token.length === 6 && newPassword.length >= 8 && confirmPassword.length >= 8,
    [confirmPassword.length, newPassword.length, token.length],
  );

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      setMessage("");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await forgotPassword(email.trim());
      setMessage("If this email exists, we sent a reset code.");
      setStep("reset");
    } catch {
      setError("Could not request a reset code. Please try again.");
      setMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\\d{6}$/.test(token)) {
      setError("Enter the 6 digit reset code from your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await resetPassword({
        email: email.trim(),
        token,
        newPassword,
        confirmPassword,
      });
      setStep("success");
      setMessage("Password changed successfully. You can now log in.");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("The reset code is invalid, expired, or locked. Request a new code and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#007a68]">Account recovery</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          We will send a short-lived 6 digit code to your account email.
        </p>

        {message && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-800" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800" role="alert">
            {error}
          </div>
        )}

        {step === "email" && (
          <form className="mt-6 space-y-4" onSubmit={handleRequestCode}>
            <label className="block text-sm font-black text-slate-800" htmlFor="forgot-email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
              id="forgot-email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
            <button className="w-full rounded-lg bg-[#007a68] px-4 py-3 text-sm font-black text-white disabled:bg-slate-300" disabled={submitting} type="submit">
              {submitting ? "Sending..." : "Send reset code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form className="mt-6 space-y-4" onSubmit={handleResetPassword}>
            <p className="break-all rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">{email}</p>
            <label className="block text-sm font-black text-slate-800" htmlFor="reset-code">
              Reset code
            </label>
            <input
              autoComplete="one-time-code"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold tracking-[0.35em] focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
              id="reset-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setToken(event.target.value.replace(/\\D/g, "").slice(0, 6))}
              value={token}
            />
            <label className="block text-sm font-black text-slate-800" htmlFor="new-password">
              New password
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
              id="new-password"
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              value={newPassword}
            />
            <label className="block text-sm font-black text-slate-800" htmlFor="confirm-new-password">
              Confirm new password
            </label>
            <input
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-[#007a68] focus:outline-none focus:ring-2 focus:ring-[#007a68]/20"
              id="confirm-new-password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
            <button className="w-full rounded-lg bg-[#007a68] px-4 py-3 text-sm font-black text-white disabled:bg-slate-300" disabled={submitting || !canSubmitReset} type="submit">
              {submitting ? "Resetting..." : "Reset password"}
            </button>
            <button className="w-full text-sm font-black text-[#007a68]" onClick={() => setStep("email")} type="button">
              Use another email
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="mt-6">
            <Link className="block rounded-lg bg-[#007a68] px-4 py-3 text-center text-sm font-black text-white" to="/login">
              Go to login
            </Link>
          </div>
        )}

        <Link className="mt-5 block text-center text-sm font-bold text-slate-600" to="/login">
          Back to login
        </Link>
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Register route**

Modify `frontend/src/routes/AppRouter.tsx`:

```tsx
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
```

Add route near login/register:

```tsx
<Route path="forgot-password" element={<ForgotPasswordPage />} />
```

- [ ] **Step 7: Run page tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/auth/ForgotPasswordPage.test.tsx
```

Expected: `2 tests` pass.

- [ ] **Step 8: Commit**

```powershell
git add frontend/src/api/authApi.ts frontend/src/api/httpClient.ts frontend/src/pages/auth/ForgotPasswordPage.tsx frontend/src/pages/auth/ForgotPasswordPage.test.tsx frontend/src/routes/AppRouter.tsx
git commit -m "feat: add forgot password page"
```

---

### Task 7: Link Login Page To Forgot Password

**Files:**
- Modify: `frontend/src/pages/auth/AuthPage.tsx`
- Modify: `frontend/src/pages/auth/AuthPage.test.tsx`

- [ ] **Step 1: Write failing login link test**

Add this test to `AuthPage.test.tsx`:

```tsx
it("shows a forgot password link on the login form", () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

  expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute("href", "/forgot-password");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd frontend
npm test -- --run src/pages/auth/AuthPage.test.tsx
```

Expected: failing assertion because the link is not rendered yet.

- [ ] **Step 3: Add link to login form**

In `AuthPage.tsx`, add a `Link` import if not already present:

```tsx
import { Link, useNavigate } from "react-router-dom";
```

Near the login password field or submit button, render:

```tsx
{isLogin && (
  <div className="flex justify-end">
    <Link className="text-sm font-black text-[#007a68] hover:text-[#006f5f]" to="/forgot-password">
      Forgot password?
    </Link>
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
cd frontend
npm test -- --run src/pages/auth/AuthPage.test.tsx
```

Expected: `BUILD SUCCESS` from Vitest for this file.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/pages/auth/AuthPage.tsx frontend/src/pages/auth/AuthPage.test.tsx
git commit -m "feat: link login to password recovery"
```

---

### Task 8: Full Verification

**Files:**
- Verify all touched backend/frontend files.

- [ ] **Step 1: Run focused backend tests**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd "-Dtest=AuthPasswordResetIntegrationTest,OneTimeTokenServiceTest,AuthEntityMappingTest,RateLimitingFilterTest,SmtpEmailSenderTest" test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 2: Run full backend tests**

Run:

```powershell
cd backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.10'
.\mvnw.cmd test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 3: Run focused frontend tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/auth/ForgotPasswordPage.test.tsx src/pages/auth/AuthPage.test.tsx src/api/httpClient.test.ts
```

Expected: all selected test files pass.

- [ ] **Step 4: Run frontend build**

Run:

```powershell
cd frontend
npm run build
```

Expected: build succeeds. If build fails with unrelated pre-existing TypeScript errors, record the exact files and do not silently claim full frontend verification.

- [ ] **Step 5: Check git diff hygiene**

Run:

```powershell
git diff --check
git status --short
```

Expected:

- `git diff --check` has no whitespace errors.
- `git status --short` only lists intended forgot-password implementation files plus any pre-existing user changes.

- [ ] **Step 6: Report verification result**

Report the backend focused test result, full backend test result, frontend focused test result, frontend build result, `git diff --check` result, and final `git status --short`. Do not create a verification-only commit; each implementation task already has its own commit step.
