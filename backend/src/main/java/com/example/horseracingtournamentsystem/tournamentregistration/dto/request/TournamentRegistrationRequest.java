package com.example.horseracingtournamentsystem.tournamentregistration.dto.request;

import jakarta.validation.constraints.NotNull;

public record TournamentRegistrationRequest(
        @NotNull(message = "Tournament ID is required")
        Long tournamentId,

        @NotNull(message = "Horse ID is required")
        Long horseId,

        String note
) {
}
