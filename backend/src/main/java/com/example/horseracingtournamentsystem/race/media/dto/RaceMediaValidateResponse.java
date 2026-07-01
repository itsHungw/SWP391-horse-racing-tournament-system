package com.example.horseracingtournamentsystem.race.media.dto;

import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.enums.MediaVerificationStatus;

public record RaceMediaValidateResponse(
        MediaProviderType provider,
        String providerVideoId,
        String embedUrl,
        String providerTitle,
        String thumbnailUrl,
        MediaVerificationStatus verificationStatus,
        String providerErrorCode,
        String message
) {
}
