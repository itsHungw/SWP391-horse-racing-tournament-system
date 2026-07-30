package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record AdminUserDetailResponse(
    Long id,
    String fullName,
    String email,
    String phone,
    String avatarUrl,
    LocalDate dateOfBirth,
    String gender,
    String address,
    UserStatus status,
    boolean emailVerified,
    Set<String> roles,
    LocalDateTime lastLoginAt,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static AdminUserDetailResponse from(User user) {
        return new AdminUserDetailResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getAvatarUrl(),
            user.getDateOfBirth(),
            user.getGender(),
            user.getAddress(),
            user.getStatus(),
            user.isEmailVerified(),
            user.getActiveRoleNames(),
            user.getLastLoginAt(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
