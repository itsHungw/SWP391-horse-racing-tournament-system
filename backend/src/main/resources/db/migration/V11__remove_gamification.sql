-- V11: Gỡ gamification điểm — admin point settings, blog reading reward, first-login bonus.
-- Ví tiền thật chỉ còn nạp/cược/thưởng-cược/điều-chỉnh-admin. Đọc blog vẫn còn (chỉ bỏ thưởng).
-- Dọn bút toán cũ của các loại sắp bị bỏ TRƯỚC khi V12 siết lại CHECK transaction_type.

DELETE FROM point_transactions WHERE transaction_type IN ('BLOG_REWARD', 'FIRST_LOGIN_BONUS');

-- Các bảng đều là leaf (chỉ có FK trỏ RA users/blogs) nên DROP trực tiếp được.
DROP TABLE user_blog_rewards;
DROP TABLE user_daily_point_limits;
DROP TABLE point_settings;
