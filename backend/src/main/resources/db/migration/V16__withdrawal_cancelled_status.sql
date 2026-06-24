-- V16: thêm trạng thái CANCELLED cho yêu cầu rút (user tự huỷ khi còn chờ duyệt).
ALTER TABLE withdrawal_requests DROP CONSTRAINT CK_withdrawal_status;
ALTER TABLE withdrawal_requests ADD CONSTRAINT CK_withdrawal_status CHECK (
    status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')
);
