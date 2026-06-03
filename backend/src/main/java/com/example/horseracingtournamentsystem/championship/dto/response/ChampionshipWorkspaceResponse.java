package com.example.horseracingtournamentsystem.championship.dto.response;

import java.time.LocalDateTime;

public record ChampionshipWorkspaceResponse(
        Long id,
        String name,
        String code,
        String location,
        String status,
        String phase,
        String phaseLabel,
        CurrentRound currentRound,
        NextAction nextAction,
        Counts counts,
        Readiness readiness
) {
    public record CurrentRound(
            Long id,
            String name,
            String code,
            String status,
            boolean isOfficial,
            LocalDateTime raceDateTime
    ) {
    }

    public record NextAction(
            String code,
            String label,
            String target,
            Long roundId
    ) {
    }

    public record Counts(
            long pendingRegistrations,
            long approvedRegistrations,
            long participants,
            long rounds,
            long publishedRounds
    ) {
    }

    public record Readiness(
            boolean hasRounds,
            boolean registrationsClosed,
            boolean participantsLocked,
            boolean standingsReady
    ) {
    }
}
