package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_role_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserRoleHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_role_id", nullable = false)
    private UserRole userRole;

    @Column(name = "old_status", length = 30)
    private String oldStatus;

    @Column(name = "new_status", nullable = false, length = 30)
    private String newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Lob
    @Column(name = "reason")
    private String reason;

    public static UserRoleHistory record(
            UserRole userRole,
            String oldStatus,
            String newStatus,
            User changedBy,
            String reason
    ) {
        UserRoleHistory history = new UserRoleHistory();
        history.userRole = userRole;
        history.oldStatus = oldStatus;
        history.newStatus = newStatus;
        history.changedBy = changedBy;
        history.changedAt = LocalDateTime.now();
        history.reason = reason;
        return history;
    }
}
