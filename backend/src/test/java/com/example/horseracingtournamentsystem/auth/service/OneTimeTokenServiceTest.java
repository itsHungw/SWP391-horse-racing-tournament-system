package com.example.horseracingtournamentsystem.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.auth.entity.PasswordResetToken;
import com.example.horseracingtournamentsystem.auth.exception.PasswordResetRejectedException;
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
import org.springframework.test.util.ReflectionTestUtils;

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
        ReflectionTestUtils.setField(user, "id", 42L);
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
        when(passwordResetTokenRepository.findActiveMatchingForUpdate(42L, "wrong-hash"))
                .thenReturn(Optional.empty());
        when(passwordResetTokenRepository.findActiveForUpdate(eq(42L), any()))
                .thenReturn(List.of(latestToken));

        assertThatThrownBy(() -> service.consumePasswordResetToken(user, "000000"))
                .isInstanceOf(PasswordResetRejectedException.class)
                .hasMessage("INVALID_PASSWORD_RESET_TOKEN");

        assertThat(latestToken.getFailedAttempts()).isEqualTo(5);
        assertThat(latestToken.isLocked()).isTrue();
    }

    @Test
    void verifyPasswordResetTokenDoesNotMarkValidTokenUsed() {
        PasswordResetToken token = PasswordResetToken.create(user, "correct-hash", LocalDateTime.now().plusMinutes(10));

        when(tokenHashService.sha256("123456")).thenReturn("correct-hash");
        when(passwordResetTokenRepository.findActiveMatchingForUpdate(42L, "correct-hash"))
                .thenReturn(Optional.of(token));

        service.verifyPasswordResetToken(user, "123456");

        assertThat(token.getUsedAt()).isNull();
    }
}
