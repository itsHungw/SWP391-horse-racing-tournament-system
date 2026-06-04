package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;

public record CreateUserAdminRequest(
    @NotBlank @Size(max = 150) String fullName,
    @NotBlank @Email @Size(max = 150) String email,
    @NotBlank @Size(min = 6, max = 100) String password,
    String phone,
    LocalDate dateOfBirth,
    String gender,
    String address,
    Set<Long> roleIds
) {}
