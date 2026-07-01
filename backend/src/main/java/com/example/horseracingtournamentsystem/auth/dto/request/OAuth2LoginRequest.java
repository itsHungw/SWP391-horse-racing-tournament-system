package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OAuth2LoginRequest(
    @NotBlank(message = "OAUTH_TOKEN_REQUIRED") String idToken
) {}
