package com.example.horseracingtournamentsystem.tournamentregistration.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record TournamentRegistrationResponse(
        Long id,
        Long tournamentId,
        String tournamentName,
        Long horseId,
        String horseName,
        String horseImageUrl,
        String horseEvidenceUrl,
        Long ownerId,
        String ownerName,
        String note,
        String status,
        String rejectionReason,
        Long reviewedBy,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt,
        LocalDateTime updatedAt,
        LocalDateTime withdrawnAt
) {
}
