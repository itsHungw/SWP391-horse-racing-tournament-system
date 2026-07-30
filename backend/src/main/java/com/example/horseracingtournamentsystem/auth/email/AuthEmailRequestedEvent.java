package com.example.horseracingtournamentsystem.auth.email;

/**
 * Yêu cầu gửi một email xác thực, phát ra từ bên trong transaction của
 * {@code AuthService}.
 *
 * <p>Trước đây {@code AuthService} gọi thẳng {@link EmailSender} ngay giữa method
 * {@code @Transactional}, nghĩa là kết nối DB (và cả row lock của
 * {@code findByEmailForUpdate}) bị giữ suốt thời gian chờ I/O mạng tới SMTP server.
 * Khi SMTP treo, connection pool cạn dần và cả API chết theo, chứ không riêng gì
 * chức năng email.
 *
 * <p>Tách thành event cho phép {@link AuthEmailDispatcher} nhận nó ở giai đoạn
 * AFTER_COMMIT: transaction đóng lại trước, rồi email mới được gửi. Thứ tự này cũng
 * đảm bảo OTP đã nằm trong DB trước khi nó được gửi đi — không bao giờ có chuyện
 * user nhận được mã mà server chưa lưu.
 *
 * @param type    loại email cần gửi
 * @param email   địa chỉ người nhận
 * @param rawToken OTP dạng thô (chỉ tồn tại trong bộ nhớ; DB chỉ lưu bản hash)
 */
public record AuthEmailRequestedEvent(Type type, String email, String rawToken) {

    public enum Type {
        EMAIL_VERIFICATION,
        PASSWORD_RESET
    }

    public static AuthEmailRequestedEvent emailVerification(String email, String rawToken) {
        return new AuthEmailRequestedEvent(Type.EMAIL_VERIFICATION, email, rawToken);
    }

    public static AuthEmailRequestedEvent passwordReset(String email, String rawToken) {
        return new AuthEmailRequestedEvent(Type.PASSWORD_RESET, email, rawToken);
    }
}
