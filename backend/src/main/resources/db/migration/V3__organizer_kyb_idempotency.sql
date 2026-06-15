-- ===========================================================================
-- V3 — Organizer KYB hardening
-- Hard idempotency for "1 user = 1 organization" (MVP): a filtered UNIQUE index
-- guarantees at most ONE non-deleted organization per owner, even under
-- concurrent/duplicate submits caused by network lag. Works together with the
-- resubmit-reuse logic (a REJECTED record is updated in place, never duplicated).
-- Dialect: SQL Server (filtered index uses IS NULL predicate).
-- ===========================================================================
create unique nonclustered index UX_organizations_owner_active
    on organizations (owner_user_id)
    where deleted_at is null;
