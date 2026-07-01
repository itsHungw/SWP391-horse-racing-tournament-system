package com.example.horseracingtournamentsystem.race.media.provider;

import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;

public interface HighlightProvider {
    MediaProviderType type();

    String normalizeId(String url);

    ProviderMeta verify(String videoId);

    String embedUrl(String videoId);
}
