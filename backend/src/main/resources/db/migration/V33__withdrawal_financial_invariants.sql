UPDATE withdrawal_requests
SET transfer_reference = UPPER(TRIM(transfer_reference))
WHERE transfer_reference IS NOT NULL;

CREATE UNIQUE INDEX ux_withdrawal_transfer_reference
    ON withdrawal_requests (UPPER(transfer_reference))
    WHERE transfer_reference IS NOT NULL;

CREATE UNIQUE INDEX ux_withdrawal_receipt_checksum
    ON withdrawal_requests (payment_receipt_checksum)
    WHERE payment_receipt_checksum IS NOT NULL;

ALTER TABLE withdrawal_export_audits
    ADD COLUMN payment_queue_rows INTEGER NOT NULL DEFAULT 0;
