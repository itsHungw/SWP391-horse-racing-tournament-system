-- V14: Yêu cầu rút tiền (manual review).
CREATE TABLE withdrawal_requests (
    id BIGINT IDENTITY NOT NULL,
    user_id BIGINT NOT NULL,
    amount BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    bank_info VARCHAR(500) NOT NULL,
    reviewed_by BIGINT,
    review_note VARCHAR(500),
    requested_at DATETIME2(7) NOT NULL,
    reviewed_at DATETIME2(7),
    paid_at DATETIME2(7),
    PRIMARY KEY (id),
    CONSTRAINT CK_withdrawal_status CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'PAID'))
);
ALTER TABLE withdrawal_requests ADD CONSTRAINT FK_withdrawal_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE withdrawal_requests ADD CONSTRAINT FK_withdrawal_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id);
