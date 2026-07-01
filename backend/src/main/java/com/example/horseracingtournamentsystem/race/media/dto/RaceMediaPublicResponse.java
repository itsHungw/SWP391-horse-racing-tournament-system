package com.example.horseracingtournamentsystem.race.media.dto;

import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import java.time.LocalDateTime;

public record RaceMediaPublicResponse(
        Long raceId,
        MediaProviderType provider,
        String providerVideoId,
        String embedUrl,
        String title,
        String providerTitle,
        String thumbnailUrl,
        LocalDateTime publishedAt
) {
}
