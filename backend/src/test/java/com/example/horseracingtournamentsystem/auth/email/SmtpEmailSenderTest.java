package com.example.horseracingtournamentsystem.auth.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;

class SmtpEmailSenderTest {

    @Test
    void sendEmailVerificationSendsBrandedHtmlEmailWithSixDigitCode() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = configuredMimeMessage(mailSender);
        SmtpEmailSender sender = new SmtpEmailSender(
                mailSender,
                "no-reply@equinepro.local",
                "http://localhost:5173"
        );

        sender.sendEmailVerification("rider@example.com", "483921");

        verify(mailSender).send(message);

        String body = extractBody(message);
        assertThat(message.getFrom()[0].toString()).isEqualTo("no-reply@equinepro.local");
        assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("rider@example.com");
        assertThat(message.getSubject()).contains("Verify");
        assertThat(body)
                .contains("EquinePro Elite")
                .contains("Your verification code")
                .contains("background:#004d3d")
                .contains("483921")
                .contains("Enter this code in the verification screen");
    }

    @Test
    void sendPasswordResetSendsBrandedHtmlEmailWithFrontendResetLink() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = configuredMimeMessage(mailSender);
        SmtpEmailSender sender = new SmtpEmailSender(
                mailSender,
                "no-reply@equinepro.local",
                "https://equinepro.example"
        );

        sender.sendPasswordReset("owner@example.com", "reset-token");

        verify(mailSender).send(message);

        String body = extractBody(message);
        assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("owner@example.com");
        assertThat(message.getSubject()).contains("Reset");
        assertThat(body)
                .contains("EquinePro Elite")
                .contains("Reset your password")
                .contains("Reset Password")
                .contains("https://equinepro.example/reset-password?token=reset-token");
    }

    private MimeMessage configuredMimeMessage(JavaMailSender mailSender) {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);
        return message;
    }

    private String extractBody(Part part) throws Exception {
        Object content = part.getContent();
        if (content instanceof String text) {
            return text;
        }
        if (content instanceof Multipart multipart) {
            StringBuilder body = new StringBuilder();
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                body.append(extractBody(bodyPart));
            }
            return body.toString();
        }
        return "";
    }
}
