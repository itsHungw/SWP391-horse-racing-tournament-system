package com.example.horseracingtournamentsystem.wallet.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "wallet_status_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalletStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", nullable = false, length = 20)
    private WalletStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private WalletStatus newStatus;

    @Column(name = "public_reason", nullable = false, length = 500)
    private String publicReason;

    @Column(name = "internal_note", length = 1000)
    private String internalNote;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "changed_by", nullable = false)
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    public static WalletStatusHistory record(
            User user, WalletStatus oldStatus, WalletStatus newStatus, User changedBy,
            String publicReason, String internalNote) {
        WalletStatusHistory history = new WalletStatusHistory();
        history.user = user;
        history.oldStatus = oldStatus;
        history.newStatus = newStatus;
        history.changedBy = changedBy;
        history.publicReason = publicReason.trim();
        history.internalNote = internalNote == null || internalNote.isBlank() ? null : internalNote.trim();
        history.changedAt = LocalDateTime.now();
        return history;
    }
}
