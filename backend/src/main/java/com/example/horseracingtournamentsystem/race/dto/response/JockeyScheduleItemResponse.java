package com.example.horseracingtournamentsystem.race.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record JockeyScheduleItemResponse(
        Long raceParticipantId,
        Long raceId,
        String raceName,
        String raceCode,
        LocalDateTime raceAt,
        Integer distanceMeters,
        String raceStatus,
        Long championshipId,
        String championshipName,
        String championshipStatus,
        Long horseId,
        String horseName,
        Long ownerId,
        String ownerName,
        Integer startNumber,
        Integer laneNumber,
        String confirmationStatus,
        String checkStatus,
        String participantStatus
) {
}
