package com.example.horseracingtournamentsystem.race.media.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(RaceMediaYouTubeProperties.class)
public class RaceMediaProviderConfig {

    @Bean
    RestClient raceMediaYouTubeRestClient(RaceMediaYouTubeProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(properties.getConnectTimeout());
        requestFactory.setReadTimeout(properties.getReadTimeout());
        return RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }
}
