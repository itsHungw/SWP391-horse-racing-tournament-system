package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.time.LocalDate;

public record UserProfileResponse(
        String fullName,
        String phone,
        String gender,
        LocalDate dateOfBirth,
        String address,
        String avatarUrl,
        boolean profileCompleted,
        boolean phoneVerified,
        boolean ageVerified
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getFullName(),
                user.getPhone(),
                user.getGender(),
                user.getDateOfBirth(),
                user.getAddress(),
                user.getAvatarUrl(),
                user.isProfileCompleted(),
                user.isPhoneVerified(),
                user.isAgeVerified()
        );
    }
}
