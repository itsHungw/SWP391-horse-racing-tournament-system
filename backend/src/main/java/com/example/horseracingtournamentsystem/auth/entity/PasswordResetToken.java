package com.example.horseracingtournamentsystem.auth.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "password_reset_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static PasswordResetToken create(User user, String tokenHash, LocalDateTime expiresAt) {
        PasswordResetToken token = new PasswordResetToken();
        token.user = user;
        token.tokenHash = tokenHash;
        token.expiresAt = expiresAt;
        token.failedAttempts = 0;
        token.lockedAt = null;
        token.createdAt = LocalDateTime.now();
        return token;
    }

    public boolean isExpired(LocalDateTime atTime) {
        return !expiresAt.isAfter(atTime);
    }

    public void markUsed() {
        this.usedAt = LocalDateTime.now();
    }

    public void incrementFailedAttempts() {
        this.failedAttempts++;
    }

    public void lockNow() {
        this.lockedAt = LocalDateTime.now();
    }

    public boolean isLocked() {
        return lockedAt != null;
    }
}
