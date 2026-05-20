package com.example.horseracingtournamentsystem.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Size(max = 150)
        String fullName,

        @Email
        @NotBlank
        @Size(max = 150)
        String email,

        @NotBlank
        @Size(min = 8)
        String password,

        @Size(max = 30)
        String phone
) {
}
