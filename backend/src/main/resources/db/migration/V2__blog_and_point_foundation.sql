  -- Blog, rewards, and point settings foundation.
-- Idempotent on purpose: existing development databases may already have part
-- of this schema from manual scripts.

IF OBJECT_ID(N'dbo.user_point_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_point_accounts (
        user_id BIGINT NOT NULL,
        point_balance INT NOT NULL CONSTRAINT DF_user_point_accounts_balance DEFAULT 0,
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_point_accounts_updated_at DEFAULT SYSUTCDATETIME(),
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
        created_at DATETIME2 NOT NULL CONSTRAINT DF_point_transactions_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_point_transactions PRIMARY KEY (id),
        CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT chk_pt_transaction_type CHECK (
            transaction_type IN (
                'FIRST_LOGIN_BONUS',
                'PREDICTION_ENTRY',
                'PREDICTION_REWARD',
                'BLOG_REWARD',
                'RACE_CANCEL_REFUND',
                'ADMIN_ADJUSTMENT'
            )
        ),
        CONSTRAINT chk_pt_reference_type CHECK (
            reference_type IS NULL OR reference_type IN (
                'RACE_PREDICTION',
                'RACE_RESULT',
                'BLOG',
                'ADMIN',
                'RACE'
            )
        )
    );
END;

IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'chk_pt_transaction_type'
         AND parent_object_id = OBJECT_ID(N'dbo.point_transactions')
   )
BEGIN
    ALTER TABLE dbo.point_transactions DROP CONSTRAINT chk_pt_transaction_type;
END;

IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'chk_pt_transaction_type'
         AND parent_object_id = OBJECT_ID(N'dbo.point_transactions')
   )
BEGIN
    ALTER TABLE dbo.point_transactions
    ADD CONSTRAINT chk_pt_transaction_type CHECK (
        transaction_type IN (
            'FIRST_LOGIN_BONUS',
            'PREDICTION_ENTRY',
            'PREDICTION_REWARD',
            'BLOG_REWARD',
            'RACE_CANCEL_REFUND',
            'ADMIN_ADJUSTMENT'
        )
    );
END;

IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE name = N'chk_pt_reference_type'
         AND parent_object_id = OBJECT_ID(N'dbo.point_transactions')
   )
BEGIN
    ALTER TABLE dbo.point_transactions
    ADD CONSTRAINT chk_pt_reference_type CHECK (
        reference_type IS NULL OR reference_type IN (
            'RACE_PREDICTION',
            'RACE_RESULT',
            'BLOG',
            'ADMIN',
            'RACE'
        )
    );
END;

IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'uq_point_tx_idempotency'
         AND object_id = OBJECT_ID(N'dbo.point_transactions')
   )
BEGIN
    CREATE UNIQUE INDEX uq_point_tx_idempotency
    ON dbo.point_transactions(reference_type, reference_id, transaction_type)
    WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;
END;

IF OBJECT_ID(N'dbo.point_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.point_settings (
        setting_key VARCHAR(80) NOT NULL,
        setting_value INT NOT NULL CONSTRAINT DF_point_settings_value DEFAULT 0,
        description NVARCHAR(255) NULL,
        updated_at DATETIME2 NULL,
        updated_by BIGINT NULL,
        CONSTRAINT pk_point_settings PRIMARY KEY (setting_key),
        CONSTRAINT chk_point_settings_value CHECK (setting_value >= 0),
        CONSTRAINT FK_point_settings_updated_by FOREIGN KEY (updated_by) REFERENCES dbo.users(id)
    );
END;

IF OBJECT_ID(N'dbo.point_settings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.point_settings', N'updated_by') IS NULL
BEGIN
    ALTER TABLE dbo.point_settings ADD updated_by BIGINT NULL;
END;

IF OBJECT_ID(N'dbo.point_settings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.point_settings', N'updated_at') IS NULL
BEGIN
    ALTER TABLE dbo.point_settings ADD updated_at DATETIME2 NULL;
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
    FOREIGN KEY (updated_by) REFERENCES dbo.users(id);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'FIRST_LOGIN_BONUS')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('FIRST_LOGIN_BONUS', 0, N'Points granted on first successful login when enabled.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'BLOG_REWARD_POINTS')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('BLOG_REWARD_POINTS', 0, N'Points awarded when an eligible blog reward is claimed.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'DAILY_BLOG_REWARD_LIMIT')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('DAILY_BLOG_REWARD_LIMIT', 0, N'Maximum blog reward points a user can earn per day.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'PREDICTION_ENTRY_COST')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('PREDICTION_ENTRY_COST', 0, N'Points spent to submit one race prediction.');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.point_settings WHERE setting_key = 'PREDICTION_CORRECT_REWARD')
BEGIN
    INSERT INTO dbo.point_settings (setting_key, setting_value, description)
    VALUES ('PREDICTION_CORRECT_REWARD', 0, N'Points awarded for a correct race prediction.');
END;

IF OBJECT_ID(N'dbo.blogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.blogs (
        id BIGINT IDENTITY(1,1) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        summary NVARCHAR(500) NULL,
        content NVARCHAR(MAX) NOT NULL,
        thumbnail VARCHAR(255) NULL,
        status VARCHAR(50) NOT NULL CONSTRAINT DF_blogs_status DEFAULT 'DRAFT',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_blogs_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        author_id BIGINT NOT NULL,
        CONSTRAINT pk_blogs PRIMARY KEY (id),
        CONSTRAINT uq_blogs_slug UNIQUE (slug),
        CONSTRAINT FK_blogs_users FOREIGN KEY (author_id) REFERENCES dbo.users(id),
        CONSTRAINT chk_blogs_status CHECK (status IN ('DRAFT', 'PUBLISHED'))
    );
END;

IF OBJECT_ID(N'dbo.blogs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.blogs', N'thumbnail') IS NULL
BEGIN
    ALTER TABLE dbo.blogs ADD thumbnail VARCHAR(255) NULL;
END;

IF OBJECT_ID(N'dbo.blogs', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.blogs', N'thumbnail_url') IS NOT NULL
   AND COL_LENGTH(N'dbo.blogs', N'thumbnail') IS NOT NULL
BEGIN
    EXEC(N'UPDATE dbo.blogs SET thumbnail = COALESCE(thumbnail, thumbnail_url) WHERE thumbnail IS NULL AND thumbnail_url IS NOT NULL');
END;

IF OBJECT_ID(N'dbo.blogs', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'IX_blogs_status'
         AND object_id = OBJECT_ID(N'dbo.blogs')
   )
BEGIN
    CREATE INDEX IX_blogs_status ON dbo.blogs(status);
END;

IF OBJECT_ID(N'dbo.user_blog_rewards', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_blog_rewards (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id BIGINT NOT NULL,
        blog_id BIGINT NOT NULL,
        points_earned INT NOT NULL,
        reading_seconds INT NOT NULL CONSTRAINT DF_user_blog_rewards_reading DEFAULT 0,
        scroll_percent INT NOT NULL CONSTRAINT DF_user_blog_rewards_scroll DEFAULT 0,
        reward_status VARCHAR(30) NOT NULL CONSTRAINT DF_user_blog_rewards_status DEFAULT 'CLAIMED',
        earned_at DATETIME2 NOT NULL CONSTRAINT DF_user_blog_rewards_earned_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_user_blog_rewards PRIMARY KEY (id),
        CONSTRAINT uq_user_blog_reward UNIQUE (user_id, blog_id),
        CONSTRAINT fk_ubr_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT fk_ubr_blog FOREIGN KEY (blog_id) REFERENCES dbo.blogs(id),
        CONSTRAINT chk_ubr_points CHECK (points_earned >= 0),
        CONSTRAINT chk_ubr_reading_seconds CHECK (reading_seconds >= 0),
        CONSTRAINT chk_ubr_scroll CHECK (scroll_percent >= 0 AND scroll_percent <= 100),
        CONSTRAINT chk_ubr_status CHECK (reward_status IN ('CLAIMED', 'REVOKED'))
    );
END;

IF OBJECT_ID(N'dbo.user_daily_point_limits', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_daily_point_limits (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id BIGINT NOT NULL,
        point_date DATE NOT NULL,
        points_earned_from_blog INT NOT NULL CONSTRAINT DF_udpl_blog_points DEFAULT 0,
        points_earned_total INT NOT NULL CONSTRAINT DF_udpl_total_points DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_udpl_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NULL,
        CONSTRAINT pk_user_daily_point_limits PRIMARY KEY (id),
        CONSTRAINT uq_user_daily_point UNIQUE (user_id, point_date),
        CONSTRAINT fk_udpl_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT chk_udpl_blog_points CHECK (points_earned_from_blog >= 0),
        CONSTRAINT chk_udpl_total_points CHECK (points_earned_total >= 0)
    );
END;
