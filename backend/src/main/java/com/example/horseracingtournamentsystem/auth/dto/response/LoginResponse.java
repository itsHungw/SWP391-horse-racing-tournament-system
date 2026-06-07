package com.example.horseracingtournamentsystem.auth.dto.response;

public record LoginResponse(
        String accessToken,
        String fullName,
        String email
) {
}
