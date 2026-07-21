package com.example.horseracingtournamentsystem.wallet.entity;

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
@Table(name = "withdrawal_export_audits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WithdrawalExportAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Column(name = "actor_name", nullable = false, length = 150)
    private String actorName;

    @Column(name = "normalized_filters", nullable = false, length = 2000)
    private String normalizedFilters;

    @Column(name = "operations_rows", nullable = false)
    private int operationsRows;

    @Column(name = "reconciliation_rows", nullable = false)
    private int reconciliationRows;

    @Column(name = "exported_at", nullable = false)
    private LocalDateTime exportedAt;

    public static WithdrawalExportAudit record(
            User actor,
            String normalizedFilters,
            int operationsRows,
            int reconciliationRows
    ) {
        WithdrawalExportAudit audit = new WithdrawalExportAudit();
        audit.actor = actor;
        audit.actorName = actor.getFullName();
        audit.normalizedFilters = normalizedFilters;
        audit.operationsRows = operationsRows;
        audit.reconciliationRows = reconciliationRows;
        audit.exportedAt = LocalDateTime.now();
        return audit;
    }
}
