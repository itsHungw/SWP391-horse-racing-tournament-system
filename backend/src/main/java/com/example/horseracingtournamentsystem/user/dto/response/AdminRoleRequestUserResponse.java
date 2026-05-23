package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AdminRoleRequestUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String avatarUrl,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String status,
        boolean emailVerified,
        boolean phoneVerified,
        boolean ageVerified,
        boolean profileCompleted,
        List<String> roles,
        LocalDateTime createdAt,
        LocalDateTime lastLoginAt
) {
    public static AdminRoleRequestUserResponse from(User user) {
        return new AdminRoleRequestUserResponse(
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
                user.isPhoneVerified(),
                user.isAgeVerified(),
                user.isProfileCompleted(),
                user.getActiveRoleNames().stream().sorted().toList(),
                user.getCreatedAt(),
                user.getLastLoginAt()
        );
    }
}
