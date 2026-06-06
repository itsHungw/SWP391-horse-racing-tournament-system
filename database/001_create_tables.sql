-- =====================================================================
-- Horse Racing Tournament Management System
-- Database Creation Script
-- Target Database: SQL Server
-- Version: 2.0
-- Update:
--   - Removed real-money/betting wording
--   - Replaced wallet/betting with clean Prediction Points
--   - Added blog reward anti-farming fields
--   - Added daily point earning limit table
-- =====================================================================

-- =====================================================================
-- 1. CORE USER TABLES
-- =====================================================================

CREATE DATABASE horseRacingDB
GO
USE horseRacingDB
GO

-- 1.1 users
CREATE TABLE users (
    id BIGINT NOT NULL IDENTITY(1,1),
    full_name NVARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    avatar_url VARCHAR(500) NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL, -- MALE / FEMALE / OTHER
    address NVARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_EMAIL_VERIFY', -- ACTIVE / LOCKED / DISABLED / PENDING_EMAIL_VERIFY
    email_verified BIT NOT NULL DEFAULT 0,
    phone_verified BIT NOT NULL DEFAULT 0,
    age_verified BIT NOT NULL DEFAULT 0,
    profile_completed BIT NOT NULL DEFAULT 0,
    last_login_at DATETIME2 NULL,
    password_changed_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_status CHECK (
        status IN ('ACTIVE', 'LOCKED', 'DISABLED', 'PENDING_EMAIL_VERIFY')
    ),
    CONSTRAINT chk_users_gender CHECK (
        gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')
    )
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
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / SUSPENDED / REMOVED
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
    CONSTRAINT chk_user_roles_status CHECK (
        status IN ('ACTIVE', 'SUSPENDED', 'REMOVED')
    )
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_status ON user_roles(status);

-- 1.3b user_role_history
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
    CONSTRAINT fk_urh_changed_by FOREIGN KEY (changed_by) REFERENCES users(id),
    CONSTRAINT chk_urh_old_status CHECK (
        old_status IS NULL OR old_status IN ('ACTIVE', 'SUSPENDED', 'REMOVED')
    ),
    CONSTRAINT chk_urh_new_status CHECK (
        new_status IN ('ACTIVE', 'SUSPENDED', 'REMOVED')
    )
);

-- 1.4 role_requests
CREATE TABLE role_requests (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    requested_role VARCHAR(50) NOT NULL, -- HORSE_OWNER / JOCKEY / REFEREE
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED / CANCELLED
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
    CONSTRAINT chk_role_requests_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    ),
    CONSTRAINT chk_role_requests_requested_role CHECK (
        requested_role IN ('HORSE_OWNER', 'JOCKEY', 'REFEREE')
    )
);

CREATE INDEX idx_role_requests_user_id ON role_requests(user_id);
CREATE INDEX idx_role_requests_status ON role_requests(status);
CREATE INDEX idx_role_requests_role ON role_requests(requested_role);

CREATE UNIQUE INDEX uq_role_requests_pending
ON role_requests(user_id, requested_role)
WHERE status = 'PENDING';

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
    logo_url VARCHAR(500) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED / SUSPENDED
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_horse_owner_profiles PRIMARY KEY (id),
    CONSTRAINT uq_horse_owner_user UNIQUE (user_id),
    CONSTRAINT fk_horse_owner_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_horse_owner_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_hop_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')
    ),
    CONSTRAINT chk_hop_experience CHECK (experience_years >= 0)
);

-- 2.2 jockey_profiles
CREATE TABLE jockey_profiles (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    license_number VARCHAR(100) NULL,
    height_cm DECIMAL(5,2) NULL,
    weight_kg DECIMAL(5,2) NULL,
    experience_years INT NOT NULL DEFAULT 0,
    riding_style VARCHAR(100) NULL, -- FRONT_RUNNER / CLOSER / BALANCED
    bio NVARCHAR(MAX) NULL,
    evidence_url VARCHAR(500) NULL,
    total_races INT NOT NULL DEFAULT 0,
    total_wins INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED / SUSPENDED
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_jockey_profiles PRIMARY KEY (id),
    CONSTRAINT uq_jockey_user UNIQUE (user_id),
    CONSTRAINT fk_jockey_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_jockey_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_jockey_profiles_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')
    ),
    CONSTRAINT chk_jockey_experience CHECK (experience_years >= 0),
    CONSTRAINT chk_jockey_stats CHECK (total_races >= 0 AND total_wins >= 0 AND total_wins <= total_races),
    CONSTRAINT chk_jockey_riding_style CHECK (
        riding_style IS NULL OR riding_style IN ('FRONT_RUNNER', 'CLOSER', 'BALANCED')
    )
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
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / ACTIVE / REJECTED / SUSPENDED / INACTIVE
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_referee_profiles PRIMARY KEY (id),
    CONSTRAINT uq_referee_user UNIQUE (user_id),
    CONSTRAINT fk_referee_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_referee_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_referee_profiles_status CHECK (
        status IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE')
    ),
    CONSTRAINT chk_referee_experience CHECK (experience_years >= 0)
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
    gender VARCHAR(20) NOT NULL, -- MALE / FEMALE
    date_of_birth DATE NULL,
    color NVARCHAR(50) NULL,
    height_cm DECIMAL(6,2) NULL,
    weight_kg DECIMAL(6,2) NULL,
    health_status VARCHAR(100) NULL,
    medical_note NVARCHAR(MAX) NULL,
    image_url VARCHAR(500) NULL,
    description NVARCHAR(MAX) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED / INACTIVE / SUSPENDED
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by BIGINT NULL,
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    deleted_at DATETIME2 NULL,

    CONSTRAINT pk_horses PRIMARY KEY (id),
    CONSTRAINT fk_horses_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_horses_approver FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_horses_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE', 'SUSPENDED')
    ),
    CONSTRAINT chk_horses_gender CHECK (gender IN ('MALE', 'FEMALE')),
    CONSTRAINT chk_horses_height CHECK (height_cm IS NULL OR height_cm > 0),
    CONSTRAINT chk_horses_weight CHECK (weight_kg IS NULL OR weight_kg > 0)
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
    CONSTRAINT chk_tournaments_max_horses CHECK (max_horses IS NULL OR max_horses > 0),
    CONSTRAINT chk_tournaments_status CHECK (
        status IN (
            'DRAFT',
            'OPEN_REGISTRATION',
            'CLOSED_REGISTRATION',
            'ONGOING',
            'COMPLETED',
            'POSTPONED'
        )
    )
);

CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournaments_deleted_at ON tournaments(deleted_at);

-- 3.2b tournament_prize_tiers
CREATE TABLE tournament_prize_tiers (
    id BIGINT NOT NULL IDENTITY(1,1),
    tournament_id BIGINT NOT NULL,
    position INT NOT NULL,
    prize_points INT NOT NULL,
    description NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT pk_tournament_prize_tiers PRIMARY KEY (id),
    CONSTRAINT uq_prize_tier UNIQUE (tournament_id, position),
    CONSTRAINT fk_prize_tier_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    CONSTRAINT chk_prize_tier_position CHECK (position > 0),
    CONSTRAINT chk_prize_tier_amount CHECK (prize_points >= 0)
);

-- 3.3 races
CREATE TABLE races (
    id BIGINT NOT NULL IDENTITY(1,1),
    tournament_id BIGINT NOT NULL,
    name NVARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    round_name NVARCHAR(100) NULL,
    race_number INT NULL,
    race_at DATETIME2 NOT NULL,
    distance_meter INT NOT NULL,
    track_name NVARCHAR(150) NULL,
    track_condition VARCHAR(50) NULL, -- DRY / WET / MUDDY / NORMAL
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
    CONSTRAINT chk_races_participants CHECK (
        max_participants >= min_participants AND min_participants >= 2
    ),
    CONSTRAINT chk_races_distance CHECK (distance_meter > 0),
    CONSTRAINT chk_races_race_number CHECK (race_number IS NULL OR race_number > 0),
    CONSTRAINT chk_races_track_condition CHECK (
        track_condition IS NULL OR track_condition IN ('DRY', 'WET', 'MUDDY', 'NORMAL')
    ),
    CONSTRAINT chk_races_status CHECK (
        status IN (
            'SCHEDULED',
            'CHECKING',
            'READY',
            'ONGOING',
            'FINISHED',
            'RESULT_SUBMITTED',
            'RESULT_CONFIRMED',
            'PUBLISHED',
            'CANCELLED'
        )
    )
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
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED / WITHDRAWN
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
    CONSTRAINT chk_reg_status CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')
    )
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
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / ACCEPTED / REJECTED / CANCELLED / EXPIRED
    response_message NVARCHAR(MAX) NULL,
    responded_at DATETIME2 NULL,
    expired_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_jockey_invitations PRIMARY KEY (id),
    CONSTRAINT fk_inv_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_inv_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_inv_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_inv_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT chk_inv_status CHECK (
        status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')
    )
);

CREATE INDEX idx_inv_jockey_id ON jockey_invitations(jockey_id);
CREATE INDEX idx_inv_owner_id ON jockey_invitations(owner_id);
CREATE INDEX idx_inv_race_id ON jockey_invitations(race_id);
CREATE INDEX idx_inv_status ON jockey_invitations(status);

CREATE UNIQUE INDEX uq_jockey_invitations_pending
ON jockey_invitations(race_id, horse_id)
WHERE status = 'PENDING';

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
    confirmation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING / CONFIRMED / WITHDRAWN
    check_status VARCHAR(30) NOT NULL DEFAULT 'NOT_CHECKED', -- NOT_CHECKED / PASSED / FAILED / CONDITIONAL
    status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED', -- REGISTERED / APPROVED / DISQUALIFIED / WITHDRAWN
    check_note NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_race_participants PRIMARY KEY (id),
    CONSTRAINT uq_race_horse UNIQUE (race_id, horse_id),
    CONSTRAINT fk_rp_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_rp_horse FOREIGN KEY (horse_id) REFERENCES horses(id),
    CONSTRAINT fk_rp_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_rp_jockey FOREIGN KEY (jockey_id) REFERENCES users(id),
    CONSTRAINT fk_rp_invitation FOREIGN KEY (invitation_id) REFERENCES jockey_invitations(id),
    CONSTRAINT chk_rp_confirmation_status CHECK (
        confirmation_status IN ('PENDING', 'CONFIRMED', 'WITHDRAWN')
    ),
    CONSTRAINT chk_rp_check_status CHECK (
        check_status IN ('NOT_CHECKED', 'PASSED', 'FAILED', 'CONDITIONAL')
    ),
    CONSTRAINT chk_rp_status CHECK (
        status IN ('REGISTERED', 'APPROVED', 'DISQUALIFIED', 'WITHDRAWN')
    ),
    CONSTRAINT chk_rp_start_number CHECK (start_number IS NULL OR start_number > 0),
    CONSTRAINT chk_rp_lane_number CHECK (lane_number IS NULL OR lane_number > 0),
    CONSTRAINT chk_rp_weight CHECK (weight_carried_kg IS NULL OR weight_carried_kg > 0)
);

CREATE INDEX idx_rp_race_id ON race_participants(race_id);
CREATE INDEX idx_rp_horse_id ON race_participants(horse_id);
CREATE INDEX idx_rp_jockey_id ON race_participants(jockey_id);

CREATE UNIQUE INDEX uq_rp_race_jockey
ON race_participants(race_id, jockey_id)
WHERE jockey_id IS NOT NULL;

CREATE UNIQUE INDEX uq_rp_race_start_number
ON race_participants(race_id, start_number)
WHERE start_number IS NOT NULL;

CREATE UNIQUE INDEX uq_rp_race_lane_number
ON race_participants(race_id, lane_number)
WHERE lane_number IS NOT NULL;

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
    result VARCHAR(30) NOT NULL, -- PASSED / FAILED / CONDITIONAL
    note NVARCHAR(MAX) NULL,
    checked_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT pk_pre_race_checks PRIMARY KEY (id),
    CONSTRAINT uq_race_participant_check UNIQUE (race_id, participant_id),
    CONSTRAINT fk_prc_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_prc_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT fk_prc_referee FOREIGN KEY (referee_id) REFERENCES users(id),
    CONSTRAINT chk_prc_result CHECK (
        result IN ('PASSED', 'FAILED', 'CONDITIONAL')
    )
);

-- 4.4 violations
CREATE TABLE violations (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NULL,
    violation_type VARCHAR(100) NULL,
    reported_by BIGINT NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    penalty VARCHAR(150) NULL,
    severity VARCHAR(30) NULL, -- LOW / MEDIUM / HIGH
    occurred_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_violations PRIMARY KEY (id),
    CONSTRAINT fk_vio_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_vio_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT fk_vio_reporter FOREIGN KEY (reported_by) REFERENCES users(id),
    CONSTRAINT chk_vio_severity CHECK (
        severity IS NULL OR severity IN ('LOW', 'MEDIUM', 'HIGH')
    )
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
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT / SUBMITTED / CONFIRMED / REJECTED
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
    CONSTRAINT chk_rr_status CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'REJECTED')
    )
);

-- =====================================================================
-- 5. RESULT & RANKING TABLES
-- =====================================================================

-- 5.1 race_results
CREATE TABLE race_results (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    position INT NULL, -- NULL for DISQUALIFIED / DID_NOT_FINISH / WITHDRAWN
    finish_time_seconds DECIMAL(10,3) NULL,
    result_status VARCHAR(30) NOT NULL, -- FINISHED / DISQUALIFIED / DID_NOT_FINISH / WITHDRAWN
    points INT NOT NULL DEFAULT 0,
    prize_points INT NOT NULL DEFAULT 0,
    note NVARCHAR(MAX) NULL,
    submitted_by BIGINT NOT NULL,
    submitted_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    confirmed_by BIGINT NULL,
    confirmed_at DATETIME2 NULL,
    published_at DATETIME2 NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT / SUBMITTED / CONFIRMED / PUBLISHED / REJECTED
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_race_results PRIMARY KEY (id),
    CONSTRAINT uq_race_participant_result UNIQUE (race_id, participant_id),
    CONSTRAINT fk_res_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_res_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT fk_res_submitter FOREIGN KEY (submitted_by) REFERENCES users(id),
    CONSTRAINT fk_res_confirmer FOREIGN KEY (confirmed_by) REFERENCES users(id),
    CONSTRAINT chk_res_status CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PUBLISHED', 'REJECTED')
    ),
    CONSTRAINT chk_res_result_status CHECK (
        result_status IN ('FINISHED', 'DISQUALIFIED', 'DID_NOT_FINISH', 'WITHDRAWN')
    ),
    CONSTRAINT chk_race_results_points CHECK (points >= 0),
    CONSTRAINT chk_race_results_prize CHECK (prize_points >= 0),
    CONSTRAINT chk_finish_time_positive CHECK (
        finish_time_seconds IS NULL OR finish_time_seconds > 0
    ),
    CONSTRAINT chk_res_position CHECK (position IS NULL OR position > 0)
);

CREATE INDEX idx_res_race_id ON race_results(race_id);
CREATE INDEX idx_res_status ON race_results(status);

CREATE UNIQUE INDEX uq_race_results_position
ON race_results(race_id, position)
WHERE position IS NOT NULL;

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
    CONSTRAINT fk_rank_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT chk_rank_stats CHECK (
        total_races >= 0
        AND total_wins >= 0
        AND total_wins <= total_races
        AND total_points >= 0
        AND total_prize_points >= 0
    ),
    CONSTRAINT chk_rank_position CHECK (rank_position IS NULL OR rank_position > 0)
);

CREATE INDEX idx_rank_tournament ON tournament_rankings(tournament_id);

-- =====================================================================
-- 6. PREDICTION POINTS & NOTIFICATIONS
-- =====================================================================

-- 6.1 user_point_accounts
-- Notes:
--   - This is NOT a real-money wallet.
--   - Points cannot be deposited with money.
--   - Points cannot be withdrawn or converted into money.
--   - Points are used only for gamified race prediction.
CREATE TABLE user_point_accounts (
    user_id BIGINT NOT NULL,
    point_balance INT NOT NULL DEFAULT 0,
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT pk_user_point_accounts PRIMARY KEY (user_id),
    CONSTRAINT fk_upa_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_upa_balance CHECK (point_balance >= 0)
);

-- 6.1a point_transactions
CREATE TABLE point_transactions (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,

    amount INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,

    reference_type VARCHAR(50) NULL,
    reference_id BIGINT NULL,

    description NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT pk_point_transactions PRIMARY KEY (id),
    CONSTRAINT fk_pt_user FOREIGN KEY (user_id) REFERENCES users(id),

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

CREATE INDEX idx_pt_user_id ON point_transactions(user_id);
CREATE INDEX idx_pt_type ON point_transactions(transaction_type);
CREATE INDEX idx_pt_created_at ON point_transactions(created_at);
CREATE INDEX idx_pt_reference ON point_transactions(reference_type, reference_id);

-- 6.1b race_predictions
CREATE TABLE race_predictions (
    id BIGINT NOT NULL IDENTITY(1,1),

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

    CONSTRAINT fk_rpred_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_rpred_spectator FOREIGN KEY (spectator_id) REFERENCES users(id),

    CONSTRAINT fk_rpred_winner FOREIGN KEY (predicted_winner_id) REFERENCES race_participants(id),
    CONSTRAINT fk_rpred_second FOREIGN KEY (predicted_second_id) REFERENCES race_participants(id),
    CONSTRAINT fk_rpred_third FOREIGN KEY (predicted_third_id) REFERENCES race_participants(id),

    CONSTRAINT chk_rpred_type CHECK (
        prediction_type IN ('WINNER', 'TOP3')
    ),

    CONSTRAINT chk_rpred_entry_cost CHECK (
        entry_cost_points > 0
    ),

    CONSTRAINT chk_rpred_reward_points CHECK (
        reward_points >= 0
    ),

    CONSTRAINT chk_rpred_status CHECK (
        status IN (
            'PENDING',
            'LOCKED',
            'CORRECT',
            'INCORRECT',
            'CANCELLED',
            'REFUNDED'
        )
    ),
    CONSTRAINT chk_rpred_top3_distinct CHECK (
        prediction_type <> 'TOP3'
        OR (
            predicted_second_id IS NOT NULL
            AND predicted_third_id IS NOT NULL
            AND predicted_winner_id <> predicted_second_id
            AND predicted_winner_id <> predicted_third_id
            AND predicted_second_id <> predicted_third_id
        )
    )
);

CREATE INDEX idx_rpred_race_id ON race_predictions(race_id);
CREATE INDEX idx_rpred_spectator_id ON race_predictions(spectator_id);
CREATE INDEX idx_rpred_status ON race_predictions(status);

-- 6.1c ai_predictions
CREATE TABLE ai_predictions (
    id BIGINT NOT NULL IDENTITY(1,1),
    race_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    win_probability DECIMAL(5,4) NOT NULL,
    predicted_position INT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    ai_model_version VARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT pk_ai_predictions PRIMARY KEY (id),
    CONSTRAINT uq_ai_pred UNIQUE (race_id, participant_id),
    CONSTRAINT fk_aipred_race FOREIGN KEY (race_id) REFERENCES races(id),
    CONSTRAINT fk_aipred_participant FOREIGN KEY (participant_id) REFERENCES race_participants(id),
    CONSTRAINT chk_aipred_probability CHECK (
        win_probability >= 0 AND win_probability <= 1
    ),
    CONSTRAINT chk_aipred_confidence CHECK (
        confidence_score >= 0 AND confidence_score <= 1
    ),
    CONSTRAINT chk_aipred_position CHECK (
        predicted_position IS NULL OR predicted_position > 0
    )
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

    reward_points INT NOT NULL DEFAULT 0,

    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT / PUBLISHED / HIDDEN
    published_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_blogs PRIMARY KEY (id),
    CONSTRAINT uq_blogs_slug UNIQUE (slug),
    CONSTRAINT fk_blogs_author FOREIGN KEY (author_id) REFERENCES users(id),

    CONSTRAINT chk_blogs_status CHECK (
        status IN ('DRAFT', 'PUBLISHED', 'HIDDEN')
    ),

    CONSTRAINT chk_blogs_reward_points CHECK (
        reward_points >= 0
    )
);

CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_published_at ON blogs(published_at);

-- 7.2 user_blog_rewards
CREATE TABLE user_blog_rewards (
    id BIGINT NOT NULL IDENTITY(1,1),

    user_id BIGINT NOT NULL,
    blog_id BIGINT NOT NULL,

    points_earned INT NOT NULL,

    reading_seconds INT NOT NULL DEFAULT 0,
    scroll_percent INT NOT NULL DEFAULT 0,

    reward_status VARCHAR(30) NOT NULL DEFAULT 'CLAIMED',

    earned_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT pk_user_blog_rewards PRIMARY KEY (id),
    CONSTRAINT uq_user_blog_reward UNIQUE (user_id, blog_id),

    CONSTRAINT fk_ubr_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ubr_blog FOREIGN KEY (blog_id) REFERENCES blogs(id),

    CONSTRAINT chk_ubr_points CHECK (points_earned >= 0),
    CONSTRAINT chk_ubr_reading_seconds CHECK (reading_seconds >= 0),
    CONSTRAINT chk_ubr_scroll CHECK (
        scroll_percent >= 0 AND scroll_percent <= 100
    ),

    CONSTRAINT chk_ubr_status CHECK (
        reward_status IN ('CLAIMED', 'REVOKED')
    )
);

CREATE INDEX idx_ubr_user_id ON user_blog_rewards(user_id);
CREATE INDEX idx_ubr_blog_id ON user_blog_rewards(blog_id);
CREATE INDEX idx_ubr_earned_at ON user_blog_rewards(earned_at);

-- 7.3 user_daily_point_limits
CREATE TABLE user_daily_point_limits (
    id BIGINT NOT NULL IDENTITY(1,1),

    user_id BIGINT NOT NULL,
    point_date DATE NOT NULL,

    points_earned_from_blog INT NOT NULL DEFAULT 0,
    points_earned_total INT NOT NULL DEFAULT 0,

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT pk_user_daily_point_limits PRIMARY KEY (id),
    CONSTRAINT uq_user_daily_point UNIQUE (user_id, point_date),

    CONSTRAINT fk_udpl_user FOREIGN KEY (user_id) REFERENCES users(id),

    CONSTRAINT chk_udpl_blog_points CHECK (points_earned_from_blog >= 0),
    CONSTRAINT chk_udpl_total_points CHECK (points_earned_total >= 0)
);

CREATE INDEX idx_udpl_user_date ON user_daily_point_limits(user_id, point_date);

-- =====================================================================
-- 8. AUTHENTICATION SUPPORT TABLES
-- =====================================================================

CREATE TABLE auth_sessions (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent NVARCHAR(500) NULL,
    ip_address VARCHAR(100) NULL,
    expires_at DATETIME2 NOT NULL,
    revoked_at DATETIME2 NULL,
    replaced_by_session_id BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    last_used_at DATETIME2 NULL,
    CONSTRAINT pk_auth_sessions PRIMARY KEY (id),
    CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_auth_sessions_replaced_by FOREIGN KEY (replaced_by_session_id) REFERENCES auth_sessions(id)
);

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);

CREATE TABLE email_verification_tokens (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_email_verification_tokens PRIMARY KEY (id),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_evt_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_evt_expires_at ON email_verification_tokens(expires_at);

CREATE TABLE password_reset_tokens (
    id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY (id),
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_prt_expires_at ON password_reset_tokens(expires_at);

-- =====================================================================
-- 9. BUSINESS RULE NOTES
-- =====================================================================

-- Prediction Points:
--   1. Points are virtual in-system points only.
--   2. Points cannot be deposited with real money.
--   3. Points cannot be withdrawn.
--   4. Points cannot be converted to real money.
--   5. Users may earn points from reading published blogs or admin/event rewards.
--   6. Users may spend points on fixed-cost race predictions.
--
-- Recommended backend rules:
--   - Each prediction uses a fixed entry cost defined by system rules.
--   - Lock predictions before race starts.
--   - Do not allow prediction creation/update after status is LOCKED.
--   - If race is CANCELLED, refund entry_cost_points.
--   - Correct predictions receive a fixed reward based on prediction_type and result accuracy.
--   - Incorrect predictions keep reward_points = 0 and do not receive refunds.
--
-- Blog Reward Anti-Farming:
--   - Blog must be PUBLISHED.
--   - User can claim each blog only once.
--   - reading_seconds should be >= 30.
--   - scroll_percent should be >= 80.
--   - Daily blog reward limit should be checked by backend, for example 100 points/day.

-- =====================================================================
-- END OF SCRIPT
-- =====================================================================
 