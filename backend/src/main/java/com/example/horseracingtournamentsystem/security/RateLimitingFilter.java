package com.example.horseracingtournamentsystem.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

//@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final AppSecurityProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public RateLimitingFilter(AppSecurityProperties properties, ObjectMapper objectMapper) {
        this(properties, objectMapper, Clock.systemUTC());
    }

    RateLimitingFilter(AppSecurityProperties properties, ObjectMapper objectMapper, Clock clock) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        LimitRule rule = resolveRule(request);
        if (rule == null || !properties.getRateLimit().isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.name + ":" + clientKey(request);
        Bucket bucket = buckets.compute(key, (ignored, existing) -> refresh(existing));
        if (bucket.count >= rule.limit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                    "error", "Too Many Requests",
                    "message", "Too many requests. Please try again later.",
                    "path", request.getRequestURI()
            ));
            return;
        }

        bucket.count++;
        filterChain.doFilter(request, response);
    }

    private Bucket refresh(Bucket existing) {
        Instant now = clock.instant();
        long windowSeconds = Math.max(1, properties.getRateLimit().getWindowSeconds());
        if (existing == null || existing.windowStartedAt.plusSeconds(windowSeconds).isBefore(now)) {
            return new Bucket(now, 0);
        }
        return existing;
    }

    private LimitRule resolveRule(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        AppSecurityProperties.RateLimit limits = properties.getRateLimit();
        if ("POST".equals(method) && path.equals("/api/v1/auth/login")) {
            return new LimitRule("login", limits.getLoginLimit());
        }
        if ("POST".equals(method) && path.equals("/api/v1/files/upload")) {
            return new LimitRule("upload", limits.getUploadLimit());
        }
        if ("POST".equals(method) && path.equals("/api/v1/predictions")) {
            return new LimitRule("prediction-submit", limits.getPredictionSubmitLimit());
        }
        return null;
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    private record LimitRule(String name, int limit) {
    }

    private static final class Bucket {
        private final Instant windowStartedAt;
        private int count;

        private Bucket(Instant windowStartedAt, int count) {
            this.windowStartedAt = windowStartedAt;
            this.count = count;
        }
    }
}
