package com.example.horseracingtournamentsystem.race.media.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "racemedia.youtube")
public class RaceMediaYouTubeProperties {
    private String oembedUrl = "https://www.youtube.com/oembed";
    private Duration connectTimeout = Duration.ofSeconds(2);
    private Duration readTimeout = Duration.ofSeconds(3);
}
