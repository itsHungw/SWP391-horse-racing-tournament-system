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

-- 6. PREDICTIONS & POINTS TABLES

IF OBJECT_ID(N'dbo.user_point_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_point_accounts (
        user_id BIGINT NOT NULL,
        point_balance INT NOT NULL DEFAULT 0,
        updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT pk_user_point_accounts PRIMARY KEY (user_id),
        CONSTRAINT fk_upa_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT chk_upa_balance CHECK (point_balance >= 0)
    );
END;

IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.point_transactions (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id BIGINT NOT NULL,
        amount INT NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        reference_type VARCHAR(50) NULL,
        reference_id BIGINT NULL,
        description NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT pk_point_transactions PRIMARY KEY (id),
        CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT chk_pt_transaction_type CHECK (
            transaction_type IN ('PREDICTION_ENTRY', 'PREDICTION_REWARD', 'BLOG_REWARD', 'RACE_CANCEL_REFUND', 'ADMIN_ADJUSTMENT')
        ),
        CONSTRAINT chk_pt_reference_type CHECK (
            reference_type IS NULL OR reference_type IN ('RACE_PREDICTION', 'RACE_RESULT', 'BLOG', 'ADMIN', 'RACE')
        )
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = N'uq_point_tx_idempotency' 
      AND object_id = OBJECT_ID(N'dbo.point_transactions')
)
BEGIN
    CREATE UNIQUE INDEX uq_point_tx_idempotency 
    ON dbo.point_transactions(reference_type, reference_id, transaction_type)
    WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
END;

IF OBJECT_ID(N'dbo.race_predictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.race_predictions (
        id BIGINT IDENTITY(1,1) NOT NULL,
        race_id BIGINT NOT NULL,
        spectator_id BIGINT NOT NULL,
        prediction_type VARCHAR(30) NOT NULL DEFAULT 'WINNER',
        predicted_winner_id BIGINT NOT NULL,
        predicted_second_id BIGINT NULL,
        predicted_third_id BIGINT NULL,
        entry_cost_points INT NOT NULL,
        reward_points INT NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        locked_at DATETIME2 NULL,
        evaluated_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT pk_race_predictions PRIMARY KEY (id),
        CONSTRAINT uq_race_spectator_prediction UNIQUE (race_id, spectator_id, prediction_type),
        CONSTRAINT fk_rpred_race FOREIGN KEY (race_id) REFERENCES dbo.races(id),
        CONSTRAINT fk_rpred_spectator FOREIGN KEY (spectator_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_rpred_winner FOREIGN KEY (predicted_winner_id) REFERENCES dbo.race_participants(id),
        CONSTRAINT fk_rpred_second FOREIGN KEY (predicted_second_id) REFERENCES dbo.race_participants(id),
        CONSTRAINT fk_rpred_third FOREIGN KEY (predicted_third_id) REFERENCES dbo.race_participants(id),
        CONSTRAINT chk_rpred_type CHECK (prediction_type IN ('WINNER', 'TOP3')),
        CONSTRAINT chk_rpred_status CHECK (status IN ('PENDING', 'LOCKED', 'CORRECT', 'INCORRECT', 'CANCELLED', 'REFUNDED')),
        CONSTRAINT chk_rpred_top3_distinct CHECK (
            prediction_type <> 'TOP3' OR (
                predicted_second_id IS NOT NULL 
                AND predicted_third_id IS NOT NULL
                AND predicted_winner_id <> predicted_second_id
                AND predicted_winner_id <> predicted_third_id
                AND predicted_second_id <> predicted_third_id
            )
        )
    );
END;

IF OBJECT_ID(N'dbo.prediction_settlement_jobs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.prediction_settlement_jobs (
        id BIGINT IDENTITY(1,1) NOT NULL,
        race_id BIGINT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        processed_count INT NOT NULL DEFAULT 0,
        rewarded_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        retry_count INT NOT NULL DEFAULT 0,
        error_message NVARCHAR(MAX) NULL,
        started_at DATETIME2 NULL,
        completed_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT pk_prediction_settlement_jobs PRIMARY KEY (id),
        CONSTRAINT fk_psj_race FOREIGN KEY (race_id) REFERENCES dbo.races(id),
        CONSTRAINT uq_psj_race UNIQUE (race_id),
        CONSTRAINT chk_psj_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
    );
END;

