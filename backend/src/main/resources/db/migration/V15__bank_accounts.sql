-- V15: Tài khoản ngân hàng đã lưu của user (saved payout methods) — tái dùng khi rút tiền.
CREATE TABLE bank_accounts (
    id BIGINT IDENTITY NOT NULL,
    user_id BIGINT NOT NULL,
    bank_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(40) NOT NULL,
    account_holder VARCHAR(150) NOT NULL,
    label VARCHAR(80),
    created_at DATETIME2(7) NOT NULL,
    PRIMARY KEY (id)
);
ALTER TABLE bank_accounts ADD CONSTRAINT FK_bank_account_user FOREIGN KEY (user_id) REFERENCES users(id);
