package com.example.horseracingtournamentsystem.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateOwnerProfileRequest(
        @NotBlank(message = "Stable name is required")
        @Size(max = 150, message = "Stable name must be at most 150 characters")
        String stableName,

        @Size(max = 150, message = "Owner name must be at most 150 characters")
        String ownerName,

        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @NotBlank(message = "Phone is required")
        @Size(max = 30, message = "Phone must be at most 30 characters")
        String contactPhone,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 150, message = "Email must be at most 150 characters")
        String contactEmail,

        @NotBlank(message = "Address is required")
        @Size(max = 500, message = "Address must be at most 500 characters")
        String contactAddress,

        @Size(max = 500, message = "Logo URL must be at most 500 characters")
        String logoUrl
) {
}
