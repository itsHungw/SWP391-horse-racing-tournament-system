-- ===========================================================================
-- V9 — In-app notifications
-- A single recipient-scoped feed written as a side-effect of cross-role events
-- (tournament approval, referee invitation/response, entry approval, results
-- sent back…). reference_type/reference_id are a loose polymorphic pointer (no
-- FK) so any domain object can be referenced. Dialect: SQL Server.
-- ===========================================================================
create table notifications (
    id              bigint identity not null,
    recipient_id    bigint not null,
    type            varchar(50) not null,
    title           varchar(200) not null,
    body            varchar(1000),
    reference_type  varchar(50),
    reference_id    bigint,
    read_at         datetime2(7),
    created_at      datetime2(7) not null,
    primary key (id)
);

alter table notifications
    add constraint fk_notifications_recipient
    foreign key (recipient_id) references users (id);

create index ix_notifications_recipient_created
    on notifications (recipient_id, created_at desc);
