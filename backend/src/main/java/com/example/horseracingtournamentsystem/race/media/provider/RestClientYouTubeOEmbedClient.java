package com.example.horseracingtournamentsystem.race.media.provider;

import com.example.horseracingtournamentsystem.race.media.config.RaceMediaYouTubeProperties;
import com.example.horseracingtournamentsystem.race.media.exception.ProviderUnavailableException;
import com.example.horseracingtournamentsystem.race.media.exception.VideoNotEmbeddableException;
import java.net.URI;
import java.util.Map;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class RestClientYouTubeOEmbedClient implements YouTubeOEmbedClient {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_BODY = new ParameterizedTypeReference<>() {
    };

    private final RestClient restClient;
    private final RaceMediaYouTubeProperties properties;

    public RestClientYouTubeOEmbedClient(RestClient raceMediaYouTubeRestClient, RaceMediaYouTubeProperties properties) {
        this.restClient = raceMediaYouTubeRestClient;
        this.properties = properties;
    }

    @Override
    public ProviderMeta fetchMetadata(String videoId) {
        URI uri = UriComponentsBuilder.fromUriString(properties.getOembedUrl())
                .queryParam("url", "https://www.youtube.com/watch?v={videoId}")
                .queryParam("format", "json")
                .build(videoId);
        try {
            Map<String, Object> body = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(MAP_BODY);
            String title = asString(body == null ? null : body.get("title"));
            String thumbnailUrl = asString(body == null ? null : body.get("thumbnail_url"));
            if (title == null || thumbnailUrl == null) {
                throw new ProviderUnavailableException("PROVIDER_BAD_RESPONSE", "YouTube oEmbed response is missing metadata");
            }
            return new ProviderMeta(title, thumbnailUrl);
        } catch (RestClientResponseException exception) {
            throw mapHttpError(exception);
        } catch (ResourceAccessException exception) {
            throw new ProviderUnavailableException("PROVIDER_UNAVAILABLE", "YouTube oEmbed could not be reached");
        } catch (RestClientException exception) {
            throw new ProviderUnavailableException("PROVIDER_UNAVAILABLE", "YouTube oEmbed request failed");
        }
    }

    private RuntimeException mapHttpError(RestClientResponseException exception) {
        HttpStatusCode statusCode = exception.getStatusCode();
        if (statusCode.is5xxServerError()) {
            return new ProviderUnavailableException("PROVIDER_UNAVAILABLE", "YouTube oEmbed is temporarily unavailable");
        }
        return new VideoNotEmbeddableException("NOT_EMBEDDABLE", "YouTube video is not embeddable");
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isBlank() ? null : text;
    }
}
