package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequest(
        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "Email verification code must be 6 digits")
        String token
) {
}
