package com.example.horseracingtournamentsystem.race.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record RaceParticipantResponse(
        Long id,
        Long raceId,
        String raceName,
        Long championshipId,
        String championshipName,
        Long invitationId,
        Long horseId,
        String horseName,
        Long ownerId,
        String ownerName,
        Long jockeyId,
        String jockeyName,
        Integer startNumber,
        Integer laneNumber,
        String confirmationStatus,
        String checkStatus,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
