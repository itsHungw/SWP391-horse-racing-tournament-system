package com.example.horseracingtournamentsystem.race.media.provider;

import com.example.horseracingtournamentsystem.race.media.enums.MediaProviderType;
import com.example.horseracingtournamentsystem.race.media.exception.InvalidMediaUrlException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class YouTubeHighlightProvider implements HighlightProvider {

    private static final Pattern VIDEO_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    private final YouTubeOEmbedClient oEmbedClient;

    public YouTubeHighlightProvider(YouTubeOEmbedClient oEmbedClient) {
        this.oEmbedClient = oEmbedClient;
    }

    @Override
    public MediaProviderType type() {
        return MediaProviderType.YOUTUBE;
    }

    @Override
    public String normalizeId(String url) {
        URI uri = parseUri(url);
        String host = Optional.ofNullable(uri.getHost())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .orElseThrow(() -> invalidUrl());
        if (!isAllowedHost(host)) {
            throw invalidUrl();
        }

        String candidate = "youtu.be".equals(host)
                ? firstPathSegment(uri.getPath())
                : extractFromYouTubeUrl(uri);
        if (candidate == null || !VIDEO_ID.matcher(candidate).matches()) {
            throw invalidUrl();
        }
        return candidate;
    }

    @Override
    public ProviderMeta verify(String videoId) {
        return oEmbedClient.fetchMetadata(videoId);
    }

    @Override
    public String embedUrl(String videoId) {
        if (videoId == null || !VIDEO_ID.matcher(videoId).matches()) {
            throw new InvalidMediaUrlException("INVALID_YOUTUBE_VIDEO_ID");
        }
        // Never embed the submitted URL directly. The iframe source is rebuilt from the canonical video id.
        return "https://www.youtube-nocookie.com/embed/" + videoId;
    }

    private URI parseUri(String url) {
        try {
            URI uri = URI.create(url == null ? "" : url.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("https") && !scheme.equalsIgnoreCase("http"))) {
                throw invalidUrl();
            }
            return uri;
        } catch (IllegalArgumentException exception) {
            throw invalidUrl();
        }
    }

    private boolean isAllowedHost(String host) {
        return "youtube.com".equals(host)
                || "www.youtube.com".equals(host)
                || "m.youtube.com".equals(host)
                || "youtu.be".equals(host);
    }

    private String extractFromYouTubeUrl(URI uri) {
        String path = uri.getPath() == null ? "" : uri.getPath();
        if ("/watch".equals(path)) {
            return queryParams(uri).get("v");
        }
        String[] segments = Arrays.stream(path.split("/"))
                .filter(segment -> !segment.isBlank())
                .toArray(String[]::new);
        if (segments.length >= 2 && ("embed".equals(segments[0]) || "shorts".equals(segments[0]) || "live".equals(segments[0]))) {
            return segments[1];
        }
        return null;
    }

    private String firstPathSegment(String path) {
        if (path == null) {
            return null;
        }
        return Arrays.stream(path.split("/"))
                .filter(segment -> !segment.isBlank())
                .findFirst()
                .orElse(null);
    }

    private Map<String, String> queryParams(URI uri) {
        String query = uri.getRawQuery();
        if (query == null || query.isBlank()) {
            return Map.of();
        }
        return Arrays.stream(query.split("&"))
                .map(parameter -> parameter.split("=", 2))
                .filter(parts -> parts.length == 2)
                .collect(Collectors.toMap(
                        parts -> decode(parts[0]),
                        parts -> decode(parts[1]),
                        (first, ignored) -> first
                ));
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private InvalidMediaUrlException invalidUrl() {
        return new InvalidMediaUrlException("INVALID_YOUTUBE_URL");
    }
}
