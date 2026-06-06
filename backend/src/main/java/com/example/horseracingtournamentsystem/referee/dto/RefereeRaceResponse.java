package com.example.horseracingtournamentsystem.referee.dto;

import java.time.LocalDateTime;

public record RefereeRaceResponse(
        Long id,
        String name,
        String code,
        Integer distanceMeters,
        String status,
        LocalDateTime scheduledAt,
        String venue,
        Long championshipId,
        String championshipName,
        Long refereeId,
        String refereeName,
        int participantCount,
        String nextAction
) {
}
