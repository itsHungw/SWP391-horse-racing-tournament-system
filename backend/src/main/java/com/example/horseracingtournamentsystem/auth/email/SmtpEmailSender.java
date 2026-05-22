package com.example.horseracingtournamentsystem.auth.email;

import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

@Component
@ConditionalOnProperty(prefix = "app.mail", name = "enabled", havingValue = "true")
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final String from;
    private final String frontendBaseUrl;

    public SmtpEmailSender(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String from,
            @Value("${app.frontend-base-url}") String frontendBaseUrl
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    public void sendEmailVerification(String email, String rawToken) {
        String verificationUrl = buildFrontendUrl("/verify-email", rawToken);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Verify your EquinePro Elite account");
        message.setText("""
                Welcome to EquinePro Elite.

                Please verify your email address by opening this link:
                %s

                This link will expire soon. If you did not create this account, you can ignore this email.
                """.formatted(verificationUrl));

        mailSender.send(message);
    }

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        String resetUrl = buildFrontendUrl("/reset-password", rawToken);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Reset your EquinePro Elite password");
        message.setText("""
                We received a request to reset your EquinePro Elite password.

                Open this link to choose a new password:
                %s

                If you did not request this, you can ignore this email.
                """.formatted(resetUrl));

        mailSender.send(message);
    }

    private String buildFrontendUrl(String path, String rawToken) {
        String frontendPath = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path(path)
                .build()
                .toUriString();
        String encodedToken = UriUtils.encodeQueryParam(rawToken, StandardCharsets.UTF_8)
                .replace("+", "%2B");
        return frontendPath + "?token=" + encodedToken;
    }
}
