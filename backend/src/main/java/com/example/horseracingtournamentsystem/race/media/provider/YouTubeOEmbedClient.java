package com.example.horseracingtournamentsystem.race.media.provider;

@FunctionalInterface
public interface YouTubeOEmbedClient {
    ProviderMeta fetchMetadata(String videoId);
}
