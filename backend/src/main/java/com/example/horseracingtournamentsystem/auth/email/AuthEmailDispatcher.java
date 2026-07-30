package com.example.horseracingtournamentsystem.auth.email;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Gửi email xác thực SAU khi transaction đã commit, trên thread nền.
 *
 * <p>Hai annotation dưới đây giải quyết hai vấn đề khác nhau, cần cả hai:
 *
 * <ul>
 *   <li>{@code @TransactionalEventListener(AFTER_COMMIT)} — chờ transaction đóng
 *       xong mới chạy. Nhờ vậy method {@code @Transactional} của
 *       {@code AuthService} không còn giữ connection DB trong lúc chờ SMTP.
 *   <li>{@code @Async} — chạy trên thread nền, để thread xử lý HTTP request trả
 *       response về cho user ngay, không phải đợi SMTP server phản hồi.
 * </ul>
 *
 * <p>{@code fallbackExecution = true}: nếu event được phát ra ngoài transaction thì
 * vẫn gửi bình thường. Không có cờ này, Spring sẽ âm thầm bỏ qua event — một cái
 * bẫy rất khó phát hiện khi sau này có ai gọi từ chỗ không có {@code @Transactional}.
 *
 * <p>Đánh đổi cần biết: email giờ là "best effort". Trước đây SMTP lỗi thì cả
 * transaction đăng ký rollback; giờ user được tạo thành công và lỗi gửi mail chỉ
 * được ghi log. Đây là chủ ý — user đã đăng ký xong không nên bị xoá chỉ vì
 * mail server tạm thời hỏng, họ luôn có thể bấm "gửi lại mã".
 */
@Component
@RequiredArgsConstructor
public class AuthEmailDispatcher {

    private static final Logger logger = LoggerFactory.getLogger(AuthEmailDispatcher.class);

    private final EmailSender emailSender;

    @Async("mailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAuthEmailRequested(AuthEmailRequestedEvent event) {
        try {
            switch (event.type()) {
                case EMAIL_VERIFICATION -> emailSender.sendEmailVerification(event.email(), event.rawToken());
                case PASSWORD_RESET -> emailSender.sendPasswordReset(event.email(), event.rawToken());
            }
        } catch (RuntimeException exception) {
            // Chạy trên thread nền nên không có ai bắt exception hộ: không log ở đây
            // là lỗi biến mất không dấu vết. Tuyệt đối không log rawToken — đó là OTP.
            logger.error("Failed to send {} email to {}", event.type(), event.email(), exception);
        }
    }
}
