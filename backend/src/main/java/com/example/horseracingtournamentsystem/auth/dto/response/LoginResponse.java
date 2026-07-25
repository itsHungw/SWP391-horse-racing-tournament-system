package com.example.horseracingtournamentsystem.auth.dto.response;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;

public record LoginResponse(
        String accessToken,
        String fullName,
        String email,
        UserStatus accountStatus
) {
}
