ALTER TABLE withdrawal_requests ADD COLUMN transfer_reference VARCHAR(120) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN payment_receipt_filename VARCHAR(120) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN payment_receipt_checksum VARCHAR(64) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN payment_idempotency_key VARCHAR(36) NULL;

ALTER TABLE withdrawal_requests
    ADD CONSTRAINT uk_withdrawal_payment_idempotency UNIQUE (payment_idempotency_key);
ALTER TABLE withdrawal_requests
    ADD CONSTRAINT fk_withdrawal_payment_receipt
    FOREIGN KEY (payment_receipt_filename) REFERENCES stored_files(filename);
