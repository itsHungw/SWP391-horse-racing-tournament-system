package com.example.horseracingtournamentsystem.championship.dto.response;

public record LockParticipantsResponse(
        Long championshipId,
        int createdParticipants
) {
}
