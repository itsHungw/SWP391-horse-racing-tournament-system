-- ===========================================================================
-- V8 — Organizer KYB hardening
-- Hard idempotency for "1 user = 1 organization" (MVP): a partial UNIQUE index
-- guarantees at most ONE non-deleted organization per owner, even under
-- concurrent/duplicate submits caused by network lag. Works together with the
-- resubmit-reuse logic (a REJECTED record is updated in place, never duplicated).
-- Dialect: PostgreSQL (partial index uses the IS NULL predicate).
-- ===========================================================================
create unique index UX_organizations_owner_active
    on organizations (owner_user_id)
    where deleted_at is null;
