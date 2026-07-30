package com.example.horseracingtournamentsystem.auth.email;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;

class AuthEmailDispatcherTest {

    @Test
    void routesVerificationEventToVerificationEmail() {
        EmailSender emailSender = mock(EmailSender.class);
        AuthEmailDispatcher dispatcher = new AuthEmailDispatcher(emailSender);

        dispatcher.onAuthEmailRequested(
                AuthEmailRequestedEvent.emailVerification("rider@example.com", "483921"));

        verify(emailSender).sendEmailVerification("rider@example.com", "483921");
        verifyNoMoreInteractions(emailSender);
    }

    @Test
    void routesPasswordResetEventToPasswordResetEmail() {
        EmailSender emailSender = mock(EmailSender.class);
        AuthEmailDispatcher dispatcher = new AuthEmailDispatcher(emailSender);

        dispatcher.onAuthEmailRequested(
                AuthEmailRequestedEvent.passwordReset("owner@example.com", "928174"));

        verify(emailSender).sendPasswordReset("owner@example.com", "928174");
        verifyNoMoreInteractions(emailSender);
    }

    /**
     * Chạy trên thread nền nên không ai bắt exception hộ. Nếu dispatcher để lỗi
     * thoát ra, nó chỉ chết âm thầm trong executor — phải nuốt và log.
     */
    @Test
    void swallowsSmtpFailureInsteadOfPropagating() {
        EmailSender emailSender = mock(EmailSender.class);
        doThrow(new MailSendException("SMTP unreachable"))
                .when(emailSender).sendEmailVerification("rider@example.com", "483921");
        AuthEmailDispatcher dispatcher = new AuthEmailDispatcher(emailSender);

        assertThatCode(() -> dispatcher.onAuthEmailRequested(
                AuthEmailRequestedEvent.emailVerification("rider@example.com", "483921")))
                .doesNotThrowAnyException();
    }
}
