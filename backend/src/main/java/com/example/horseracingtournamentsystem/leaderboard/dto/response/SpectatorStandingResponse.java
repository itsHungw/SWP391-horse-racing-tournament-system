package com.example.horseracingtournamentsystem.leaderboard.dto.response;

/**
 * One row of the spectator points leaderboard.
 * Privacy: exposes only a display name — never email or user id.
 * Matches the frontend SpectatorStanding contract.
 */
public record SpectatorStandingResponse(
        int rank,
        String displayName,
        long points,
        long correctPredictions,
        long totalPredictions
) {
}
