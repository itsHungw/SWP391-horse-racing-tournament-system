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

IF OBJECT_ID(N'dbo.jockey_tournament_applications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.jockey_tournament_applications (
        id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        tournament_id bigint NOT NULL,
        jockey_id bigint NOT NULL,
        status nvarchar(30) NOT NULL,
        message nvarchar(max) NULL,
        reviewed_by bigint NULL,
        reviewed_at datetime2 NULL,
        rejection_reason nvarchar(max) NULL,
        created_at datetime2 NOT NULL CONSTRAINT DF_jockey_tournament_applications_created_at DEFAULT SYSUTCDATETIME(),
        updated_at datetime2 NULL,
        withdrawn_at datetime2 NULL
    )
END;

IF OBJECT_ID(N'dbo.jockey_tournament_applications', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_tournament_applications_tournament'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_tournament_applications')
   )
BEGIN
    ALTER TABLE dbo.jockey_tournament_applications
    ADD CONSTRAINT FK_jockey_tournament_applications_tournament
    FOREIGN KEY (tournament_id) REFERENCES dbo.tournaments(id)
END;

IF OBJECT_ID(N'dbo.jockey_tournament_applications', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_tournament_applications_jockey'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_tournament_applications')
   )
BEGIN
    ALTER TABLE dbo.jockey_tournament_applications
    ADD CONSTRAINT FK_jockey_tournament_applications_jockey
    FOREIGN KEY (jockey_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.jockey_invitations (
        id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        tournament_id bigint NOT NULL,
        tournament_registration_id bigint NOT NULL,
        jockey_application_id bigint NOT NULL,
        horse_id bigint NOT NULL,
        owner_id bigint NOT NULL,
        jockey_id bigint NOT NULL,
        status nvarchar(30) NOT NULL CONSTRAINT DF_jockey_invitations_status DEFAULT N'PENDING',
        message nvarchar(500) NULL,
        agreement_url nvarchar(500) NULL,
        agreement_file_name nvarchar(255) NULL,
        read_at datetime2 NULL,
        accepted_at datetime2 NULL,
        rejected_at datetime2 NULL,
        rejection_reason nvarchar(500) NULL,
        created_at datetime2 NOT NULL CONSTRAINT DF_jockey_invitations_created_at DEFAULT SYSUTCDATETIME(),
        updated_at datetime2 NULL
    )
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'tournament_id') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD tournament_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'tournament_registration_id') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD tournament_registration_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'jockey_application_id') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD jockey_application_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'horse_id') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD horse_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'owner_id') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD owner_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'jockey_id') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD jockey_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'status') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD status nvarchar(30) NOT NULL CONSTRAINT DF_jockey_invitations_status DEFAULT N'PENDING'
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'message') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD message nvarchar(500) NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'agreement_url') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD agreement_url nvarchar(500) NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'agreement_file_name') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD agreement_file_name nvarchar(255) NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'read_at') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD read_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'accepted_at') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD accepted_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'rejected_at') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD rejected_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'rejection_reason') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD rejection_reason nvarchar(500) NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'created_at') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD created_at datetime2 NOT NULL CONSTRAINT DF_jockey_invitations_created_at DEFAULT SYSUTCDATETIME()
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ADD updated_at datetime2 NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.jockey_invitations', N'race_id') IS NOT NULL
BEGIN
    ALTER TABLE dbo.jockey_invitations ALTER COLUMN race_id bigint NULL
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.jockey_invitations', N'tournament_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_invitations_tournament'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_invitations')
   )
BEGIN
    ALTER TABLE dbo.jockey_invitations
    ADD CONSTRAINT FK_jockey_invitations_tournament
    FOREIGN KEY (tournament_id) REFERENCES dbo.tournaments(id)
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.jockey_invitations', N'tournament_registration_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_invitations_registration'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_invitations')
   )
BEGIN
    ALTER TABLE dbo.jockey_invitations
    ADD CONSTRAINT FK_jockey_invitations_registration
    FOREIGN KEY (tournament_registration_id) REFERENCES dbo.tournament_registrations(id)
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.jockey_tournament_applications', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.jockey_invitations', N'jockey_application_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_invitations_jockey_application'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_invitations')
   )
BEGIN
    ALTER TABLE dbo.jockey_invitations
    ADD CONSTRAINT FK_jockey_invitations_jockey_application
    FOREIGN KEY (jockey_application_id) REFERENCES dbo.jockey_tournament_applications(id)
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.jockey_invitations', N'horse_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_invitations_horse'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_invitations')
   )
BEGIN
    ALTER TABLE dbo.jockey_invitations
    ADD CONSTRAINT FK_jockey_invitations_horse
    FOREIGN KEY (horse_id) REFERENCES dbo.horses(id)
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.jockey_invitations', N'owner_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_invitations_owner'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_invitations')
   )
BEGIN
    ALTER TABLE dbo.jockey_invitations
    ADD CONSTRAINT FK_jockey_invitations_owner
    FOREIGN KEY (owner_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.jockey_invitations', N'jockey_id') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_invitations_jockey'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_invitations')
   )
BEGIN
    ALTER TABLE dbo.jockey_invitations
    ADD CONSTRAINT FK_jockey_invitations_jockey
    FOREIGN KEY (jockey_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tournament_participants (
        id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
        tournament_id bigint NOT NULL,
        tournament_registration_id bigint NOT NULL,
        horse_id bigint NOT NULL,
        owner_id bigint NOT NULL,
        jockey_id bigint NOT NULL,
        jockey_invitation_id bigint NULL,
        status nvarchar(30) NOT NULL CONSTRAINT DF_tournament_participants_status DEFAULT N'ACTIVE',
        points int NOT NULL CONSTRAINT DF_tournament_participants_points DEFAULT 0,
        created_at datetime2 NOT NULL CONSTRAINT DF_tournament_participants_created_at DEFAULT SYSUTCDATETIME(),
        updated_at datetime2 NULL
    )
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_participants_tournament'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    ALTER TABLE dbo.tournament_participants
    ADD CONSTRAINT FK_tournament_participants_tournament
    FOREIGN KEY (tournament_id) REFERENCES dbo.tournaments(id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.tournament_registrations', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_participants_registration'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    ALTER TABLE dbo.tournament_participants
    ADD CONSTRAINT FK_tournament_participants_registration
    FOREIGN KEY (tournament_registration_id) REFERENCES dbo.tournament_registrations(id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_participants_horse'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    ALTER TABLE dbo.tournament_participants
    ADD CONSTRAINT FK_tournament_participants_horse
    FOREIGN KEY (horse_id) REFERENCES dbo.horses(id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_participants_owner'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    ALTER TABLE dbo.tournament_participants
    ADD CONSTRAINT FK_tournament_participants_owner
    FOREIGN KEY (owner_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_tournament_participants_jockey'
         AND parent_object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    ALTER TABLE dbo.tournament_participants
    ADD CONSTRAINT FK_tournament_participants_jockey
    FOREIGN KEY (jockey_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'UQ_tournament_participants_tournament_horse'
         AND object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    CREATE UNIQUE INDEX UQ_tournament_participants_tournament_horse
    ON dbo.tournament_participants(tournament_id, horse_id)
END;

IF OBJECT_ID(N'dbo.tournament_participants', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'UQ_tournament_participants_tournament_jockey'
         AND object_id = OBJECT_ID(N'dbo.tournament_participants')
   )
BEGIN
    CREATE UNIQUE INDEX UQ_tournament_participants_tournament_jockey
    ON dbo.tournament_participants(tournament_id, jockey_id)
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.race_participants (
        id bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_race_participants PRIMARY KEY,
        race_id bigint NOT NULL,
        horse_id bigint NOT NULL,
        owner_id bigint NOT NULL,
        jockey_id bigint NULL,
        invitation_id bigint NULL,
        start_number int NULL,
        lane_number int NULL,
        weight_carried_kg decimal(5,2) NULL,
        confirmation_status nvarchar(30) NOT NULL CONSTRAINT DF_race_participants_confirmation_status DEFAULT N'PENDING',
        check_status nvarchar(30) NOT NULL CONSTRAINT DF_race_participants_check_status DEFAULT N'NOT_CHECKED',
        status nvarchar(30) NOT NULL CONSTRAINT DF_race_participants_status DEFAULT N'REGISTERED',
        check_note nvarchar(max) NULL,
        created_at datetime2 NOT NULL CONSTRAINT DF_race_participants_created_at DEFAULT SYSUTCDATETIME(),
        updated_at datetime2 NULL
    )
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.races', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_race_participants_race'
         AND parent_object_id = OBJECT_ID(N'dbo.race_participants')
   )
BEGIN
    ALTER TABLE dbo.race_participants
    ADD CONSTRAINT FK_race_participants_race
    FOREIGN KEY (race_id) REFERENCES dbo.races(id)
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.horses', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_race_participants_horse'
         AND parent_object_id = OBJECT_ID(N'dbo.race_participants')
   )
BEGIN
    ALTER TABLE dbo.race_participants
    ADD CONSTRAINT FK_race_participants_horse
    FOREIGN KEY (horse_id) REFERENCES dbo.horses(id)
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_race_participants_owner'
         AND parent_object_id = OBJECT_ID(N'dbo.race_participants')
   )
BEGIN
    ALTER TABLE dbo.race_participants
    ADD CONSTRAINT FK_race_participants_owner
    FOREIGN KEY (owner_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_race_participants_jockey'
         AND parent_object_id = OBJECT_ID(N'dbo.race_participants')
   )
BEGIN
    ALTER TABLE dbo.race_participants
    ADD CONSTRAINT FK_race_participants_jockey
    FOREIGN KEY (jockey_id) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.jockey_invitations', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_race_participants_invitation'
         AND parent_object_id = OBJECT_ID(N'dbo.race_participants')
   )
BEGIN
    ALTER TABLE dbo.race_participants
    ADD CONSTRAINT FK_race_participants_invitation
    FOREIGN KEY (invitation_id) REFERENCES dbo.jockey_invitations(id)
END;

IF OBJECT_ID(N'dbo.race_participants', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'UQ_race_participants_race_horse'
         AND object_id = OBJECT_ID(N'dbo.race_participants')
   )
BEGIN
    CREATE UNIQUE INDEX UQ_race_participants_race_horse
    ON dbo.race_participants(race_id, horse_id)
END;

IF OBJECT_ID(N'dbo.jockey_tournament_applications', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_jockey_tournament_applications_reviewed_by'
         AND parent_object_id = OBJECT_ID(N'dbo.jockey_tournament_applications')
   )
BEGIN
    ALTER TABLE dbo.jockey_tournament_applications
    ADD CONSTRAINT FK_jockey_tournament_applications_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES dbo.users(id)
END;

IF OBJECT_ID(N'dbo.jockey_tournament_applications', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.indexes
       WHERE name = N'uq_jockey_tournament_applications_tournament_jockey'
         AND object_id = OBJECT_ID(N'dbo.jockey_tournament_applications')
   )
BEGIN
    CREATE UNIQUE INDEX uq_jockey_tournament_applications_tournament_jockey
    ON dbo.jockey_tournament_applications(tournament_id, jockey_id)
END;

IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.tournaments', N'max_horses_per_owner') IS NULL
BEGIN
    ALTER TABLE dbo.tournaments
    ADD max_horses_per_owner int NOT NULL
        CONSTRAINT DF_tournaments_max_horses_per_owner DEFAULT 2
END;

IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.tournaments', N'max_horses_per_owner') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'chk_tournaments_max_horses_per_owner'
         AND parent_object_id = OBJECT_ID(N'dbo.tournaments')
   )
BEGIN
    ALTER TABLE dbo.tournaments
    ADD CONSTRAINT chk_tournaments_max_horses_per_owner
    CHECK (max_horses_per_owner > 0)
END;

IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'chk_tournaments_status'
         AND parent_object_id = OBJECT_ID(N'dbo.tournaments')
   )
BEGIN
    ALTER TABLE dbo.tournaments DROP CONSTRAINT chk_tournaments_status
END;

IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'chk_tournaments_status'
         AND parent_object_id = OBJECT_ID(N'dbo.tournaments')
   )
BEGIN
    ALTER TABLE dbo.tournaments
    ADD CONSTRAINT chk_tournaments_status
    CHECK (
        status IN (
            N'DRAFT',
            N'OPEN_REGISTRATION',
            N'CLOSED_REGISTRATION',
            N'PARTICIPANTS_LOCKED',
            N'ONGOING',
            N'COMPLETED',
            N'POSTPONED'
        )
    )
END;
IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
    AND COL_LENGTH(N'dbo.tournaments', N'max_horses_per_owner') IS NULL
    BEGIN
        EXEC(N'
        ALTER TABLE dbo.tournaments
        ADD max_horses_per_owner INT NOT NULL
            CONSTRAINT DF_tournaments_max_horses_per_owner DEFAULT 2
            WITH VALUES
    ');
    END;
GO

IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
    AND COL_LENGTH(N'dbo.tournaments', N'max_horses_per_owner') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'chk_tournaments_max_horses_per_owner'
          AND parent_object_id = OBJECT_ID(N'dbo.tournaments')
    )
    BEGIN
        EXEC(N'
        ALTER TABLE dbo.tournaments
        ADD CONSTRAINT chk_tournaments_max_horses_per_owner
        CHECK (max_horses_per_owner > 0)
    ');
    END;
GO


IF OBJECT_ID(N'dbo.tournaments', N'U') IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'chk_tournaments_status'
          AND parent_object_id = OBJECT_ID(N'dbo.tournaments')
    )
    BEGIN
        ALTER TABLE dbo.tournaments
            DROP CONSTRAINT chk_tournaments_status;
    END;
GO

ALTER TABLE dbo.tournaments
    ADD CONSTRAINT chk_tournaments_status
        CHECK (
            status IN (
                       N'DRAFT',
                       N'OPEN_REGISTRATION',
                       N'CLOSED_REGISTRATION',
                       N'PARTICIPANTS_LOCKED',
                       N'ONGOING',
                       N'COMPLETED',
                       N'POSTPONED',
                       N'CANCELLED'
                )
            );
GO

SELECT definition
FROM sys.check_constraints
WHERE name = 'chk_tournaments_status';