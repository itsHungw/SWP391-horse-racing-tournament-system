package com.example.horseracingtournamentsystem.auth.service;

import com.example.horseracingtournamentsystem.auth.entity.EmailVerificationToken;
import com.example.horseracingtournamentsystem.auth.entity.PasswordResetToken;
import com.example.horseracingtournamentsystem.auth.exception.PasswordResetRejectedException;
import com.example.horseracingtournamentsystem.auth.repository.EmailVerificationTokenRepository;
import com.example.horseracingtournamentsystem.auth.repository.PasswordResetTokenRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
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
        passwordResetTokenRepository.findByUserIdAndUsedAtIsNull(user.getId())
                .forEach(PasswordResetToken::markUsed);
        String rawToken = randomOtp();
        passwordResetTokenRepository.save(PasswordResetToken.create(
                user,
                tokenHashService.sha256(rawToken),
                LocalDateTime.now().plusMinutes(passwordResetTokenTtlMinutes)
        ));
        return rawToken;
    }

    @Transactional(noRollbackFor = PasswordResetRejectedException.class)
    public PasswordResetToken consumePasswordResetToken(User user, String rawToken) {
        PasswordResetToken token = verifyPasswordResetToken(user, rawToken);
        token.markUsed();
        return token;
    }

    @Transactional(noRollbackFor = PasswordResetRejectedException.class)
    public PasswordResetToken verifyPasswordResetToken(User user, String rawToken) {
        String tokenHash = tokenHashService.sha256(rawToken);
        var matchingToken = passwordResetTokenRepository.findActiveMatchingForUpdate(user.getId(), tokenHash);
        if (matchingToken.isEmpty()) {
            registerFailedPasswordResetAttempt(user);
            throw new PasswordResetRejectedException("INVALID_PASSWORD_RESET_TOKEN");
        }

        PasswordResetToken token = matchingToken.get();
        if (token.isExpired(LocalDateTime.now())) {
            throw new PasswordResetRejectedException("EXPIRED_PASSWORD_RESET_TOKEN");
        }
        if (token.isLocked()) {
            throw new PasswordResetRejectedException("LOCKED_PASSWORD_RESET_TOKEN");
        }
        return token;
    }

    private void registerFailedPasswordResetAttempt(User user) {
        passwordResetTokenRepository.findActiveForUpdate(user.getId(), PageRequest.of(0, 1)).stream()
                .findFirst()
                .filter(token -> !token.isExpired(LocalDateTime.now()))
                .filter(token -> !token.isLocked())
                .ifPresent(token -> {
                    token.incrementFailedAttempts();
                    if (token.getFailedAttempts() >= 5) {
                        token.lockNow();
                    }
                });
    }

    private String randomOtp() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }
}
