-- Normalize known legacy values before Hibernate reads enum-backed columns.
-- Discovery terms such as UPCOMING are not persisted domain statuses.
UPDATE races
SET status = 'SCHEDULED'
WHERE status IN ('SCHEDULED_PUBLIC', 'SCHEDULED_PRIVATE');

UPDATE tournaments
SET status = 'SCHEDULE_PUBLISHED'
WHERE status IN ('SCHEDULED', 'SCHEDULED_PUBLIC');

UPDATE tournaments
SET status = 'PARTICIPANTS_LOCKED'
WHERE status = 'SCHEDULED_PRIVATE';

UPDATE race_participants
SET status = 'APPROVED'
WHERE status = 'ACTIVE';

UPDATE horse_owner_profiles
SET status = 'APPROVED'
WHERE status = 'ACTIVE';

UPDATE jockey_tournament_applications
SET status = 'APPROVED_FOR_POOL'
WHERE status = 'APPROVED';

UPDATE race_participants
SET check_status = 'NOT_CHECKED'
WHERE check_status = 'PENDING';

-- T-SQL LTRIM(RTRIM(x)) -> Postgres btrim(x).
UPDATE users
SET status = 'ACTIVE'
WHERE status IS NULL OR btrim(status) = '';

-- Fail fast during migration instead of allowing delayed enum hydration errors.
-- T-SQL "IF EXISTS (...) THROW 51000, 'msg', 1;" -> a single PL/pgSQL block with
-- "IF EXISTS (...) THEN RAISE EXCEPTION 'msg'; END IF;".
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE status NOT IN ('ACTIVE', 'PENDING_EMAIL_VERIFY', 'INACTIVE', 'BANNED')) THEN
        RAISE EXCEPTION 'Unsupported users.status value for UserStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM user_roles WHERE status NOT IN ('ACTIVE', 'SUSPENDED', 'REMOVED')) THEN
        RAISE EXCEPTION 'Unsupported user_roles.status value for UserRoleStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM user_role_history WHERE old_status IS NOT NULL AND old_status NOT IN ('ACTIVE', 'SUSPENDED', 'REMOVED')) THEN
        RAISE EXCEPTION 'Unsupported user_role_history.old_status value for UserRoleStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM user_role_history WHERE new_status NOT IN ('ACTIVE', 'SUSPENDED', 'REMOVED')) THEN
        RAISE EXCEPTION 'Unsupported user_role_history.new_status value for UserRoleStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM role_requests WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) THEN
        RAISE EXCEPTION 'Unsupported role_requests.status value for RoleRequestStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM horse_owner_profiles WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')) THEN
        RAISE EXCEPTION 'Unsupported horse_owner_profiles.status value for ProfileStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM tournaments WHERE status NOT IN (
        'DRAFT', 'POSTPONED', 'OPEN_REGISTRATION', 'CLOSED_REGISTRATION',
        'PARTICIPANTS_LOCKED', 'SCHEDULE_PUBLISHED', 'ONGOING', 'COMPLETED')) THEN
        RAISE EXCEPTION 'Unsupported tournaments.status value for TournamentStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM tournament_registrations WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN')) THEN
        RAISE EXCEPTION 'Unsupported tournament_registrations.status value for RegistrationStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM jockey_tournament_applications WHERE status NOT IN ('PENDING', 'APPROVED_FOR_POOL', 'REJECTED', 'WITHDRAWN')) THEN
        RAISE EXCEPTION 'Unsupported jockey_tournament_applications.status value for JockeyApplicationStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM jockey_invitations WHERE status NOT IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')) THEN
        RAISE EXCEPTION 'Unsupported jockey_invitations.status value for JockeyInvitationStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM tournament_participants WHERE status NOT IN ('ACTIVE', 'WITHDRAWN', 'DISQUALIFIED')) THEN
        RAISE EXCEPTION 'Unsupported tournament_participants.status value for TournamentParticipantStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM races WHERE status NOT IN (
        'SCHEDULED', 'CHECKING', 'READY', 'ONGOING', 'FINISHED',
        'RESULT_SUBMITTED', 'RESULT_CONFIRMED', 'PUBLISHED', 'CANCELLED')) THEN
        RAISE EXCEPTION 'Unsupported races.status value for RaceStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM race_participants WHERE check_status NOT IN ('NOT_CHECKED', 'PASSED', 'FAILED', 'CONDITIONAL')) THEN
        RAISE EXCEPTION 'Unsupported race_participants.check_status value for ParticipantCheckStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM race_participants WHERE confirmation_status NOT IN ('PENDING', 'CONFIRMED', 'REJECTED')) THEN
        RAISE EXCEPTION 'Unsupported race_participants.confirmation_status value for ParticipantConfirmationStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM race_participants WHERE status NOT IN ('REGISTERED', 'APPROVED', 'WITHDRAWN', 'DISQUALIFIED')) THEN
        RAISE EXCEPTION 'Unsupported race_participants.status value for ParticipantStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM race_results WHERE result_status NOT IN ('FINISHED', 'DISQUALIFIED', 'DID_NOT_FINISH', 'WITHDRAWN')) THEN
        RAISE EXCEPTION 'Unsupported race_results.result_status value for ResultFinishStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM race_results WHERE status NOT IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PUBLISHED', 'REJECTED')) THEN
        RAISE EXCEPTION 'Unsupported race_results.status value for ResultRecordStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM race_predictions WHERE status NOT IN ('PENDING', 'LOCKED', 'CORRECT', 'INCORRECT', 'CANCELLED', 'REFUNDED')) THEN
        RAISE EXCEPTION 'Unsupported race_predictions.status value for PredictionStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM prediction_settlement_jobs WHERE status NOT IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')) THEN
        RAISE EXCEPTION 'Unsupported prediction_settlement_jobs.status value for PredictionSettlementJobStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM streak_predictions WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'WON', 'LOST', 'REFUNDED')) THEN
        RAISE EXCEPTION 'Unsupported streak_predictions.status value for StreakPredictionStatus';
    END IF;
    IF EXISTS (SELECT 1 FROM streak_prediction_legs WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'WON', 'LOST', 'REFUNDED')) THEN
        RAISE EXCEPTION 'Unsupported streak_prediction_legs.status value for StreakPredictionStatus';
    END IF;
END $$;
