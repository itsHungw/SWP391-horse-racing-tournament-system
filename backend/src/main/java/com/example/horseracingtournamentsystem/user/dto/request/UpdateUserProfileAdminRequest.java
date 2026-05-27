package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateUserProfileAdminRequest(
    @NotBlank @Size(max = 150) String fullName,
    String phone,
    LocalDate dateOfBirth,
    String gender,
    String address,
    @NotBlank String status
) {}
