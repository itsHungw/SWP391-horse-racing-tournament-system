package com.example.horseracingtournamentsystem.race.dto.response;

import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.race.enums.ParticipantCheckStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantConfirmationStatus;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
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
        ParticipantConfirmationStatus confirmationStatus,
        ParticipantCheckStatus checkStatus,
        ParticipantStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
