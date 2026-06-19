package com.example.horseracingtournamentsystem.user.entity;

import com.example.horseracingtournamentsystem.user.enums.UserRoleStatus;
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
@Table(name = "user_roles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserRole {



    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserRoleStatus status;

    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private User assignedBy;

    @Column(name = "removed_at")
    private LocalDateTime removedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "removed_by")
    private User removedBy;

    public static UserRole active(User user, Role role, User assignedBy) {
        UserRole userRole = new UserRole();
        userRole.user = user;
        userRole.role = role;
        userRole.status = UserRoleStatus.ACTIVE;
        userRole.assignedAt = LocalDateTime.now();
        userRole.assignedBy = assignedBy;
        user.addUserRole(userRole);
        return userRole;
    }

    public boolean isActive() {
        return UserRoleStatus.ACTIVE == status;
    }

    public void suspend() {
        this.status = UserRoleStatus.SUSPENDED;
    }

    public void remove(User removedBy) {
        this.status = UserRoleStatus.REMOVED;
        this.removedAt = LocalDateTime.now();
        this.removedBy = removedBy;
    }

    public void reactivate(User assignedBy) {
        this.status = UserRoleStatus.ACTIVE;
        this.assignedAt = LocalDateTime.now();
        this.assignedBy = assignedBy;
        this.removedAt = null;
        this.removedBy = null;
    }

    public void changeRole(Role role, User assignedBy) {
        this.role = role;
        this.assignedAt = LocalDateTime.now();
        this.assignedBy = assignedBy;
        this.status = UserRoleStatus.ACTIVE;
        this.removedAt = null;
        this.removedBy = null;
    }
}
