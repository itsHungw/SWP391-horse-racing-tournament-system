package com.example.horseracingtournamentsystem.auth.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class LoggingEmailSender implements EmailSender {

    private static final Logger logger = LoggerFactory.getLogger(LoggingEmailSender.class);

    @Override
    public void sendEmailVerification(String email, String rawToken) {
        logger.info("Email verification token issued for {}: {}", email, rawToken);
    }

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        logger.info("Password reset token issued for {}: {}", email, rawToken);
    }
}
