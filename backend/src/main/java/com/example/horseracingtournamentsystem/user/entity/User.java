package com.example.horseracingtournamentsystem.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_PENDING_EMAIL_VERIFY = "PENDING_EMAIL_VERIFY";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    @Column(name = "phone_verified", nullable = false)
    private boolean phoneVerified;

    @Column(name = "age_verified", nullable = false)
    private boolean ageVerified;

    @Column(name = "profile_completed", nullable = false)
    private boolean profileCompleted;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "user")
    private Set<UserRole> userRoles = new HashSet<>();

    public static User pending(String fullName, String email, String passwordHash) {
        return pending(fullName, email, passwordHash, null);
    }

    public static User pending(String fullName, String email, String passwordHash, String phone) {
        User user = new User();
        user.fullName = fullName;
        user.email = email;
        user.passwordHash = passwordHash;
        user.phone = phone;
        user.status = STATUS_PENDING_EMAIL_VERIFY;
        user.emailVerified = false;
        user.phoneVerified = false;
        user.ageVerified = false;
        user.profileCompleted = false;
        user.createdAt = LocalDateTime.now();
        return user;
    }

    public void verifyEmail() {
        this.emailVerified = true;
        this.status = STATUS_ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
        LocalDateTime now = LocalDateTime.now();
        this.passwordChangedAt = now;
        this.updatedAt = now;
    }

    public Set<String> getActiveRoleNames() {
        return userRoles.stream()
                .filter(UserRole::isActive)
                .map(UserRole::getRole)
                .map(Role::getName)
                .collect(Collectors.toUnmodifiableSet());
    }

    public Set<UserRole> getUserRoles() {
        return Collections.unmodifiableSet(userRoles);
    }

    void addUserRole(UserRole userRole) {
        userRoles.add(userRole);
    }

    public void updateProfile(String fullName, String phone, String gender, LocalDate dateOfBirth, String address, String avatarUrl) {
        this.fullName = fullName;
        this.phone = phone;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.address = address;
        if (avatarUrl != null && !avatarUrl.isBlank()) {
            this.avatarUrl = avatarUrl;
        }
        this.profileCompleted = true;
        this.ageVerified = isAtLeast18(dateOfBirth);
        this.updatedAt = LocalDateTime.now();
    }

    private boolean isAtLeast18(LocalDate dateOfBirth) {
        return dateOfBirth != null && Period.between(dateOfBirth, LocalDate.now()).getYears() >= 18;
    }
}
