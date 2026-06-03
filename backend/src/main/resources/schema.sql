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

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.horse_documents (
        id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        horse_id bigint NOT NULL,
        uploaded_by bigint NOT NULL,
        document_type nvarchar(50) NOT NULL,
        reference_number nvarchar(100) NOT NULL,
        issue_date date NOT NULL,
        expiry_date date NOT NULL,
        issuer nvarchar(150) NOT NULL,
        file_url nvarchar(500) NOT NULL,
        notes nvarchar(max) NULL,
        created_at datetime2 NOT NULL
    )
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'horse_id') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD horse_id bigint NULL
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'uploaded_by') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD uploaded_by bigint NULL
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'document_type') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD document_type nvarchar(50) NOT NULL CONSTRAINT DF_horse_documents_document_type DEFAULT N'OTHER'
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'reference_number') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD reference_number nvarchar(100) NOT NULL CONSTRAINT DF_horse_documents_reference_number DEFAULT N'N/A'
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'issue_date') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD issue_date date NOT NULL CONSTRAINT DF_horse_documents_issue_date DEFAULT CONVERT(date, SYSUTCDATETIME())
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'expiry_date') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD expiry_date date NOT NULL CONSTRAINT DF_horse_documents_expiry_date DEFAULT CONVERT(date, SYSUTCDATETIME())
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'issuer') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD issuer nvarchar(150) NOT NULL CONSTRAINT DF_horse_documents_issuer DEFAULT N'Unknown'
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'file_url') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD file_url nvarchar(500) NOT NULL CONSTRAINT DF_horse_documents_file_url DEFAULT N''
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'notes') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD notes nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.horse_documents', N'created_at') IS NULL
BEGIN
    ALTER TABLE dbo.horse_documents ADD created_at datetime2 NOT NULL CONSTRAINT DF_horse_documents_created_at DEFAULT SYSUTCDATETIME()
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.horse_documents', N'horse_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_horse_documents_horse'
         AND parent_object_id = OBJECT_ID(N'dbo.horse_documents')
   )
BEGIN
    ALTER TABLE dbo.horse_documents
    ADD CONSTRAINT FK_horse_documents_horse
    FOREIGN KEY (horse_id) REFERENCES dbo.horses(id)
END;

IF OBJECT_ID(N'dbo.horse_documents', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.horse_documents', N'uploaded_by') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_horse_documents_uploaded_by'
         AND parent_object_id = OBJECT_ID(N'dbo.horse_documents')
   )
BEGIN
    ALTER TABLE dbo.horse_documents
    ADD CONSTRAINT FK_horse_documents_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES dbo.users(id)
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

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'tournament_id') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD tournament_id bigint NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'horse_id') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD horse_id bigint NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'owner_id') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD owner_id bigint NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'status') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD status nvarchar(30) NOT NULL CONSTRAINT DF_tournament_registrations_status DEFAULT N'PENDING'
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'note') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD note nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'rejection_reason') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD rejection_reason nvarchar(max) NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'reviewed_by') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD reviewed_by bigint NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'reviewed_at') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD reviewed_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'created_at') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD created_at datetime2 NOT NULL CONSTRAINT DF_tournament_registrations_created_at DEFAULT SYSUTCDATETIME()
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD updated_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.tournament_registrations', N'withdrawn_at') IS NULL
BEGIN
    ALTER TABLE dbo.tournament_registrations ADD withdrawn_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.tournament_registrations', N'tournament_id') IS NOT NULL
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
   AND COL_LENGTH(N'dbo.tournament_registrations', N'horse_id') IS NOT NULL
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
   AND COL_LENGTH(N'dbo.tournament_registrations', N'owner_id') IS NOT NULL
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
   AND COL_LENGTH(N'dbo.tournament_registrations', N'reviewed_by') IS NOT NULL
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

IF COL_LENGTH('horse_owner_profiles', 'logo_url') IS NULL
ALTER TABLE horse_owner_profiles ADD logo_url VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'stable_name') IS NULL
ALTER TABLE horse_owner_profiles ADD stable_name VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'organization_name') IS NULL
ALTER TABLE horse_owner_profiles ADD organization_name VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'owner_name') IS NULL
ALTER TABLE horse_owner_profiles ADD owner_name NVARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'description') IS NULL
ALTER TABLE horse_owner_profiles ADD description NVARCHAR(1000) NULL;
IF COL_LENGTH('horse_owner_profiles', 'contact_phone') IS NULL
ALTER TABLE horse_owner_profiles ADD contact_phone VARCHAR(30) NULL;
IF COL_LENGTH('horse_owner_profiles', 'contact_email') IS NULL
ALTER TABLE horse_owner_profiles ADD contact_email VARCHAR(150) NULL;
IF COL_LENGTH('horse_owner_profiles', 'contact_address') IS NULL
ALTER TABLE horse_owner_profiles ADD contact_address NVARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'license_number') IS NULL
ALTER TABLE horse_owner_profiles ADD license_number VARCHAR(100) NULL;
IF COL_LENGTH('horse_owner_profiles', 'experience_years') IS NULL
ALTER TABLE horse_owner_profiles ADD experience_years INT NULL;
IF COL_LENGTH('horse_owner_profiles', 'bio') IS NULL
ALTER TABLE horse_owner_profiles ADD bio VARCHAR(1000) NULL;
IF COL_LENGTH('horse_owner_profiles', 'evidence_url') IS NULL
ALTER TABLE horse_owner_profiles ADD evidence_url VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'status') IS NULL
ALTER TABLE horse_owner_profiles ADD status VARCHAR(30) NULL;
IF COL_LENGTH('horse_owner_profiles', 'rejection_reason') IS NULL
ALTER TABLE horse_owner_profiles ADD rejection_reason VARCHAR(500) NULL;
IF COL_LENGTH('horse_owner_profiles', 'approved_by') IS NULL
ALTER TABLE horse_owner_profiles ADD approved_by BIGINT NULL;
IF COL_LENGTH('horse_owner_profiles', 'approved_at') IS NULL
ALTER TABLE horse_owner_profiles ADD approved_at DATETIME2 NULL;
IF COL_LENGTH('horse_owner_profiles', 'created_at') IS NULL
ALTER TABLE horse_owner_profiles ADD created_at DATETIME2 NULL;
IF COL_LENGTH('horse_owner_profiles', 'updated_at') IS NULL
ALTER TABLE horse_owner_profiles ADD updated_at DATETIME2 NULL;

IF OBJECT_ID(N'dbo.point_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.point_settings (
        setting_key VARCHAR(80) NOT NULL,
        setting_value INT NOT NULL CONSTRAINT DF_point_settings_value DEFAULT 0,
        description NVARCHAR(255) NULL,
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_point_settings_updated_at DEFAULT SYSUTCDATETIME(),
        updated_by BIGINT NULL,
        CONSTRAINT pk_point_settings PRIMARY KEY (setting_key),
        CONSTRAINT chk_point_settings_value CHECK (setting_value >= 0)
    )
END;

IF OBJECT_ID(N'dbo.point_settings', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.point_settings', N'updated_by') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.foreign_keys
       WHERE name = N'FK_point_settings_updated_by'
         AND parent_object_id = OBJECT_ID(N'dbo.point_settings')
   )
BEGIN
    ALTER TABLE dbo.point_settings
    ADD CONSTRAINT FK_point_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES dbo.users(id)
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'FIRST_LOGIN_BONUS')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('FIRST_LOGIN_BONUS', 0, N'Points granted on first successful login when enabled.')
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'BLOG_REWARD_POINTS')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('BLOG_REWARD_POINTS', 0, N'Points awarded when an eligible blog reward is claimed.')
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'DAILY_BLOG_REWARD_LIMIT')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('DAILY_BLOG_REWARD_LIMIT', 0, N'Maximum blog reward points a user can earn per day.')
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'PREDICTION_ENTRY_COST')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('PREDICTION_ENTRY_COST', 0, N'Points spent to submit one race prediction.')
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'PREDICTION_CORRECT_REWARD')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('PREDICTION_CORRECT_REWARD', 0, N'Points awarded for a correct race prediction.')
END;
