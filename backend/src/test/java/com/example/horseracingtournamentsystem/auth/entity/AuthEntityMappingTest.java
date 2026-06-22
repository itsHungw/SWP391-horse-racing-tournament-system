package com.example.horseracingtournamentsystem.auth.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class AuthEntityMappingTest {

    @Test
    void authSessionSelfReferenceCanBeAssigned() {
        User user = User.pending("Spectator One", "spectator@example.com", "hashed-password");
        AuthSession original = AuthSession.create(user, "original", "browser", "127.0.0.1", LocalDateTime.now().plusDays(1));
        AuthSession replacement = AuthSession.create(user, "replacement", "browser", "127.0.0.1", LocalDateTime.now().plusDays(1));

        original.replaceBy(replacement);

        assertSame(replacement, original.getReplacedBySession());
        assertNotNull(original.getRevokedAt());
    }

    @Test
    void verificationTokenCanBeMarkedUsed() {
        User user = User.pending("Spectator One", "spectator@example.com", "hashed-password");
        EmailVerificationToken token = EmailVerificationToken.create(user, "verification", LocalDateTime.now().plusDays(1));

        assertNull(token.getUsedAt());

        token.markUsed();

        assertNotNull(token.getUsedAt());
    }

    @Test
    void resetTokenCanBeMarkedUsed() {
        User user = User.pending("Spectator One", "spectator@example.com", "hashed-password");
        PasswordResetToken token = PasswordResetToken.create(user, "reset", LocalDateTime.now().plusDays(1));

        assertNull(token.getUsedAt());

        token.markUsed();

        assertNotNull(token.getUsedAt());
    }

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
}
