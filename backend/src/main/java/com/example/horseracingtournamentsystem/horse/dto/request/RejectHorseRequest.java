package com.example.horseracingtournamentsystem.horse.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejectHorseRequest(
        @NotBlank(message = "Rejection reason is required")
        String reason
) {
}
