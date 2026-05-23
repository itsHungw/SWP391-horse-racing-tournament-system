package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.entity.EmailVerificationToken;
import com.example.horseracingtournamentsystem.auth.entity.PasswordResetToken;
import com.example.horseracingtournamentsystem.auth.repository.EmailVerificationTokenRepository;
import com.example.horseracingtournamentsystem.auth.repository.PasswordResetTokenRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OneTimeTokenService {

    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final TokenHashService tokenHashService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long emailOtpTtlMinutes;
    private final long passwordResetTokenTtlMinutes;

    public OneTimeTokenService(
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            TokenHashService tokenHashService,
            @Value("${app.auth.email-otp-ttl-minutes:10}") long emailOtpTtlMinutes,
            @Value("${app.auth.password-reset-token-ttl-minutes}") long passwordResetTokenTtlMinutes
    ) {
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.tokenHashService = tokenHashService;
        this.emailOtpTtlMinutes = emailOtpTtlMinutes;
        this.passwordResetTokenTtlMinutes = passwordResetTokenTtlMinutes;
    }

    @Transactional
    public String createEmailVerificationToken(User user) {
        emailVerificationTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())
                .forEach(EmailVerificationToken::markUsed);
        String rawToken = randomOtp();
        emailVerificationTokenRepository.save(EmailVerificationToken.create(
                user,
                tokenHashService.sha256(rawToken),
                LocalDateTime.now().plusMinutes(emailOtpTtlMinutes)
        ));
        return rawToken;
    }

    @Transactional
    public EmailVerificationToken consumeEmailVerificationToken(String rawToken) {
        EmailVerificationToken token = emailVerificationTokenRepository
                .findByTokenHashAndUsedAtIsNull(tokenHashService.sha256(rawToken))
                .orElseThrow(() -> new IllegalArgumentException("INVALID_EMAIL_VERIFICATION_TOKEN"));
        if (token.isExpired(LocalDateTime.now())) {
            throw new IllegalArgumentException("EXPIRED_EMAIL_VERIFICATION_TOKEN");
        }
        token.markUsed();
        return token;
    }

    @Transactional
    public String createPasswordResetToken(User user) {
        String rawToken = randomToken();
        passwordResetTokenRepository.save(PasswordResetToken.create(
                user,
                tokenHashService.sha256(rawToken),
                LocalDateTime.now().plusMinutes(passwordResetTokenTtlMinutes)
        ));
        return rawToken;
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String randomOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}
