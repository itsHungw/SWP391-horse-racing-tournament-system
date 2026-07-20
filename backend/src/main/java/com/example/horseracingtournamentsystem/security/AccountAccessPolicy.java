package com.example.horseracingtournamentsystem.security;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

@Component
public class AccountAccessPolicy {

    private static final List<String> PUBLIC_GET_PREFIXES = List.of(
            "/api/v1/horses", "/api/v1/tournaments", "/api/v1/races", "/api/v1/racing-summary",
            "/api/v1/blogs", "/api/v1/standings", "/api/v1/championships", "/api/v1/leaderboard",
            "/api/v1/wallet/vnpay", "/uploads/", "/api/v1/files/download/");

    public boolean isAllowed(UserStatus status, HttpServletRequest request) {
        if (status == UserStatus.ACTIVE) {
            return true;
        }
        String method = request.getMethod();
        String path = request.getRequestURI();
        if (status == UserStatus.SUSPENDED) {
            return isSafe(method) || isResolutionMutation(method, path);
        }
        if (status == UserStatus.BANNED) {
            return isPublicGet(method, path)
                    || path.equals("/api/v1/me/account-restriction")
                    || path.startsWith("/api/v1/wallet/me")
                    || path.startsWith("/api/v1/wallet/withdrawals")
                    || path.equals("/api/v1/auth/logout");
        }
        return false;
    }

    private boolean isSafe(String method) {
        return HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method);
    }

    private boolean isPublicGet(String method, String path) {
        return isSafe(method) && PUBLIC_GET_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private boolean isResolutionMutation(String method, String path) {
        return HttpMethod.POST.matches(method)
                && (path.equals("/api/v1/wallet/withdrawals")
                    || path.matches("/api/v1/wallet/withdrawals/\\d+/cancel")
                    || path.equals("/api/v1/auth/logout"));
    }
}
