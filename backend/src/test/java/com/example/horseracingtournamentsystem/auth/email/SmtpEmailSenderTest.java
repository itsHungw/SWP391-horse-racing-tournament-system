package com.example.horseracingtournamentsystem.auth.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

class SmtpEmailSenderTest {

    @Test
    void sendEmailVerificationSendsFrontendVerificationLink() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        SmtpEmailSender sender = new SmtpEmailSender(
                mailSender,
                "no-reply@equinepro.local",
                "http://localhost:5173"
        );

        sender.sendEmailVerification("rider@example.com", "token value+1");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getFrom()).isEqualTo("no-reply@equinepro.local");
        assertThat(message.getTo()).containsExactly("rider@example.com");
        assertThat(message.getSubject()).contains("Verify");
        assertThat(message.getText())
                .contains("http://localhost:5173/verify-email?token=token%20value%2B1");
    }

    @Test
    void sendPasswordResetSendsFrontendResetLink() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        SmtpEmailSender sender = new SmtpEmailSender(
                mailSender,
                "no-reply@equinepro.local",
                "https://equinepro.example"
        );

        sender.sendPasswordReset("owner@example.com", "reset-token");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getTo()).containsExactly("owner@example.com");
        assertThat(message.getSubject()).contains("Reset");
        assertThat(message.getText()).contains("https://equinepro.example/reset-password?token=reset-token");
    }
}
