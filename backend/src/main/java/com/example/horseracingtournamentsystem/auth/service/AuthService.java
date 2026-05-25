package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.dto.request.LoginRequest;
import com.example.horseracingtournamentsystem.auth.dto.request.RegisterRequest;
import com.example.horseracingtournamentsystem.auth.dto.response.AuthResponse;
import com.example.horseracingtournamentsystem.auth.dto.response.LoginResponse;
import com.example.horseracingtournamentsystem.auth.email.EmailSender;
import com.example.horseracingtournamentsystem.auth.entity.AuthSession;
import com.example.horseracingtournamentsystem.auth.entity.EmailVerificationToken;
import com.example.horseracingtournamentsystem.auth.repository.AuthSessionRepository;
import com.example.horseracingtournamentsystem.security.JwtService;
import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuthSessionRepository authSessionRepository;
    
    private final PasswordEncoder passwordEncoder;
    private final OneTimeTokenService oneTimeTokenService;
    private final EmailSender emailSender;
    private final JwtService jwtService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.auth.refresh-token-ttl-days}")
    private long refreshTokenTtlDays;

    @Transactional
    public LoginResult login(LoginRequest request, String userAgent, String ipAddress) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("INVALID_CREDENTIALS"));

        if (User.STATUS_PENDING_EMAIL_VERIFY.equals(user.getStatus())) {
            throw new IllegalArgumentException("EMAIL_NOT_VERIFIED");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("INVALID_CREDENTIALS");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getActiveRoleNames());
        String refreshToken = createRefreshSession(user, userAgent, ipAddress);
        return new LoginResult(new LoginResponse(accessToken, user.getFullName(), user.getEmail()), refreshToken);
    }

    @Transactional
    public RefreshResult refresh(String rawRefreshToken, String userAgent, String ipAddress) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REQUIRED");
        }

        AuthSession session = authSessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(sha256(rawRefreshToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN"));
        LocalDateTime now = LocalDateTime.now();

        if (session.isExpired(now)) {
            session.revokeNow();
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED");
        }

        String nextRefreshToken = generateRefreshToken();
        AuthSession replacementSession = authSessionRepository.save(AuthSession.create(
                session.getUser(),
                sha256(nextRefreshToken),
                userAgent,
                ipAddress,
                now.plusDays(refreshTokenTtlDays)
        ));
        session.markUsedNow();
        session.replaceBy(replacementSession);

        String accessToken = jwtService.generateToken(session.getUser().getEmail(), session.getUser().getActiveRoleNames());
        return new RefreshResult(new AuthResponse(accessToken), nextRefreshToken);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        authSessionRepository.findByRefreshTokenHashAndRevokedAtIsNull(sha256(rawRefreshToken))
                .ifPresent(AuthSession::revokeNow);
    }
  
    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null) {
            if (User.STATUS_PENDING_EMAIL_VERIFY.equals(existingUser.getStatus())) {
                sendVerificationEmail(existingUser);
                return;
            }
            throw new IllegalArgumentException("EMAIL_ALREADY_EXISTS");
        }

        User user = userRepository.save(User.pending(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                normalizeOptionalPhone(request.phone())
        ));
        Role spectator = roleRepository.findByName("SPECTATOR")
                .orElseThrow(() -> new IllegalStateException("SPECTATOR_ROLE_NOT_CONFIGURED"));
        userRoleRepository.save(UserRole.active(user, spectator, null));
        sendVerificationEmail(user);
    }

    private void sendVerificationEmail(User user) {
        String rawToken = oneTimeTokenService.createEmailVerificationToken(user);
        emailSender.sendEmailVerification(user.getEmail(), rawToken);
    }

    @Transactional
    public void resendVerificationEmail(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        userRepository.findByEmail(email)
                .filter(user -> User.STATUS_PENDING_EMAIL_VERIFY.equals(user.getStatus()))
                .ifPresent(user -> {
                    String rawToken = oneTimeTokenService.createEmailVerificationToken(user);
                    emailSender.sendEmailVerification(user.getEmail(), rawToken);
                });
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        EmailVerificationToken token = oneTimeTokenService.consumeEmailVerificationToken(rawToken);
        token.getUser().verifyEmail();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptionalPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.trim();
    }

    private String createRefreshSession(User user, String userAgent, String ipAddress) {
        String refreshToken = generateRefreshToken();
        authSessionRepository.save(AuthSession.create(
                user,
                sha256(refreshToken),
                userAgent,
                ipAddress,
                LocalDateTime.now().plusDays(refreshTokenTtlDays)
        ));
        return refreshToken;
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record LoginResult(LoginResponse response, String refreshToken) {
    }

    public record RefreshResult(AuthResponse response, String refreshToken) {
    }
}
