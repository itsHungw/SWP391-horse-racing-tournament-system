package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record OwnerHorseUpdateRequest(
        @NotBlank(message = "Horse name is required")
        @Size(max = 150)
        String name,

        @Size(max = 100)
        String breed,

        @NotBlank(message = "Gender is required")
        @Pattern(regexp = "MALE|FEMALE", message = "Gender must be MALE or FEMALE")
        String gender,

        @PastOrPresent(message = "Date of birth cannot be in the future")
        LocalDate dateOfBirth,

        @Size(max = 50)
        String color,

        @Positive(message = "Height must be greater than 0")
        @jakarta.validation.constraints.Max(value = 9999, message = "Height cannot exceed 9999 cm")
        Integer heightCm,

        @Positive(message = "Weight must be greater than 0")
        @jakarta.validation.constraints.Max(value = 9999, message = "Weight cannot exceed 9999 kg")
        Integer weightKg,

        @Size(max = 50)
        String healthStatus,

        String medicalNote,

        String description
) {
}
