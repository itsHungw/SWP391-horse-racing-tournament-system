package com.example.horseracingtournamentsystem.security;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

    private String contentSecurityPolicy = "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; frame-src https://www.youtube-nocookie.com; img-src 'self' https://i.ytimg.com data:";
    private RateLimit rateLimit = new RateLimit();

    @Getter
    @Setter
    public static class RateLimit {
        private boolean enabled = true;
        private long windowSeconds = 60; // limit 60 seconds
        private int loginLimit = 10; // limit 10 times per 60 seconds
        private int uploadLimit = 20; // limit 20 times per 60 seconds
        private int predictionSubmitLimit = 30; // limit 30 times per 60 seconds
        private int forgotPasswordLimit = 3; // limit 3 times per 900 seconds
        private long forgotPasswordWindowSeconds = 900; // limit 900 seconds
        private int resetPasswordLimit = 10; // limit 10 times per 900 seconds
        private long resetPasswordWindowSeconds = 900; // limit 900 seconds
        private long cacheMaximumSize = 50_000;
        private long cacheTtlSeconds = 1_200;
        private List<String> trustedProxies = List.of();
    }
}
