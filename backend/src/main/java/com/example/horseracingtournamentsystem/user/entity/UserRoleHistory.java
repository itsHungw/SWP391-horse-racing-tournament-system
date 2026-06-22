package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.*;

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

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private com.example.horseracingtournamentsystem.user.enums.UserRoleStatus oldStatus;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private com.example.horseracingtournamentsystem.user.enums.UserRoleStatus newStatus;

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
            com.example.horseracingtournamentsystem.user.enums.UserRoleStatus oldStatus,
            com.example.horseracingtournamentsystem.user.enums.UserRoleStatus newStatus,
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
