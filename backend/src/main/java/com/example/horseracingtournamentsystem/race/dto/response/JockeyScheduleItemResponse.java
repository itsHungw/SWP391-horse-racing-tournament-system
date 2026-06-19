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
        com.example.horseracingtournamentsystem.race.enums.RaceStatus raceStatus,
        Long championshipId,
        String championshipName,
        com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus championshipStatus,
        Long horseId,
        String horseName,
        Long ownerId,
        String ownerName,
        Integer startNumber,
        Integer laneNumber,
        com.example.horseracingtournamentsystem.race.enums.ParticipantConfirmationStatus confirmationStatus,
        com.example.horseracingtournamentsystem.race.enums.ParticipantCheckStatus checkStatus,
        com.example.horseracingtournamentsystem.race.enums.ParticipantStatus participantStatus
) {
}
