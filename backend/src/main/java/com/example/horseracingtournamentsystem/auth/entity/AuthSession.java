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
@Table(name = "auth_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuthSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "refresh_token_hash", nullable = false, length = 255)
    private String refreshTokenHash;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_by_session_id")
    private AuthSession replacedBySession;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    public static AuthSession create(
            User user,
            String refreshTokenHash,
            String userAgent,
            String ipAddress,
            LocalDateTime expiresAt
    ) {
        AuthSession session = new AuthSession();
        session.user = user;
        session.refreshTokenHash = refreshTokenHash;
        session.userAgent = userAgent;
        session.ipAddress = ipAddress;
        session.expiresAt = expiresAt;
        session.createdAt = LocalDateTime.now();
        return session;
    }

    public boolean isExpired(LocalDateTime atTime) {
        return !expiresAt.isAfter(atTime);
    }

    public void revokeNow() {
        this.revokedAt = LocalDateTime.now();
    }

    public void replaceBy(AuthSession replacementSession) {
        this.replacedBySession = replacementSession;
        revokeNow();
    }
}
