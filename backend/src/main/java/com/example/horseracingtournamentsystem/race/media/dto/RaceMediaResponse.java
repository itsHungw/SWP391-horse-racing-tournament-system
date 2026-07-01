package com.example.horseracingtournamentsystem.race.media.dto;

import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaStatus;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;
import java.time.LocalDateTime;

public record RaceMediaResponse(
        Long id,
        Long raceId,
        MediaProviderType provider,
        String providerVideoId,
        String sourceUrl,
        String embedUrl,
        String title,
        String providerTitle,
        String thumbnailUrl,
        MediaStatus status,
        MediaVerificationStatus verificationStatus,
        String providerErrorCode,
        String message,
        boolean canPublish,
        String publishBlockedReason,
        LocalDateTime lastVerifiedAt,
        LocalDateTime publishedAt,
        String publishedByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
