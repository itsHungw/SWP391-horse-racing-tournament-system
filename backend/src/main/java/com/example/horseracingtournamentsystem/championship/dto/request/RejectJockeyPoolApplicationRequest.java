package com.example.horseracingtournamentsystem.championship.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectJockeyPoolApplicationRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(max = 500, message = "Rejection reason must be at most 500 characters")
        String reason
) {
}
