IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'resume_url') IS NULL
BEGIN
    ALTER TABLE dbo.role_requests ADD resume_url nvarchar(500) NULL
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'evidence_url') IS NOT NULL
BEGIN
    EXEC(N'UPDATE dbo.role_requests SET resume_url = evidence_url WHERE resume_url IS NULL AND evidence_url IS NOT NULL')
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'cv_review_status') IS NULL
BEGIN
    ALTER TABLE dbo.role_requests ADD cv_review_status nvarchar(30) NOT NULL CONSTRAINT DF_role_requests_cv_review_status DEFAULT N'NOT_REVIEWED'
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'cv_review_note') IS NULL
BEGIN
    ALTER TABLE dbo.role_requests ADD cv_review_note nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'cv_reviewed_by') IS NULL
BEGIN
    ALTER TABLE dbo.role_requests ADD cv_reviewed_by bigint NULL
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'cv_reviewed_at') IS NULL
BEGIN
    ALTER TABLE dbo.role_requests ADD cv_reviewed_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.role_requests', N'cv_review_status') IS NOT NULL
BEGIN
    EXEC(N'UPDATE dbo.role_requests SET cv_review_status = N''NOT_REVIEWED'' WHERE cv_review_status IS NULL')
END;

IF OBJECT_ID(N'dbo.role_requests', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.role_requests', N'cv_reviewed_by') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_role_requests_cv_reviewed_by'
         AND parent_object_id = OBJECT_ID(N'dbo.role_requests')
   )
BEGIN
    ALTER TABLE dbo.role_requests
    ADD CONSTRAINT FK_role_requests_cv_reviewed_by
    FOREIGN KEY (cv_reviewed_by) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'image_url') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD image_url nvarchar(500) NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'evidence_url') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD evidence_url nvarchar(500) NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'medical_note') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD medical_note nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'height_cm') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD height_cm int NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'weight_kg') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD weight_kg int NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'health_status') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD health_status nvarchar(50) NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'description') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD description nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'rejection_reason') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD rejection_reason nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'approved_by') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD approved_by bigint NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horses', N'approved_at') IS NULL
BEGIN
    ALTER TABLE dbo.horses ADD approved_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.horses', N'approved_by') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_horses_approved_by'
         AND parent_object_id = OBJECT_ID(N'dbo.horses')
   )
BEGIN
    ALTER TABLE dbo.horses
    ADD CONSTRAINT FK_horses_approved_by
    FOREIGN KEY (approved_by) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tournament_registrations (
        id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        tournament_id bigint NOT NULL,
        horse_id bigint NOT NULL,
        owner_id bigint NOT NULL,
        status nvarchar(30) NOT NULL,
        note nvarchar(max) NULL,
        rejection_reason nvarchar(max) NULL,
        reviewed_by bigint NULL,
        reviewed_at datetime2 NULL,
        created_at datetime2 NOT NULL,
        updated_at datetime2 NULL,
        withdrawn_at datetime2 NULL
    )
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_registrations_tournament'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_registrations')
   )
BEGIN
    ALTER TABLE dbo.tournament_registrations
    ADD CONSTRAINT FK_tournament_registrations_tournament
    FOREIGN KEY (tournament_id) REFERENCES dbo.tournaments(id)
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_registrations_horse'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_registrations')
   )
BEGIN
    ALTER TABLE dbo.tournament_registrations
    ADD CONSTRAINT FK_tournament_registrations_horse
    FOREIGN KEY (horse_id) REFERENCES dbo.horses(id)
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_registrations_owner'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_registrations')
   )
BEGIN
    ALTER TABLE dbo.tournament_registrations
    ADD CONSTRAINT FK_tournament_registrations_owner
    FOREIGN KEY (owner_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_registrations_reviewed_by'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_registrations')
   )
BEGIN
    ALTER TABLE dbo.tournament_registrations
    ADD CONSTRAINT FK_tournament_registrations_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES dbo.users(id)
END;
