package com.example.horseracingtournamentsystem.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

public class RateLimitingFilter extends OncePerRequestFilter {

    private final AppSecurityProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final Cache<String, Bucket> buckets;

    public RateLimitingFilter(AppSecurityProperties properties, ObjectMapper objectMapper) {
        this(properties, objectMapper, Clock.systemUTC());
    }

    RateLimitingFilter(AppSecurityProperties properties, ObjectMapper objectMapper, Clock clock) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
        AppSecurityProperties.RateLimit limits = properties.getRateLimit();
        long longestWindow = Math.max(
                limits.getWindowSeconds(),
                Math.max(limits.getForgotPasswordWindowSeconds(), limits.getResetPasswordWindowSeconds())
        );
        if (limits.getCacheTtlSeconds() < longestWindow) {
            throw new IllegalArgumentException("Rate-limit cache TTL must cover every rule window");
        }
        this.buckets = Caffeine.newBuilder()
                .maximumSize(Math.max(1, limits.getCacheMaximumSize()))
                .expireAfterWrite(Duration.ofSeconds(Math.max(1, limits.getCacheTtlSeconds())))
                .build();
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
        boolean[] limited = {false};
        buckets.asMap().compute(key, (ignored, existing) -> {
            Bucket bucket = refresh(existing, rule.windowSeconds);
            if (bucket.count >= rule.limit) {
                limited[0] = true;
                return bucket;
            }
            bucket.count++;
            return bucket;
        });
        if (limited[0]) {
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

        filterChain.doFilter(request, response);
    }

    private Bucket refresh(Bucket existing, long ruleWindowSeconds) {
        Instant now = clock.instant();
        long windowSeconds = Math.max(1, ruleWindowSeconds);
        if (existing == null || !now.isBefore(existing.windowStartedAt.plusSeconds(windowSeconds))) {
            return new Bucket(now, 0);
        }
        return existing;
    }

    private LimitRule resolveRule(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        AppSecurityProperties.RateLimit limits = properties.getRateLimit();
        if ("POST".equals(method) && path.equals("/api/v1/auth/login")) {
            return new LimitRule("login", limits.getLoginLimit(), limits.getWindowSeconds());
        }
        if ("POST".equals(method) && path.equals("/api/v1/auth/forgot-password")) {
            return new LimitRule("forgot-password", limits.getForgotPasswordLimit(), limits.getForgotPasswordWindowSeconds());
        }
        if ("POST".equals(method) && (path.equals("/api/v1/auth/reset-password")
                || path.equals("/api/v1/auth/verify-reset-code"))) {
            return new LimitRule("reset-password", limits.getResetPasswordLimit(), limits.getResetPasswordWindowSeconds());
        }
        if ("POST".equals(method) && path.equals("/api/v1/files/upload")) {
            return new LimitRule("upload", limits.getUploadLimit(), limits.getWindowSeconds());
        }
        if ("POST".equals(method) && path.equals("/api/v1/predictions")) {
            return new LimitRule("prediction-submit", limits.getPredictionSubmitLimit(), limits.getWindowSeconds());
        }
        return null;
    }

    private String clientKey(HttpServletRequest request) {
        String remoteAddress = normalizeIpAddress(request.getRemoteAddr());
        if (remoteAddress == null) {
            remoteAddress = "unknown";
        }

        if (!isTrustedProxy(remoteAddress)) {
            return remoteAddress;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return remoteAddress;
        }
        String resolvedAddress = remoteAddress;
        String[] forwardedChain = forwardedFor.split(",");
        for (int index = forwardedChain.length - 1; index >= 0; index--) {
            if (!isTrustedProxy(resolvedAddress)) {
                return resolvedAddress;
            }
            String forwardedAddress = normalizeIpAddress(forwardedChain[index].trim());
            if (forwardedAddress == null) {
                return remoteAddress;
            }
            resolvedAddress = forwardedAddress;
        }
        return resolvedAddress;
    }

    private boolean isTrustedProxy(String remoteAddress) {
        return properties.getRateLimit().getTrustedProxies().stream()
                .map(this::normalizeIpAddress)
                .anyMatch(remoteAddress::equals);
    }

    private String normalizeIpAddress(String candidate) {
        if (candidate == null || candidate.isBlank() || !candidate.matches("[0-9a-fA-F:.]+")) {
            return null;
        }
        try {
            return InetAddress.getByName(candidate).getHostAddress();
        } catch (UnknownHostException ignored) {
            return null;
        }
    }

    private record LimitRule(String name, int limit, long windowSeconds) {
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
