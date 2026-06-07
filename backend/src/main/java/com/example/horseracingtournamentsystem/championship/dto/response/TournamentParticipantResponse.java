package com.example.horseracingtournamentsystem.championship.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record TournamentParticipantResponse(
        Long id,
        Long championshipId,
        String championshipName,
        Long horseRegistrationId,
        Long horseId,
        String horseName,
        Long ownerId,
        String ownerName,
        Long jockeyId,
        String jockeyName,
        Long jockeyInvitationId,
        String status,
        Integer points,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
