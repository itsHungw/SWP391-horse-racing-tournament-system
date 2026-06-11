package com.example.horseracingtournamentsystem.leaderboard.dto.response;

import java.util.List;

/**
 * One row of a horse or jockey championship standings table.
 * Matches the frontend ChampionshipStanding contract.
 */
public record ChampionshipStandingResponse(
        int rank,
        String name,
        String subtitle,
        long points,
        long wins,
        long podiums,
        long starts,
        List<String> form
) {
}
