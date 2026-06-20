package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @Email
        @NotBlank
        @Size(max = 150)
        String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "Password reset code must be 6 digits")
        String token,

        @NotBlank
        @Size(min = 8)
        String newPassword,

        @NotBlank
        @Size(min = 8)
        String confirmPassword
) {
}
