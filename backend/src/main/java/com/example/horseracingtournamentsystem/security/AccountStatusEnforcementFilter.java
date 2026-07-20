package com.example.horseracingtournamentsystem.security;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class AccountStatusEnforcementFilter extends OncePerRequestFilter {

    private final AccountAccessPolicy accessPolicy;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AccountAwareUserDetails principal) {
            UserStatus status = principal.accountStatus();
            if (!accessPolicy.isAllowed(status, request)) {
                String code = status == UserStatus.SUSPENDED ? "ACCOUNT_SUSPENDED" : "ACCOUNT_BANNED";
                String message = status == UserStatus.SUSPENDED
                        ? "This account is under review. Business changes are temporarily disabled."
                        : "This account is restricted. Only account and financial resolution actions are available.";
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
