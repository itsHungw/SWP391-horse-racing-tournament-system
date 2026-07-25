ALTER TABLE withdrawal_requests
    ADD COLUMN transfer_reference_unique_enforced BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE withdrawal_requests
    ADD COLUMN receipt_checksum_unique_enforced BOOLEAN NOT NULL DEFAULT TRUE;

-- Keep one canonical historical row for each evidence value inside its unique
-- index. Only additional legacy duplicates are quarantined; all future rows use
-- the TRUE defaults and therefore remain protected by both indexes.
WITH duplicate_transfer_references AS (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY UPPER(transfer_reference)
                   ORDER BY id
               ) AS evidence_rank
        FROM withdrawal_requests
        WHERE transfer_reference IS NOT NULL
    ) transfer_duplicates
    WHERE evidence_rank > 1
)
UPDATE withdrawal_requests
SET transfer_reference_unique_enforced = FALSE
WHERE id IN (SELECT id FROM duplicate_transfer_references);

WITH duplicate_receipt_checksums AS (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY payment_receipt_checksum
                   ORDER BY id
               ) AS evidence_rank
        FROM withdrawal_requests
        WHERE payment_receipt_checksum IS NOT NULL
    ) receipt_duplicates
    WHERE evidence_rank > 1
)
UPDATE withdrawal_requests
SET receipt_checksum_unique_enforced = FALSE
WHERE id IN (SELECT id FROM duplicate_receipt_checksums);

DROP INDEX ux_withdrawal_transfer_reference;
DROP INDEX ux_withdrawal_receipt_checksum;

CREATE UNIQUE INDEX ux_withdrawal_transfer_reference
    ON withdrawal_requests (UPPER(transfer_reference))
    WHERE transfer_reference IS NOT NULL
      AND transfer_reference_unique_enforced;

CREATE UNIQUE INDEX ux_withdrawal_receipt_checksum
    ON withdrawal_requests (payment_receipt_checksum)
    WHERE payment_receipt_checksum IS NOT NULL
      AND receipt_checksum_unique_enforced;

ALTER TABLE withdrawal_requests
    DROP COLUMN payment_evidence_unique_enforced;
