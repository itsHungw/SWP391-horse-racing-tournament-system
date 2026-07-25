CREATE UNIQUE INDEX uq_disputes_account_enforcement_decision
    ON disputes (requester_id, reference_type, reference_id)
    WHERE reference_type = 'ACCOUNT_ENFORCEMENT';
