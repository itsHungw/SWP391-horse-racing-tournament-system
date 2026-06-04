package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateRefereeProfileRequest(
        @Size(max = 100, message = "License number must be at most 100 characters")
        String licenseNumber,

        @Size(max = 255, message = "Certification must be at most 255 characters")
        String certification,

        @Min(value = 0, message = "Experience years cannot be negative")
        @Max(value = 80, message = "Experience years is too large")
        int experienceYears,

        @Size(max = 2000, message = "Bio must be at most 2000 characters")
        String bio,

        @Size(max = 500, message = "Evidence URL must be at most 500 characters")
        String evidenceUrl
) {
}
