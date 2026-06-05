package com.example.horseracingtournamentsystem.championship.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record JockeyInvitationResponse(
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
        Long jockeyApplicationId,
        String message,
        String agreementUrl,
        String agreementFileName,
        String status,
        LocalDateTime readAt,
        LocalDateTime acceptedAt,
        LocalDateTime rejectedAt,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
