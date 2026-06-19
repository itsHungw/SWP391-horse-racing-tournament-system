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

UPDATE users
SET status = 'ACTIVE'
WHERE status IS NULL OR LTRIM(RTRIM(status)) = '';

-- Fail fast during migration instead of allowing delayed enum hydration errors.
IF EXISTS (SELECT 1 FROM users WHERE status NOT IN ('ACTIVE', 'PENDING_EMAIL_VERIFY', 'INACTIVE', 'BANNED'))
    THROW 51000, 'Unsupported users.status value for UserStatus', 1;

IF EXISTS (SELECT 1 FROM user_roles WHERE status NOT IN ('ACTIVE', 'SUSPENDED', 'REMOVED'))
    THROW 51000, 'Unsupported user_roles.status value for UserRoleStatus', 1;

IF EXISTS (SELECT 1 FROM user_role_history WHERE old_status IS NOT NULL AND old_status NOT IN ('ACTIVE', 'SUSPENDED', 'REMOVED'))
    THROW 51000, 'Unsupported user_role_history.old_status value for UserRoleStatus', 1;

IF EXISTS (SELECT 1 FROM user_role_history WHERE new_status NOT IN ('ACTIVE', 'SUSPENDED', 'REMOVED'))
    THROW 51000, 'Unsupported user_role_history.new_status value for UserRoleStatus', 1;

IF EXISTS (SELECT 1 FROM role_requests WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
    THROW 51000, 'Unsupported role_requests.status value for RoleRequestStatus', 1;

IF EXISTS (SELECT 1 FROM horse_owner_profiles WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'))
    THROW 51000, 'Unsupported horse_owner_profiles.status value for ProfileStatus', 1;

IF EXISTS (SELECT 1 FROM tournaments WHERE status NOT IN (
    'DRAFT', 'POSTPONED', 'OPEN_REGISTRATION', 'CLOSED_REGISTRATION',
    'PARTICIPANTS_LOCKED', 'SCHEDULE_PUBLISHED', 'ONGOING', 'COMPLETED'
))
    THROW 51000, 'Unsupported tournaments.status value for TournamentStatus', 1;

IF EXISTS (SELECT 1 FROM tournament_registrations WHERE status NOT IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN'))
    THROW 51000, 'Unsupported tournament_registrations.status value for RegistrationStatus', 1;

IF EXISTS (SELECT 1 FROM jockey_tournament_applications WHERE status NOT IN ('PENDING', 'APPROVED_FOR_POOL', 'REJECTED', 'WITHDRAWN'))
    THROW 51000, 'Unsupported jockey_tournament_applications.status value for JockeyApplicationStatus', 1;

IF EXISTS (SELECT 1 FROM jockey_invitations WHERE status NOT IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'))
    THROW 51000, 'Unsupported jockey_invitations.status value for JockeyInvitationStatus', 1;

IF EXISTS (SELECT 1 FROM tournament_participants WHERE status NOT IN ('ACTIVE', 'WITHDRAWN', 'DISQUALIFIED'))
    THROW 51000, 'Unsupported tournament_participants.status value for TournamentParticipantStatus', 1;

IF EXISTS (SELECT 1 FROM races WHERE status NOT IN (
    'SCHEDULED', 'CHECKING', 'READY', 'ONGOING', 'FINISHED',
    'RESULT_SUBMITTED', 'RESULT_CONFIRMED', 'PUBLISHED', 'CANCELLED'
))
    THROW 51000, 'Unsupported races.status value for RaceStatus', 1;

IF EXISTS (SELECT 1 FROM race_participants WHERE check_status NOT IN ('NOT_CHECKED', 'PASSED', 'FAILED', 'CONDITIONAL'))
    THROW 51000, 'Unsupported race_participants.check_status value for ParticipantCheckStatus', 1;

IF EXISTS (SELECT 1 FROM race_participants WHERE confirmation_status NOT IN ('PENDING', 'CONFIRMED', 'REJECTED'))
    THROW 51000, 'Unsupported race_participants.confirmation_status value for ParticipantConfirmationStatus', 1;

IF EXISTS (SELECT 1 FROM race_participants WHERE status NOT IN ('REGISTERED', 'APPROVED', 'WITHDRAWN', 'DISQUALIFIED'))
    THROW 51000, 'Unsupported race_participants.status value for ParticipantStatus', 1;

IF EXISTS (SELECT 1 FROM race_results WHERE result_status NOT IN ('FINISHED', 'DISQUALIFIED', 'DID_NOT_FINISH', 'WITHDRAWN'))
    THROW 51000, 'Unsupported race_results.result_status value for ResultFinishStatus', 1;

IF EXISTS (SELECT 1 FROM race_results WHERE status NOT IN ('DRAFT', 'SUBMITTED', 'CONFIRMED', 'PUBLISHED', 'REJECTED'))
    THROW 51000, 'Unsupported race_results.status value for ResultRecordStatus', 1;

IF EXISTS (SELECT 1 FROM race_predictions WHERE status NOT IN ('PENDING', 'LOCKED', 'CORRECT', 'INCORRECT', 'CANCELLED', 'REFUNDED'))
    THROW 51000, 'Unsupported race_predictions.status value for PredictionStatus', 1;

IF EXISTS (SELECT 1 FROM prediction_settlement_jobs WHERE status NOT IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
    THROW 51000, 'Unsupported prediction_settlement_jobs.status value for PredictionSettlementJobStatus', 1;

IF EXISTS (SELECT 1 FROM streak_predictions WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'WON', 'LOST', 'REFUNDED'))
    THROW 51000, 'Unsupported streak_predictions.status value for StreakPredictionStatus', 1;

IF EXISTS (SELECT 1 FROM streak_prediction_legs WHERE status NOT IN ('PENDING', 'IN_PROGRESS', 'WON', 'LOST', 'REFUNDED'))
    THROW 51000, 'Unsupported streak_prediction_legs.status value for StreakPredictionStatus', 1;
