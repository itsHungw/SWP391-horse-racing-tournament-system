package com.example.horseracingtournamentsystem.championship.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record JockeyPoolApplicationResponse(
        Long id,
        Long championshipId,
        String championshipName,
        Long jockeyId,
        String jockeyName,
        String jockeyEmail,
        String jockeyAvatarUrl,
        String message,
        String status,
        Long reviewedBy,
        LocalDateTime reviewedAt,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime withdrawnAt
) {
}
