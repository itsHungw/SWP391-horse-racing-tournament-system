package com.example.horseracingtournamentsystem.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.benmanes.caffeine.cache.Cache;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.ObjectMapper;

class RateLimitingFilterTest {

    @Test
    void forgotPasswordUsesDedicatedRateLimit() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setForgotPasswordLimit(1);
        properties.getRateLimit().setForgotPasswordWindowSeconds(900);
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstRequest = post("/api/v1/auth/forgot-password");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());
        assertThat(firstResponse.getStatus()).isEqualTo(200);

        MockHttpServletRequest secondRequest = post("/api/v1/auth/forgot-password");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());
        assertThat(secondResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void resetPasswordUsesDedicatedRateLimit() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResetPasswordLimit(1);
        properties.getRateLimit().setResetPasswordWindowSeconds(900);
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstRequest = post("/api/v1/auth/reset-password");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());
        assertThat(firstResponse.getStatus()).isEqualTo(200);

        MockHttpServletRequest secondRequest = post("/api/v1/auth/reset-password");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());
        assertThat(secondResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void verifyResetCodeUsesDedicatedRateLimit() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResetPasswordLimit(1);
        properties.getRateLimit().setResetPasswordWindowSeconds(900);
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstRequest = post("/api/v1/auth/verify-reset-code");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());
        assertThat(firstResponse.getStatus()).isEqualTo(200);

        MockHttpServletRequest secondRequest = post("/api/v1/auth/verify-reset-code");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());
        assertThat(secondResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void resendVerificationEmailUsesDedicatedRateLimit() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResendVerificationEmailLimit(1);
        properties.getRateLimit().setResendVerificationEmailWindowSeconds(300);
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstRequest = post("/api/v1/auth/resend-verification-email");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(firstRequest, firstResponse, new MockFilterChain());
        assertThat(firstResponse.getStatus()).isEqualTo(200);

        MockHttpServletRequest secondRequest = post("/api/v1/auth/resend-verification-email");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());
        assertThat(secondResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void untrustedForwardedForCannotBypassRateLimit() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResetPasswordLimit(1);
        properties.getRateLimit().setResetPasswordWindowSeconds(900);
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstRequest = post("/api/v1/auth/reset-password");
        firstRequest.addHeader("X-Forwarded-For", "198.51.100.1");
        filter.doFilter(firstRequest, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletRequest secondRequest = post("/api/v1/auth/reset-password");
        secondRequest.addHeader("X-Forwarded-For", "198.51.100.2");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondRequest, secondResponse, new MockFilterChain());

        assertThat(secondResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void trustedProxySeparatesClientsUsingForwardedFor() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResetPasswordLimit(1);
        properties.getRateLimit().setResetPasswordWindowSeconds(900);
        properties.getRateLimit().setTrustedProxies(List.of("192.0.2.10"));
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstClient = post("/api/v1/auth/reset-password");
        firstClient.addHeader("X-Forwarded-For", "198.51.100.1");
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        filter.doFilter(firstClient, firstResponse, new MockFilterChain());

        MockHttpServletRequest secondClient = post("/api/v1/auth/reset-password");
        secondClient.addHeader("X-Forwarded-For", "198.51.100.2");
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        filter.doFilter(secondClient, secondResponse, new MockFilterChain());

        MockHttpServletRequest repeatedFirstClient = post("/api/v1/auth/reset-password");
        repeatedFirstClient.addHeader("X-Forwarded-For", "198.51.100.1");
        MockHttpServletResponse repeatedResponse = new MockHttpServletResponse();
        filter.doFilter(repeatedFirstClient, repeatedResponse, new MockFilterChain());

        assertThat(firstResponse.getStatus()).isEqualTo(200);
        assertThat(secondResponse.getStatus()).isEqualTo(200);
        assertThat(repeatedResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void trustedProxyIgnoresSpoofedAddressesBeforeTheNearestUntrustedHop() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResetPasswordLimit(1);
        properties.getRateLimit().setResetPasswordWindowSeconds(900);
        properties.getRateLimit().setTrustedProxies(List.of("192.0.2.10"));
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        MockHttpServletRequest firstRequest = post("/api/v1/auth/reset-password");
        firstRequest.addHeader("X-Forwarded-For", "203.0.113.9, 198.51.100.1");
        filter.doFilter(firstRequest, new MockHttpServletResponse(), new MockFilterChain());

        MockHttpServletRequest spoofedRequest = post("/api/v1/auth/reset-password");
        spoofedRequest.addHeader("X-Forwarded-For", "203.0.113.10, 198.51.100.1");
        MockHttpServletResponse spoofedResponse = new MockHttpServletResponse();
        filter.doFilter(spoofedRequest, spoofedResponse, new MockFilterChain());

        assertThat(spoofedResponse.getStatus()).isEqualTo(429);
    }

    @Test
    void rateLimitCacheRemainsBounded() throws Exception {
        AppSecurityProperties properties = new AppSecurityProperties();
        properties.getRateLimit().setResetPasswordLimit(10);
        properties.getRateLimit().setResetPasswordWindowSeconds(900);
        properties.getRateLimit().setCacheMaximumSize(2);
        properties.getRateLimit().setCacheTtlSeconds(900);
        RateLimitingFilter filter = new RateLimitingFilter(
                properties,
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-06-16T00:00:00Z"), ZoneOffset.UTC)
        );

        for (int index = 1; index <= 3; index++) {
            MockHttpServletRequest request = post("/api/v1/auth/reset-password");
            request.setRemoteAddr("192.0.2." + index);
            filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        }

        @SuppressWarnings("unchecked")
        Cache<String, ?> buckets = (Cache<String, ?>) ReflectionTestUtils.getField(filter, "buckets");
        buckets.cleanUp();
        assertThat(buckets.estimatedSize()).isLessThanOrEqualTo(2);
    }

    private MockHttpServletRequest post(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr("192.0.2.10");
        return request;
    }
}
