package com.example.horseracingtournamentsystem.auth.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.mail", name = "enabled", havingValue = "true")
public class SmtpEmailSender implements EmailSender {

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpEmailSender(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String from
    ) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void sendEmailVerification(String email, String rawToken) {
        sendCodeEmail(
                email,
                "Verify your EquinePro Elite account",
                "Your verification code",
                "Enter this code in the verification screen to activate your tournament account.",
                "If you did not create this account, you can ignore this email.",
                rawToken
        );
    }

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        sendCodeEmail(
                email,
                "Reset your EquinePro Elite password",
                "Your password reset code",
                "Enter this code in the password reset screen to choose a new password.",
                "If you did not request a password reset, you can ignore this email.",
                rawToken
        );
    }

    private void sendCodeEmail(
            String email,
            String subject,
            String heading,
            String instructions,
            String safetyNote,
            String code
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(from);
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(
                    buildCodePlainText(heading, instructions, safetyNote, code),
                    buildCodeHtml(heading, instructions, safetyNote, code)
            );

            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new MailPreparationException("Could not prepare email message", exception);
        }
    }

    private String buildCodePlainText(String heading, String instructions, String safetyNote, String code) {
        return """
                EquinePro Elite

                %s

                %s
                %s

                This code expires in 10 minutes. %s
                """.formatted(heading, instructions, code, safetyNote);
    }

    private String buildCodeHtml(String heading, String instructions, String safetyNote, String code) {
        String safeHeading = escapeHtml(heading);
        String safeInstructions = escapeHtml(instructions);
        String safeSafetyNote = escapeHtml(safetyNote);
        String safeCode = escapeHtml(code);

        return """
                <!doctype html>
                <html lang="en">
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>EquinePro Elite</title>
                  </head>
                  <body style="margin:0;padding:0;background:#f3f5f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f3f5f4;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dde3df;border-radius:4px;overflow:hidden;">
                            <tr>
                              <td style="background:#004d3d;padding:24px 28px;color:#ffffff;">
                                <div style="font-size:12px;line-height:16px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#d4af37;">Tournament Operations</div>
                                <div style="margin-top:8px;font-size:26px;line-height:32px;font-weight:900;letter-spacing:.3px;">EquinePro Elite</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:34px 28px 28px;">
                                <h1 style="margin:0 0 14px;font-size:30px;line-height:38px;font-weight:900;color:#111827;">%s</h1>
                                <p style="margin:0 0 22px;font-size:16px;line-height:25px;color:#48544f;">%s</p>
                                <div style="display:inline-block;padding:18px 24px;background:#f5f7f6;border:1px solid #dce4df;border-radius:4px;color:#004d3d;font-size:34px;line-height:38px;font-weight:900;letter-spacing:8px;">%s</div>
                                <p style="margin:22px 0 0;font-size:13px;line-height:21px;color:#66736e;">This code expires in 10 minutes. Request a new code if it expires.</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="background:#1a1a1a;padding:22px 28px;color:#cbd5d1;">
                                <p style="margin:0;font-size:12px;line-height:19px;">%s</p>
                                <p style="margin:14px 0 0;font-size:11px;line-height:18px;color:#87928e;">This is an automated message from EquinePro Elite. Please do not reply directly to this email.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(safeHeading, safeInstructions, safeCode, safeSafetyNote);
    }

    private String escapeHtml(String value) {
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
