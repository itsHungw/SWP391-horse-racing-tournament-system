-- V39: Lưu thêm dữ liệu thanh toán VNPay trả về, để user xem lại chi tiết giao dịch.
-- Cả bốn cột đều nullable: đơn nạp trước thay đổi này không có dữ liệu, và khi VNPay
-- trả về giá trị không parse được thì ghi null — một field chỉ để hiển thị không bao
-- giờ được phép làm hỏng việc ghi-có ví.
ALTER TABLE topup_orders ADD COLUMN vnpay_bank_code VARCHAR(20);
ALTER TABLE topup_orders ADD COLUMN vnpay_bank_tran_no VARCHAR(50);
ALTER TABLE topup_orders ADD COLUMN vnpay_card_type VARCHAR(20);
ALTER TABLE topup_orders ADD COLUMN vnpay_pay_date TIMESTAMP;
