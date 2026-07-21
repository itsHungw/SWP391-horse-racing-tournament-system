package com.example.horseracingtournamentsystem.user.entity;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_status_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, length = 30)
    private UserStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private UserStatus newStatus;

    @Column(name = "public_reason", nullable = false, length = 500)
    private String publicReason;

    @Column(name = "internal_note", length = 1000)
    private String internalNote;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "wallet_locked", nullable = false)
    private boolean walletLocked;

    public static UserStatusHistory record(
            User user, UserStatus oldStatus, UserStatus newStatus, User changedBy,
            String publicReason, String internalNote, boolean walletLocked) {
        UserStatusHistory history = new UserStatusHistory();
        history.user = user;
        history.oldStatus = oldStatus;
        history.newStatus = newStatus;
        history.changedBy = changedBy;
        history.publicReason = publicReason.trim();
        history.internalNote = internalNote == null || internalNote.isBlank() ? null : internalNote.trim();
        history.changedAt = LocalDateTime.now();
        history.walletLocked = walletLocked;
        return history;
    }
}
