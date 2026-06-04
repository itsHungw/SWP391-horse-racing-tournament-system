package com.example.horseracingtournamentsystem.user.dto.response;

import com.example.horseracingtournamentsystem.user.entity.User;
import java.time.LocalDate;
import java.util.Set;

public record UserProfileResponse(
        String fullName,
        String phone,
        String gender,
        LocalDate dateOfBirth,
        String address,
        String avatarUrl,
        Set<String> roles,
        boolean profileCompleted,
        boolean phoneVerified,
        boolean ageVerified,
        RefereeProfileInfo refereeProfile
) {
    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getFullName(),
                user.getPhone(),
                user.getGender(),
                user.getDateOfBirth(),
                user.getAddress(),
                user.getAvatarUrl(),
                user.getActiveRoleNames(),
                user.isProfileCompleted(),
                user.isPhoneVerified(),
                user.isAgeVerified(),
                RefereeProfileInfo.from(user.getRefereeProfile())
        );
    }
}
