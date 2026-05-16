-- =====================================================================
-- Horse Racing Tournament Management System
-- Database Creation Script (MVP - 25 Tables)
-- Target Database: SQL Server
-- Version: 1.3 (Updated with Pari-mutuel Betting & NVARCHAR fix)
-- =====================================================================

-- =====================================================================
-- 1. CORE USER TABLES
-- =====================================================================

-- 1.1 users
CREATE TABLE users (
    id BIGINT NOT NULL IDENTITY(1,1),
    full_name NVARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    avatar_url VARCHAR(500) NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL,                -- MALE / FEMALE / OTHER
    address NVARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE / LOCKED / DISABLED / PENDING_EMAIL_VERIFY
    email_verified BIT NOT NULL DEFAULT 0,
    last_login_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,               -- Soft delete
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'DISABLED', 'PENDING_EMAIL_VERIFY'))
);

CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- 1.2 roles
CREATE TABLE roles (
    id BIGINT NOT NULL IDENTITY(1,1),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name)
);

-- 1.3 user_roles
CREATE TABLE user_roles (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE / SUSPENDED / REMOVED
    assigned_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    assigned_by BIGINT NULL,
    removed_at DATETIME2 NULL,
    removed_by BIGINT NULL,
    CONSTRAINT pk_user_roles PRIMARY KEY (id),
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id),
    CONSTRAINT fk_user_roles_removed_by FOREIGN KEY (removed_by) REFERENCES users(id),
    CONSTRAINT chk_user_roles_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REMOVED'))
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_status ON user_roles(status);

-- 1.3b user_role_history (Audit table for role changes)
CREATE TABLE user_role_history (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_role_id BIGINT NOT NULL,
    old_status VARCHAR(30) NULL,
    new_status VARCHAR(30) NOT NULL,
    changed_by BIGINT NULL,
    changed_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    reason NVARCHAR(MAX) NULL,
    CONSTRAINT pk_user_role_history PRIMARY KEY (id),
    CONSTRAINT fk_urh_user_role FOREIGN KEY (user_role_id) REFERENCES user_roles(id),
    CONSTRAINT fk_urh_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 1.4 role_requests
CREATE TABLE role_requests (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    requested_role VARCHAR(50) NOT NULL,    -- HORSE_OWNER / JOCKEY / REFEREE
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED / CANCELLED
    reason NVARCHAR(MAX) NULL,
    evidence_url VARCHAR(500) NULL,
    admin_note NVARCHAR(MAX) NULL,
    reviewed_by BIGINT NULL,
    reviewed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_role_requests PRIMARY KEY (id),
    CONSTRAINT fk_role_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_role_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id),
    CONSTRAINT chk_role_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX idx_role_requests_user_id ON role_requests(user_id);
CREATE INDEX idx_role_requests_status ON role_requests(status);
CREATE INDEX idx_role_requests_role ON role_requests(requested_role);

-- =====================================================================
-- 2. PROFILE TABLES
-- =====================================================================

-- 2.1 horse_owner_profiles
CREATE TABLE horse_owner_profiles (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    stable_name NVARCHAR(150) NULL,
    organization_name NVARCHAR(150) NULL,
    license_number VARCHAR(100) NULL,
    experience_years INT NOT NULL DEFAULT 0,
    bio NVARCHAR(MAX) NULL,
    evidence_url VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED / SUSPENDED
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_horse_owner_profiles PRIMARY KEY (id),
    CONSTRAINT uq_horse_owner_user UNIQUE (user_id),
    CONSTRAINT fk_horse_owner_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_horse_owner_approver FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 2.2 jockey_profiles
CREATE TABLE jockey_profiles (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    license_number VARCHAR(100) NULL,
    height_cm DECIMAL(5,2) NULL,
    weight_kg DECIMAL(5,2) NULL,
    experience_years INT NOT NULL DEFAULT 0,
    riding_style VARCHAR(100) NULL,         -- FRONT_RUNNER / CLOSER / BALANCED
    bio NVARCHAR(MAX) NULL,
    evidence_url VARCHAR(500) NULL,
    total_races INT NOT NULL DEFAULT 0,
    total_wins INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED / SUSPENDED
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_jockey_profiles PRIMARY KEY (id),
    CONSTRAINT uq_jockey_user UNIQUE (user_id),
    CONSTRAINT fk_jockey_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_jockey_approver FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 2.3 referee_profiles
CREATE TABLE referee_profiles (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    license_number VARCHAR(100) NULL,
    certification VARCHAR(255) NULL,
    experience_years INT NOT NULL DEFAULT 0,
    bio NVARCHAR(MAX) NULL,
    evidence_url VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / ACTIVE / REJECTED / SUSPENDED / INACTIVE
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_referee_profiles PRIMARY KEY (id),
    CONSTRAINT uq_referee_user UNIQUE (user_id),
    CONSTRAINT fk_referee_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_referee_approver FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =====================================================================
-- 3. HORSE & TOURNAMENT TABLES
-- =====================================================================

-- 3.1 horses
CREATE TABLE horses (
    id BIGINT NOT NULL IDENTITY(1,1),
    owner_id BIGINT NOT NULL,
    name NVARCHAR(150) NOT NULL,
    registration_code VARCHAR(100) NULL,
    breed NVARCHAR(100) NULL,
    gender VARCHAR(20) NOT NULL,            -- MALE / FEMALE
    date_of_birth DATE NULL,
    color NVARCHAR(50) NULL,
    height_cm DECIMAL(6,2) NULL,
    weight_kg DECIMAL(6,2) NULL,
    health_status VARCHAR(100) NULL,
    medical_note NVARCHAR(MAX) NULL,
    image_url VARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED / INACTIVE / SUSPENDED
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    CONSTRAINT pk_horses PRIMARY KEY (id),
    CONSTRAINT fk_horses_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_horses_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_horses_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE', 'SUSPENDED'))
);

CREATE UNIQUE INDEX uq_horses_reg_code ON horses(registration_code) WHERE registration_code IS NOT NULL;
CREATE INDEX idx_horses_owner_id ON horses(owner_id);
CREATE INDEX idx_horses_status ON horses(status);
CREATE INDEX idx_horses_name ON horses(name);
CREATE INDEX idx_horses_deleted_at ON horses(deleted_at);

-- 3.2 tournaments
CREATE TABLE tournaments (
    id BIGINT NOT NULL IDENTITY(1,1),
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description NVARCHAR(MAX) NULL,
    location NVARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_start_at DATETIME2 NOT NULL,
    registration_end_at DATETIME2 NOT NULL,
    max_horses INT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    banner_url VARCHAR(500) NULL,
    rules NVARCHAR(MAX) NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    CONSTRAINT pk_tournaments PRIMARY KEY (id),
    CONSTRAINT uq_tournaments_code UNIQUE (code),
    CONSTRAINT fk_tournaments_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_tournament_dates CHECK (start_date <= end_date),
    CONSTRAINT chk_tournament_reg_dates CHECK (registration_start_at < registration_end_at),
    CONSTRAINT chk_tournaments_status CHECK (status IN ('DRAFT', 'OPEN_REGISTRATION', 'CLOSED_REGISTRATION', 'ONGOING', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_deleted_at ON tournaments(deleted_at);

-- 3.2b tournament_prize_tiers
CREATE TABLE tournament_prize_tiers (
    id BIGINT NOT NULL IDENTITY(1,1),
    tournament_id BIGINT NOT NULL,
    position INT NOT NULL, -- 1 = 1st, 2 = 2nd, etc.
    prize_points INT NOT NULL,
    description VARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_tournament_prize_tiers PRIMARY KEY (id),
    CONSTRAINT uq_prize_tier UNIQUE (tournament_id, position),
    CONSTRAINT fk_prize_tier_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);

-- 3.3 races
CREATE TABLE races (
    id BIGINT NOT NULL IDENTITY(1,1),
    tournament_id BIGINT NOT NULL,
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    round_name NVARCHAR(100) NULL,           -- Qualifier / Semi / Final
    race_number INT NULL,
    race_at DATETIME2 NOT NULL,
    distance_meter INT NOT NULL,
    track_name NVARCHAR(150) NULL,
    track_condition VARCHAR(50) NULL,       -- DRY / WET / MUDDY / NORMAL
    max_participants INT NOT NULL,
    min_participants INT NOT NULL DEFAULT 2,
    referee_id BIGINT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'SCHEDULED',
    note NVARCHAR(MAX) NULL,
    created_by BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,
    CONSTRAINT pk_races PRIMARY KEY (id),
    CONSTRAINT uq_races_code UNIQUE (code),
    CONSTRAINT fk_races_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    CONSTRAINT fk_races_referee FOREIGN KEY (referee_id) REFERENCES users(id),
    CONSTRAINT fk_races_creator FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_races_participants CHECK (max_participants >= min_participants AND min_participants >= 2),
    CONSTRAINT chk_races_status CHECK (status IN ('SCHEDULED', 'CHECKING', 'READY', 'ONGOING', 'FINISHED', 'RESULT_SUBMITTED', 'RESULT_CONFIRMED', 'PUBLISHED', 'CANCELLED'))
);

CREATE INDEX idx_races_tournament_id ON races(tournament_id);
CREATE INDEX idx_races_referee_id ON races(referee_id);
CREATE INDEX idx_races_race_at ON races(race_at);
CREATE INDEX idx_races_status ON races(status);
CREATE INDEX idx_races_deleted_at ON races(deleted_at);

-- 3.4 tournament_registrations
CREATE TABLE tournament_registrations (
    id BIGINT NOT NULL IDENTITY(1,1),
    tournament_id BIGINT NOT NULL,
    horse_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED / WITHDRAWN
    note NVARCHAR(MAX) NULL,
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_tournament_registrations PRIMARY KEY (id),
    CONSTRAINT uq_tournament_horse UNIQUE (tournament_id, horse_id),
    CONSTRAINT fk_reg_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    CONSTRAINT fk_reg_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_reg_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_reg_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_reg_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'))
);

CREATE INDEX idx_reg_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_reg_owner ON tournament_registrations(owner_id);
CREATE INDEX idx_reg_status ON tournament_registrations(status);

-- =====================================================================
-- 4. RACE OPERATION TABLES
-- =====================================================================

-- 4.1 jockey_invitations
CREATE TABLE jockey_invitations (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    horse_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    jockey_id BIGINT NOT NULL,
    message NVARCHAR(MAX) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / ACCEPTED / REJECTED / CANCELLED / EXPIRED
    response_message NVARCHAR(MAX) NULL,
    responded_at DATETIME2 NULL,
    expired_at DATETIME2 NULL, -- Should be handled by scheduled job to mark EXPIRED
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_jockey_invitations PRIMARY KEY (id),
    CONSTRAINT fk_inv_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_inv_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_inv_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_inv_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT chk_inv_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'))
);

CREATE INDEX idx_inv_jockey_id ON jockey_invitations(jockey_id);
CREATE INDEX idx_inv_owner_id ON jockey_invitations(owner_id);
CREATE INDEX idx_inv_race_id ON jockey_invitations(race_id);
CREATE INDEX idx_inv_status ON jockey_invitations(status);

-- 4.2 race_participants
CREATE TABLE race_participants (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    horse_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    jockey_id BIGINT NULL,
    invitation_id BIGINT NULL,
    start_number INT NULL,
    lane_number INT NULL,
    weight_carried_kg DECIMAL(5,2) NULL,
    confirmation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',   -- PENDING / CONFIRMED / WITHDRAWN
    check_status VARCHAR(30) NOT NULL DEFAULT 'NOT_CHECKED',      -- NOT_CHECKED / PASSED / FAILED / CONDITIONAL
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',             -- REGISTERED / APPROVED / DISQUALIFIED / WITHDRAWN
    check_note NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_race_participants PRIMARY KEY (id),
    CONSTRAINT uq_race_horse UNIQUE (race_id, horse_id),
    CONSTRAINT fk_rp_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_rp_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_rp_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_rp_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT fk_rp_invitation FOREIGN KEY (invitation_id) REFERENCES jockey_invitations(id)
);

CREATE INDEX idx_rp_race_id ON race_participants(race_id);
CREATE INDEX idx_rp_horse_id ON race_participants(horse_id);
CREATE INDEX idx_rp_jockey_id ON race_participants(jockey_id);

-- 4.3 pre_race_checks
CREATE TABLE pre_race_checks (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    referee_id BIGINT NOT NULL,
    horse_identity_ok BIT NOT NULL DEFAULT 0,
    jockey_identity_ok BIT NOT NULL DEFAULT 0,
    equipment_ok BIT NOT NULL DEFAULT 0,
    health_ok BIT NOT NULL DEFAULT 0,
    weight_ok BIT NOT NULL DEFAULT 0,
    result VARCHAR(30) NOT NULL,            -- PASSED / FAILED / CONDITIONAL
    note NVARCHAR(MAX) NULL,
    checked_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_pre_race_checks PRIMARY KEY (id),
    CONSTRAINT uq_race_participant_check UNIQUE (race_id, participant_id),
    CONSTRAINT fk_prc_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_prc_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT fk_prc_referee FOREIGN KEY (referee_id) REFERENCES users(id),
    CONSTRAINT chk_prc_result CHECK (result IN ('PASSED', 'FAILED', 'CONDITIONAL'))
);

-- 4.4 violations
CREATE TABLE violations (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NULL,
    violation_type VARCHAR(100) NULL,       -- FALSE_START / LANE_INTERFERENCE / UNSAFE_RIDING / etc.
    reported_by BIGINT NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    penalty VARCHAR(150) NULL,
    severity VARCHAR(30) NULL,              -- LOW / MEDIUM / HIGH
    occurred_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_violations PRIMARY KEY (id),
    CONSTRAINT fk_vio_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_vio_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT fk_vio_reporter FOREIGN KEY (reported_by) REFERENCES users(id)
);

CREATE INDEX idx_vio_race_id ON violations(race_id);

-- 4.5 referee_reports
CREATE TABLE referee_reports (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    referee_id BIGINT NOT NULL,
    title NVARCHAR(200) NULL,
    summary NVARCHAR(MAX) NOT NULL,
    ai_summary NVARCHAR(MAX) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',  -- DRAFT / SUBMITTED / CONFIRMED / REJECTED
    submitted_at DATETIME2 NULL,
    confirmed_by BIGINT NULL,
    confirmed_at DATETIME2 NULL,
    rejection_reason NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_referee_reports PRIMARY KEY (id),
    CONSTRAINT uq_race_referee_report UNIQUE (race_id, referee_id),
    CONSTRAINT fk_rr_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_rr_referee FOREIGN KEY (referee_id) REFERENCES users(id),
    CONSTRAINT fk_rr_confirmer FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT chk_rr_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'REJECTED'))
);

-- =====================================================================
-- 5. RESULT & RANKING TABLES
-- =====================================================================

-- 5.1 race_results
CREATE TABLE race_results (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    position INT NULL,                      -- NULL for DISQUALIFIED / DID_NOT_FINISH / WITHDRAWN
    finish_time_seconds DECIMAL(10,3) NULL, -- Precision for DATETIME2 compatibility
    result_status VARCHAR(30) NOT NULL,     -- FINISHED / DISQUALIFIED / DID_NOT_FINISH / WITHDRAWN
    points INT NOT NULL DEFAULT 0,
    prize_points INT NOT NULL DEFAULT 0,
    note NVARCHAR(MAX) NULL,
    submitted_by BIGINT NOT NULL,
    submitted_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    confirmed_by BIGINT NULL,
    confirmed_at DATETIME2 NULL,
    published_at DATETIME2 NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',  -- DRAFT / SUBMITTED / CONFIRMED / PUBLISHED / REJECTED
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_race_results PRIMARY KEY (id),
    CONSTRAINT uq_race_participant_result UNIQUE (race_id, participant_id),
    CONSTRAINT fk_res_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_res_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT fk_res_submitter FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_res_confirmer FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT chk_res_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PUBLISHED', 'REJECTED'))
);

CREATE INDEX idx_res_race_id ON race_results(race_id);
CREATE INDEX idx_res_status ON race_results(status);

-- 5.2 tournament_rankings
CREATE TABLE tournament_rankings (
    id BIGINT NOT NULL IDENTITY(1,1),
    tournament_id BIGINT NOT NULL,
    horse_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    total_races INT NOT NULL DEFAULT 0,
    total_wins INT NOT NULL DEFAULT 0,
    total_points INT NOT NULL DEFAULT 0,
    total_prize_points INT NOT NULL DEFAULT 0,
    rank_position INT NULL,
    last_updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_tournament_rankings PRIMARY KEY (id),
    CONSTRAINT uq_tournament_horse_rank UNIQUE (tournament_id, horse_id),
    CONSTRAINT fk_rank_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    CONSTRAINT fk_rank_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_rank_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_rank_tournament ON tournament_rankings(tournament_id);

-- =====================================================================
-- 6. PREDICTION & NOTIFICATION TABLES
-- =====================================================================

-- 6.1 user_wallets (System wallet for betting points)
CREATE TABLE user_wallets (
    user_id BIGINT NOT NULL,
    balance INT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_user_wallets PRIMARY KEY (user_id),
    CONSTRAINT fk_uw_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_uw_balance CHECK (balance >= 0)
);

-- 6.1a wallet_transactions
CREATE TABLE wallet_transactions (
    id BIGINT NOT NULL IDENTITY(1,1),
    wallet_id BIGINT NOT NULL,
    amount INT NOT NULL,
    txn_type VARCHAR(30) NOT NULL, -- 'PLACE_BET', 'BET_PAYOUT', 'BLOG_REWARD'
    reference_type VARCHAR(50) NOT NULL, -- 'PREDICTIONS', 'RACE_RESULTS', 'BLOG'
    reference_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_wallet_txns PRIMARY KEY (id),
    CONSTRAINT fk_wtxn_wallet FOREIGN KEY (wallet_id) REFERENCES user_wallets(user_id)
);

-- 6.1b predictions
CREATE TABLE predictions (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    spectator_id BIGINT NOT NULL,
    prediction_type VARCHAR(30) NOT NULL DEFAULT 'WINNER',   -- WINNER / TOP3
    predicted_winner_id BIGINT NOT NULL, -- Bắt buộc chọn ít nhất 1 con (WINNER)
    predicted_second_id BIGINT NULL,
    predicted_third_id BIGINT NULL,
    bet_amount INT NOT NULL, -- Số điểm cược
    payout_amount INT NOT NULL DEFAULT 0, -- Số điểm nhận về sau khi thắng
    payout_rate DECIMAL(7,4) NULL, -- Tỷ lệ ăn chia thực tế
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',  -- PENDING / LOCKED / WON / LOST / CANCELLED
    evaluated_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_predictions PRIMARY KEY (id),
    CONSTRAINT uq_race_spectator UNIQUE (race_id, spectator_id),
    CONSTRAINT fk_pred_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_pred_spectator FOREIGN KEY (spectator_id) REFERENCES users(id),
    CONSTRAINT fk_pred_winner FOREIGN KEY (predicted_winner_id) REFERENCES race_participants(id),
    CONSTRAINT fk_pred_second FOREIGN KEY (predicted_second_id) REFERENCES race_participants(id),
    CONSTRAINT fk_pred_third FOREIGN KEY (predicted_third_id) REFERENCES race_participants(id),
    CONSTRAINT chk_pred_amount CHECK (bet_amount > 0),
    CONSTRAINT chk_pred_status CHECK (status IN ('PENDING', 'LOCKED', 'WON', 'LOST', 'CANCELLED'))
);

CREATE INDEX idx_pred_race_id ON predictions(race_id);
CREATE INDEX idx_pred_spectator_id ON predictions(spectator_id);
CREATE INDEX idx_pred_status ON predictions(status);

-- 6.1b ai_predictions
CREATE TABLE ai_predictions (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    win_probability DECIMAL(5,4) NOT NULL, -- e.g. 0.8500 = 85%
    predicted_position INT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    ai_model_version VARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_ai_predictions PRIMARY KEY (id),
    CONSTRAINT uq_ai_pred UNIQUE (race_id, participant_id),
    CONSTRAINT fk_aipred_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_aipred_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id)
);

CREATE INDEX idx_aipred_race_id ON ai_predictions(race_id);

-- 6.2 notifications
CREATE TABLE notifications (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    read_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_noti_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_noti_user_id ON notifications(user_id);
CREATE INDEX idx_noti_is_read ON notifications(is_read);
CREATE INDEX idx_noti_type ON notifications(type);
CREATE INDEX idx_noti_created_at ON notifications(created_at);

-- =====================================================================
-- 7. BLOG & REWARDS TABLES
-- =====================================================================

-- 7.1 blogs
CREATE TABLE blogs (
    id BIGINT NOT NULL IDENTITY(1,1),
    author_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    summary NVARCHAR(MAX) NULL,
    content NVARCHAR(MAX) NOT NULL,
    thumbnail_url VARCHAR(500) NULL,
    reward_points INT NOT NULL DEFAULT 0, -- Points awarded for reading/scrolling
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT / PUBLISHED / HIDDEN
    published_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT pk_blogs PRIMARY KEY (id),
    CONSTRAINT uq_blogs_slug UNIQUE (slug),
    CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users(id),
    CONSTRAINT chk_blogs_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN'))
);

CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_published_at ON blogs(published_at);

-- 7.2 user_blog_rewards (To track which user has claimed points for which blog)
CREATE TABLE user_blog_rewards (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    blog_id BIGINT NOT NULL,
    points_earned INT NOT NULL,
    earned_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_user_blog_rewards PRIMARY KEY (id),
    CONSTRAINT uq_user_blog_reward UNIQUE (user_id, blog_id),
    CONSTRAINT fk_ubr_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ubr_blog FOREIGN KEY (blog_id) REFERENCES blogs(id)
);

-- =====================================================================
-- END OF MVP TABLES (25 tables total)
-- =====================================================================

-- =========================================================
-- FINAL HARDENING PATCH FOR MVP
-- =========================================================

ALTER TABLE role_requests
ADD CONSTRAINT chk_role_requests_requested_role
CHECK (requested_role IN ('HORSE_OWNER', 'JOCKEY', 'REFEREE'));

ALTER TABLE horse_owner_profiles
ADD CONSTRAINT chk_hop_status
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

ALTER TABLE jockey_profiles
ADD CONSTRAINT chk_jockey_profiles_status
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

ALTER TABLE referee_profiles
ADD CONSTRAINT chk_referee_profiles_status
CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE'));

ALTER TABLE race_participants
ADD CONSTRAINT chk_rp_confirmation_status
CHECK (confirmation_status IN ('PENDING', 'CONFIRMED', 'WITHDRAWN'));

ALTER TABLE race_participants
ADD CONSTRAINT chk_rp_check_status
CHECK (check_status IN ('NOT_CHECKED', 'PASSED', 'FAILED', 'CONDITIONAL'));

ALTER TABLE race_participants
ADD CONSTRAINT chk_rp_status
CHECK (status IN ('REGISTERED', 'APPROVED', 'DISQUALIFIED', 'WITHDRAWN'));

CREATE UNIQUE INDEX uq_rp_race_jockey
ON race_participants(race_id, jockey_id)
WHERE jockey_id IS NOT NULL;

CREATE UNIQUE INDEX uq_rp_race_start_number
ON race_participants(race_id, start_number)
WHERE start_number IS NOT NULL;

CREATE UNIQUE INDEX uq_rp_race_lane_number
ON race_participants(race_id, lane_number)
WHERE lane_number IS NOT NULL;

ALTER TABLE race_results
ADD CONSTRAINT chk_res_result_status
CHECK (result_status IN ('FINISHED', 'DISQUALIFIED', 'DID_NOT_FINISH', 'WITHDRAWN'));

CREATE UNIQUE INDEX uq_race_results_position
ON race_results(race_id, position)
WHERE position IS NOT NULL;

ALTER TABLE predictions
ADD CONSTRAINT chk_prediction_type
CHECK (prediction_type IN ('WINNER', 'TOP3'));

ALTER TABLE tournament_prize_tiers
ADD CONSTRAINT chk_prize_tier_position
CHECK (position > 0);

ALTER TABLE tournament_prize_tiers
ADD CONSTRAINT chk_prize_tier_amount
CHECK (prize_points >= 0);

ALTER TABLE races
ADD CONSTRAINT chk_races_distance
CHECK (distance_meter > 0);

ALTER TABLE race_results
ADD CONSTRAINT chk_race_results_points
CHECK (points >= 0);

ALTER TABLE race_results
ADD CONSTRAINT chk_race_results_prize
CHECK (prize_points >= 0);

ALTER TABLE race_results
ADD CONSTRAINT chk_finish_time_positive
CHECK (finish_time_seconds IS NULL OR finish_time_seconds > 0);

