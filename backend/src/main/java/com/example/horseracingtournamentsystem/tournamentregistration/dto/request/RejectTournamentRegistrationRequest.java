package com.example.horseracingtournamentsystem.tournamentregistration.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RejectTournamentRegistrationRequest(
        @NotBlank(message = "Rejection reason is required")
        String reason
) {
}
