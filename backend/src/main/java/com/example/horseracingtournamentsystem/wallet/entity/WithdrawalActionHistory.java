package com.example.horseracingtournamentsystem.wallet.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "withdrawal_action_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WithdrawalActionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "withdrawal_id", nullable = false)
    private WithdrawalRequest withdrawal;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 30)
    private WithdrawalActionType action;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 20)
    private WithdrawalStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private WithdrawalStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(name = "actor_name", nullable = false, length = 150)
    private String actorName;

    @Column(name = "public_reason", length = 500)
    private String publicReason;

    @Column(name = "internal_note", length = 1000)
    private String internalNote;

    @Column(name = "transfer_reference", length = 120)
    private String transferReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 10)
    private WithdrawalRiskLevel riskLevel;

    @Column(name = "risk_findings", nullable = false, columnDefinition = "text")
    private String riskFindings;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static WithdrawalActionHistory record(
            WithdrawalRequest withdrawal,
            WithdrawalActionType action,
            WithdrawalStatus oldStatus,
            WithdrawalStatus newStatus,
            User actor,
            String publicReason,
            String internalNote,
            String transferReference,
            WithdrawalRiskLevel riskLevel,
            String riskFindings
    ) {
        WithdrawalActionHistory history = new WithdrawalActionHistory();
        history.withdrawal = withdrawal;
        history.action = action;
        history.oldStatus = oldStatus;
        history.newStatus = newStatus;
        history.actor = actor;
        history.actorName = actor.getFullName();
        history.publicReason = blankToNull(publicReason);
        history.internalNote = blankToNull(internalNote);
        history.transferReference = blankToNull(transferReference);
        history.riskLevel = riskLevel;
        history.riskFindings = riskFindings == null || riskFindings.isBlank() ? "[]" : riskFindings;
        history.createdAt = LocalDateTime.now();
        return history;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
