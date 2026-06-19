package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;

public record UpdateUserProfileAdminRequest(
    @NotBlank @Size(max = 150) String fullName,
    String phone,
    LocalDate dateOfBirth,
    String gender,
    String address,
    @NotNull com.example.horseracingtournamentsystem.user.enums.UserStatus status
) {}
