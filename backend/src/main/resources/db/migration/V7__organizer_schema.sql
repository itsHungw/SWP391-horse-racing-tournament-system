-- ===========================================================================
-- V7 — Organizer (Ban tổ chức) schema
-- Feature: B2B2C platform moderation. See docs/ba/2026-06-14-organizer-role-ba.md
-- and docs/db/2026-06-14-db-normalization-and-organizer-schema.md
-- Dialect: SQL Server. Forward-only; runs AFTER the prediction/enum migrations (V2–V6).
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------
create table organizations (
    id               bigint identity not null,
    owner_user_id    bigint not null,
    approved_by      bigint,
    created_at       datetime2(7) not null,
    updated_at       datetime2(7),
    approved_at      datetime2(7),
    deleted_at       datetime2(7),
    status           varchar(30) not null
        check (status in ('PENDING','ACTIVE','SUSPENDED','REJECTED')),
    code             varchar(100) not null,
    name             varchar(200) not null,
    license_number   varchar(100),
    contact_email    varchar(150),
    contact_phone    varchar(30),
    logo_url         varchar(500),
    evidence_url     varchar(500),
    description      varchar(500),
    application_note varchar(max),
    rejection_reason varchar(255),
    primary key (id)
);

create table referee_contracts (
    id             bigint identity not null,
    tournament_id  bigint not null,
    referee_id     bigint not null,
    invited_by     bigint not null,
    terminated_by  bigint,
    created_at     datetime2(7) not null,
    updated_at     datetime2(7),
    responded_at   datetime2(7),
    terminated_at  datetime2(7),
    status         varchar(30) not null
        check (status in ('PENDING','ACTIVE','DECLINED','TERMINATED')),
    agreement_url  varchar(500),
    reason         varchar(500),
    primary key (id)
);

-- ---------------------------------------------------------------------------
-- Unique constraints + foreign keys
-- ---------------------------------------------------------------------------
alter table organizations add constraint UK_organizations_code unique (code);
alter table organizations add constraint FK_org_owner       foreign key (owner_user_id) references users;
alter table organizations add constraint FK_org_approved_by foreign key (approved_by)   references users;

alter table referee_contracts add constraint UK_referee_contract unique (tournament_id, referee_id);
alter table referee_contracts add constraint FK_rc_tournament  foreign key (tournament_id) references tournaments;
alter table referee_contracts add constraint FK_rc_referee     foreign key (referee_id)    references users;
alter table referee_contracts add constraint FK_rc_invited_by  foreign key (invited_by)    references users;
alter table referee_contracts add constraint FK_rc_terminated_by foreign key (terminated_by) references users;

-- ---------------------------------------------------------------------------
-- Alter existing tables
-- ---------------------------------------------------------------------------
-- Tournament now belongs to an organization + carries the Cổng 2 approval audit.
-- organization_id stays NULLABLE for now (backfilled below); app enforces it on new tournaments.
alter table tournaments add organization_id  bigint;
alter table tournaments add approved_by       bigint;
alter table tournaments add approved_at       datetime2(7);
alter table tournaments add rejection_reason  varchar(255);
alter table tournaments add constraint FK_tournament_org         foreign key (organization_id) references organizations;
alter table tournaments add constraint FK_tournament_approved_by foreign key (approved_by)      references users;

-- Allow account suspension (BR-10/BR-13). WITH NOCHECK so any pre-existing
-- legacy status value cannot break the migration; only new writes are validated.
-- Values MUST match the UserStatus enum (incl. INACTIVE/BANNED from the prediction/enum model).
alter table users with nocheck add constraint CK_users_status
    check (status in ('ACTIVE','PENDING_EMAIL_VERIFY','SUSPENDED','INACTIVE','BANNED'));

-- ---------------------------------------------------------------------------
-- Reference seed: ORGANIZER role
-- ---------------------------------------------------------------------------
insert into roles (name, description)
select 'ORGANIZER', 'Organizer'
where not exists (select 1 from roles r where r.name = 'ORGANIZER');

-- ---------------------------------------------------------------------------
-- Backfill: attach legacy tournaments to a default "Platform Organization".
-- Idempotent + safe across environments (no-op if there is no ADMIN user).
-- Wrapped in EXEC so the newly-added organization_id column resolves at run time.
-- ---------------------------------------------------------------------------
EXEC('
DECLARE @adminId bigint = (
    SELECT TOP 1 u.id FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = ''ADMIN'' AND ur.status = ''ACTIVE''
    ORDER BY u.id
);
IF @adminId IS NOT NULL AND EXISTS (SELECT 1 FROM tournaments WHERE organization_id IS NULL)
BEGIN
    DECLARE @orgId bigint = (SELECT TOP 1 id FROM organizations WHERE code = ''PLATFORM_DEFAULT'');
    IF @orgId IS NULL
    BEGIN
        INSERT INTO organizations (owner_user_id, approved_by, created_at, approved_at, status, code, name, description)
        VALUES (@adminId, @adminId, SYSUTCDATETIME(), SYSUTCDATETIME(), ''ACTIVE'', ''PLATFORM_DEFAULT'',
                ''Platform Organization'', ''Auto-created for tournaments that predate the organizer feature.'');
        SET @orgId = SCOPE_IDENTITY();
    END
    UPDATE tournaments SET organization_id = @orgId WHERE organization_id IS NULL;
END
');
