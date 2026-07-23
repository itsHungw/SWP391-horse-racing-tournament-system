UPDATE withdrawal_requests
SET transfer_reference = UPPER(TRIM(transfer_reference))
WHERE transfer_reference IS NOT NULL;

ALTER TABLE withdrawal_requests
    ADD COLUMN payment_evidence_unique_enforced BOOLEAN NOT NULL DEFAULT TRUE;

-- Historical/manual payouts may legitimately contain reused evidence. Preserve those
-- records for audit, quarantine them from the new index, and enforce uniqueness for
-- every clean legacy row and every new payout (the column defaults to TRUE).
WITH duplicate_evidence AS (
    SELECT id
    FROM (
        SELECT id,
               COUNT(*) OVER (PARTITION BY UPPER(transfer_reference)) AS evidence_count
        FROM withdrawal_requests
        WHERE transfer_reference IS NOT NULL
    ) transfer_duplicates
    WHERE evidence_count > 1

    UNION

    SELECT id
    FROM (
        SELECT id,
               COUNT(*) OVER (PARTITION BY payment_receipt_checksum) AS evidence_count
        FROM withdrawal_requests
        WHERE payment_receipt_checksum IS NOT NULL
    ) receipt_duplicates
    WHERE evidence_count > 1
)
UPDATE withdrawal_requests
SET payment_evidence_unique_enforced = FALSE
WHERE id IN (SELECT id FROM duplicate_evidence);

CREATE UNIQUE INDEX ux_withdrawal_transfer_reference
    ON withdrawal_requests (UPPER(transfer_reference))
    WHERE transfer_reference IS NOT NULL
      AND payment_evidence_unique_enforced;

CREATE UNIQUE INDEX ux_withdrawal_receipt_checksum
    ON withdrawal_requests (payment_receipt_checksum)
    WHERE payment_receipt_checksum IS NOT NULL
      AND payment_evidence_unique_enforced;

ALTER TABLE withdrawal_export_audits
    ADD COLUMN payment_queue_rows INTEGER NOT NULL DEFAULT 0;
