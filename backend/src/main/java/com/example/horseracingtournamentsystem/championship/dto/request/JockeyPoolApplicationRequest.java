package com.example.horseracingtournamentsystem.championship.dto.request;

import jakarta.validation.constraints.Size;

public record JockeyPoolApplicationRequest(
        @Size(max = 500, message = "Message must be at most 500 characters")
        String message
) {
}
