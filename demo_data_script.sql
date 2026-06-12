-- ==============================================================================
-- CLEAN AND RE-SEED DEMO DATA SCRIPT
-- ==============================================================================
-- This script will clear all existing data and insert a fresh, comprehensive set
-- of demo data covering all roles, statuses, and key entities in the system.
-- 
-- INSTRUCTIONS:
-- Run this script against your SQL Server database to reset it for tomorrow's demo.
-- Note: 'roles' and 'point_settings' are preserved as they are reference data.
-- ==============================================================================

-- 1. DELETE ALL DATA IN REVERSE DEPENDENCY ORDER
DELETE FROM pre_race_checks;
DELETE FROM violations;
DELETE FROM referee_reports;
DELETE FROM race_results;
DELETE FROM race_participants;
DELETE FROM race_predictions;
DELETE FROM prediction_settlement_jobs;
DELETE FROM races;
DELETE FROM tournament_participants;
DELETE FROM jockey_invitations;
DELETE FROM tournament_registrations;
DELETE FROM jockey_tournament_applications;
DELETE FROM tournaments;
DELETE FROM horse_documents;
DELETE FROM horses;
DELETE FROM horse_owner_profiles;
DELETE FROM referee_profiles;
DELETE FROM user_blog_rewards;
DELETE FROM blogs;
DELETE FROM role_requests;
DELETE FROM stored_files;
DELETE FROM auth_sessions;
DELETE FROM email_verification_tokens;
DELETE FROM password_reset_tokens;
DELETE FROM point_transactions;
DELETE FROM user_daily_point_limits;
DELETE FROM user_point_accounts;
DELETE FROM user_role_history;
DELETE FROM user_roles;
-- Users deleted last
DELETE FROM users;

-- 2. RESET IDENTITIES
DBCC CHECKIDENT ('pre_race_checks', RESEED, 0);
DBCC CHECKIDENT ('violations', RESEED, 0);
DBCC CHECKIDENT ('referee_reports', RESEED, 0);
DBCC CHECKIDENT ('race_results', RESEED, 0);
DBCC CHECKIDENT ('race_participants', RESEED, 0);
DBCC CHECKIDENT ('race_predictions', RESEED, 0);
DBCC CHECKIDENT ('prediction_settlement_jobs', RESEED, 0);
DBCC CHECKIDENT ('races', RESEED, 0);
DBCC CHECKIDENT ('tournament_participants', RESEED, 0);
DBCC CHECKIDENT ('jockey_invitations', RESEED, 0);
DBCC CHECKIDENT ('tournament_registrations', RESEED, 0);
DBCC CHECKIDENT ('jockey_tournament_applications', RESEED, 0);
DBCC CHECKIDENT ('tournaments', RESEED, 0);
DBCC CHECKIDENT ('horse_documents', RESEED, 0);
DBCC CHECKIDENT ('horses', RESEED, 0);
DBCC CHECKIDENT ('horse_owner_profiles', RESEED, 0);
DBCC CHECKIDENT ('referee_profiles', RESEED, 0);
DBCC CHECKIDENT ('user_blog_rewards', RESEED, 0);
DBCC CHECKIDENT ('blogs', RESEED, 0);
DBCC CHECKIDENT ('role_requests', RESEED, 0);
DBCC CHECKIDENT ('stored_files', RESEED, 0);
DBCC CHECKIDENT ('auth_sessions', RESEED, 0);
DBCC CHECKIDENT ('email_verification_tokens', RESEED, 0);
DBCC CHECKIDENT ('password_reset_tokens', RESEED, 0);
DBCC CHECKIDENT ('point_transactions', RESEED, 0);
DBCC CHECKIDENT ('user_daily_point_limits', RESEED, 0);
DBCC CHECKIDENT ('user_role_history', RESEED, 0);
DBCC CHECKIDENT ('user_roles', RESEED, 0);
DBCC CHECKIDENT ('users', RESEED, 0);


-- ==============================================================================
-- 3. INSERT USERS (Password for all users: 'password123')
-- ==============================================================================
SET IDENTITY_INSERT users ON;
INSERT INTO users (id, age_verified, date_of_birth, email_verified, phone_verified, profile_completed, created_at, status, email, full_name, password_hash) VALUES
(1, 1, '1990-01-01', 1, 1, 1, GETDATE(), 'ACTIVE', 'admin@example.com', 'System Admin', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(2, 1, '1985-05-15', 1, 1, 1, GETDATE(), 'ACTIVE', 'owner1@example.com', 'John Owner (Approved)', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(3, 1, '1980-11-20', 1, 1, 1, GETDATE(), 'ACTIVE', 'owner2@example.com', 'Pending Owner (Pending)', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(4, 1, '1995-03-10', 1, 1, 1, GETDATE(), 'ACTIVE', 'jockey1@example.com', 'Mike Jockey', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(5, 1, '1998-08-22', 1, 1, 1, GETDATE(), 'ACTIVE', 'jockey2@example.com', 'Tom Jockey', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(6, 1, '1975-12-05', 1, 1, 1, GETDATE(), 'ACTIVE', 'referee1@example.com', 'Bob Referee (Approved)', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(7, 1, '1982-04-18', 1, 1, 1, GETDATE(), 'ACTIVE', 'referee2@example.com', 'Pending Referee (Pending)', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(8, 1, '2000-01-01', 1, 1, 1, GETDATE(), 'ACTIVE', 'spectator1@example.com', 'Alice Spectator', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(9, 1, '2001-02-02', 1, 1, 1, GETDATE(), 'ACTIVE', 'spectator2@example.com', 'Bob Spectator', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S'),
(10, 1, '2002-03-03', 1, 1, 1, GETDATE(), 'ACTIVE', 'spectator3@example.com', 'Charlie Spectator', '$2a$10$w81.mS.iJ5d3iXbN8/3Y.eml8yO./c1N2.h3nN5x/6Z.K1Z/O5Y7S');
SET IDENTITY_INSERT users OFF;

-- ==============================================================================
-- 4. ASSIGN ROLES
-- Roles from seed: 1=ADMIN, 2=HORSE_OWNER, 3=JOCKEY, 4=REFEREE, 5=SPECTATOR
-- ==============================================================================
SET IDENTITY_INSERT user_roles ON;
INSERT INTO user_roles (id, assigned_at, role_id, user_id, status) VALUES
(1, GETDATE(), 1, 1, 'ACTIVE'),
(2, GETDATE(), 2, 2, 'ACTIVE'),
(3, GETDATE(), 2, 3, 'ACTIVE'),
(4, GETDATE(), 3, 4, 'ACTIVE'),
(5, GETDATE(), 3, 5, 'ACTIVE'),
(6, GETDATE(), 4, 6, 'ACTIVE'),
(7, GETDATE(), 4, 7, 'ACTIVE'),
(8, GETDATE(), 5, 8, 'ACTIVE'),
(9, GETDATE(), 5, 9, 'ACTIVE'),
(10, GETDATE(), 5, 10, 'ACTIVE');
SET IDENTITY_INSERT user_roles OFF;

-- ==============================================================================
-- 5. POINTS AND REWARDS
-- ==============================================================================
INSERT INTO user_point_accounts (user_id, point_balance, updated_at) VALUES
(8, 1000, GETDATE()),
(9, 500, GETDATE()),
(10, 0, GETDATE());

-- ==============================================================================
-- 6. PROFILES
-- ==============================================================================
SET IDENTITY_INSERT horse_owner_profiles ON;
INSERT INTO horse_owner_profiles (id, experience_years, created_at, user_id, status, owner_name, organization_name, license_number, approved_at, approved_by) VALUES
(1, 5, GETDATE(), 2, 'ACTIVE', 'John Owner', 'John Stables', 'LIC-OWN-001', GETDATE(), 1),
(2, 2, GETDATE(), 3, 'PENDING', 'Pending Owner', 'Pending Stables', 'LIC-OWN-002', NULL, NULL);
SET IDENTITY_INSERT horse_owner_profiles OFF;

SET IDENTITY_INSERT referee_profiles ON;
INSERT INTO referee_profiles (id, experience_years, created_at, user_id, status, license_number, approved_at, approved_by) VALUES
(1, 10, GETDATE(), 6, 'ACTIVE', 'LIC-REF-001', GETDATE(), 1),
(2, 3, GETDATE(), 7, 'PENDING', 'LIC-REF-002', NULL, NULL);
SET IDENTITY_INSERT referee_profiles OFF;

-- ==============================================================================
-- 7. HORSES
-- Statuses: APPROVED, PENDING, REJECTED, RETIRED, INACTIVE
-- ==============================================================================
SET IDENTITY_INSERT horses ON;
INSERT INTO horses (id, owner_id, name, registration_code, breed, color, gender, date_of_birth, height_cm, weight_kg, status, created_at, approved_at, approved_by, rejection_reason) VALUES
(1, 2, 'Thunderbolt', 'HORSE-001', 'Thoroughbred', 'Black', 'STALLION', '2018-01-01', 160, 500, 'APPROVED', GETDATE(), GETDATE(), 1, NULL),
(2, 2, 'Lightning', 'HORSE-002', 'Arabian', 'White', 'MARE', '2019-05-10', 155, 450, 'APPROVED', GETDATE(), GETDATE(), 1, NULL),
(3, 2, 'Storm', 'HORSE-003', 'Quarter Horse', 'Brown', 'GELDING', '2020-03-15', 158, 480, 'PENDING', GETDATE(), NULL, NULL, NULL),
(4, 2, 'Shadow', 'HORSE-004', 'Appaloosa', 'Spotted', 'STALLION', '2017-08-22', 162, 510, 'REJECTED', GETDATE(), NULL, NULL, 'Missing documentation'),
(5, 2, 'Spirit', 'HORSE-005', 'Mustang', 'Dun', 'GELDING', '2015-11-30', 150, 420, 'RETIRED', GETDATE(), GETDATE(), 1, NULL);
SET IDENTITY_INSERT horses OFF;

-- ==============================================================================
-- 8. TOURNAMENTS
-- Statuses: UPCOMING, ONGOING, COMPLETED, CANCELLED, REGISTRATION_OPEN
-- ==============================================================================
SET IDENTITY_INSERT tournaments ON;
INSERT INTO tournaments (id, code, name, description, location, registration_start_at, registration_end_at, start_date, end_date, max_horses, max_horses_per_owner, status, created_at, created_by) VALUES
(1, 'TRN-2026-01', 'Spring Cup 2026 (Completed)', 'Annual spring cup tournament', 'Hanoi City Track', '2026-01-01', '2026-02-01', '2026-03-01', '2026-03-10', 100, 2, 'COMPLETED', GETDATE(), 1),
(2, 'TRN-2026-02', 'Summer Grand Prix (Registration)', 'Summer championship', 'Da Nang Arena', '2026-05-01', '2026-06-10', '2026-06-20', '2026-06-30', 50, 2, 'REGISTRATION_OPEN', GETDATE(), 1),
(3, 'TRN-2026-03', 'Autumn Classic (Upcoming)', 'Autumn racing festival', 'Ho Chi Minh Derby', '2026-08-01', '2026-08-20', '2026-09-01', '2026-09-05', 80, 2, 'UPCOMING', GETDATE(), 1),
(4, 'TRN-2026-04', 'Winter Derby (Cancelled)', 'Winter challenge', 'Da Lat Track', '2025-11-01', '2025-12-01', '2026-01-01', '2026-01-05', 60, 2, 'CANCELLED', GETDATE(), 1),
(5, 'TRN-2026-05', 'Current Championship (Ongoing)', 'Live ongoing tournament', 'Hanoi City Track', '2026-04-01', '2026-05-01', '2026-06-10', '2026-06-25', 40, 2, 'ONGOING', GETDATE(), 1);
SET IDENTITY_INSERT tournaments OFF;

-- ==============================================================================
-- 9. TOURNAMENT REGISTRATIONS
-- Statuses: PENDING, APPROVED, REJECTED, WITHDRAWN
-- ==============================================================================
SET IDENTITY_INSERT tournament_registrations ON;
INSERT INTO tournament_registrations (id, tournament_id, owner_id, horse_id, status, created_at, reviewed_at, reviewed_by, rejection_reason) VALUES
(1, 1, 2, 1, 'APPROVED', GETDATE(), GETDATE(), 1, NULL),
(2, 1, 2, 2, 'APPROVED', GETDATE(), GETDATE(), 1, NULL),
(3, 2, 2, 1, 'PENDING', GETDATE(), NULL, NULL, NULL),
(4, 2, 2, 2, 'APPROVED', GETDATE(), GETDATE(), 1, NULL),
(5, 5, 2, 1, 'APPROVED', GETDATE(), GETDATE(), 1, NULL),
(6, 5, 2, 2, 'REJECTED', GETDATE(), GETDATE(), 1, 'Horse does not meet weight requirements for this tournament');
SET IDENTITY_INSERT tournament_registrations OFF;

-- ==============================================================================
-- 10. JOCKEY APPLICATIONS
-- Statuses: PENDING, APPROVED, REJECTED, WITHDRAWN
-- ==============================================================================
SET IDENTITY_INSERT jockey_tournament_applications ON;
INSERT INTO jockey_tournament_applications (id, tournament_id, jockey_id, status, created_at, reviewed_at, reviewed_by) VALUES
(1, 1, 4, 'APPROVED', GETDATE(), GETDATE(), 1),
(2, 1, 5, 'APPROVED', GETDATE(), GETDATE(), 1),
(3, 2, 4, 'PENDING', GETDATE(), NULL, NULL),
(4, 5, 4, 'APPROVED', GETDATE(), GETDATE(), 1),
(5, 5, 5, 'APPROVED', GETDATE(), GETDATE(), 1);
SET IDENTITY_INSERT jockey_tournament_applications OFF;

-- ==============================================================================
-- 11. JOCKEY INVITATIONS
-- Statuses: PENDING, ACCEPTED, REJECTED, CANCELLED
-- ==============================================================================
SET IDENTITY_INSERT jockey_invitations ON;
INSERT INTO jockey_invitations (id, tournament_registration_id, tournament_id, horse_id, owner_id, jockey_application_id, jockey_id, status, created_at, accepted_at) VALUES
(1, 1, 1, 1, 2, 1, 4, 'ACCEPTED', GETDATE(), GETDATE()),
(2, 2, 1, 2, 2, 2, 5, 'ACCEPTED', GETDATE(), GETDATE()),
(3, 5, 5, 1, 2, 4, 4, 'ACCEPTED', GETDATE(), GETDATE()),
(4, 4, 2, 2, 2, 3, 4, 'PENDING', GETDATE(), NULL);
SET IDENTITY_INSERT jockey_invitations OFF;

-- ==============================================================================
-- 12. TOURNAMENT PARTICIPANTS
-- Statuses: ACTIVE, WITHDRAWN, DISQUALIFIED
-- ==============================================================================
SET IDENTITY_INSERT tournament_participants ON;
INSERT INTO tournament_participants (id, tournament_registration_id, tournament_id, horse_id, owner_id, jockey_invitation_id, jockey_id, status, points, created_at) VALUES
(1, 1, 1, 1, 2, 1, 4, 'ACTIVE', 10, GETDATE()),
(2, 2, 1, 2, 2, 2, 5, 'ACTIVE', 5, GETDATE()),
(3, 5, 5, 1, 2, 3, 4, 'ACTIVE', 0, GETDATE());
SET IDENTITY_INSERT tournament_participants OFF;

-- ==============================================================================
-- 13. RACES
-- Statuses: SCHEDULED, ONGOING, COMPLETED, CANCELLED
-- ==============================================================================
SET IDENTITY_INSERT races ON;
INSERT INTO races (id, tournament_id, code, name, race_number, round_name, distance_meter, min_participants, max_participants, race_at, referee_id, status, created_at, created_by) VALUES
(1, 1, 'RACE-1-001', 'Final Race', 1, 'Final', 1200, 2, 8, '2026-03-10 15:00:00', 6, 'COMPLETED', GETDATE(), 1),
(2, 5, 'RACE-5-001', 'Qualifier 1', 1, 'Qualifier', 1000, 2, 10, '2026-06-15 14:00:00', 6, 'ONGOING', GETDATE(), 1),
(3, 5, 'RACE-5-002', 'Qualifier 2', 2, 'Qualifier', 1000, 2, 10, '2026-06-20 14:00:00', 6, 'SCHEDULED', GETDATE(), 1),
(4, 5, 'RACE-5-003', 'Canceled Race', 3, 'Qualifier', 1000, 2, 10, '2026-06-22 14:00:00', 6, 'CANCELLED', GETDATE(), 1);
SET IDENTITY_INSERT races OFF;

-- ==============================================================================
-- 14. RACE PARTICIPANTS
-- Statuses: REGISTERED, CHECKED_IN, RACING, FINISHED, SCRATCHED, DISQUALIFIED
-- Check statuses: PENDING, PASSED, FAILED
-- Conf statuses: PENDING, CONFIRMED, REJECTED
-- ==============================================================================
SET IDENTITY_INSERT race_participants ON;
INSERT INTO race_participants (id, race_id, horse_id, owner_id, jockey_id, invitation_id, lane_number, start_number, weight_carried_kg, check_status, confirmation_status, status, created_at) VALUES
-- Race 1 (Completed)
(1, 1, 1, 2, 4, 1, 1, 1, 55.5, 'PASSED', 'CONFIRMED', 'FINISHED', GETDATE()),
(2, 1, 2, 2, 5, 2, 2, 2, 54.0, 'PASSED', 'CONFIRMED', 'FINISHED', GETDATE()),
-- Race 2 (Ongoing)
(3, 2, 1, 2, 4, 3, 1, 1, 55.0, 'PASSED', 'CONFIRMED', 'RACING', GETDATE()),
-- Race 3 (Scheduled)
(4, 3, 1, 2, 4, 3, 1, 1, 55.0, 'PENDING', 'PENDING', 'REGISTERED', GETDATE());
SET IDENTITY_INSERT race_participants OFF;

-- ==============================================================================
-- 15. PRE RACE CHECKS
-- ==============================================================================
SET IDENTITY_INSERT pre_race_checks ON;
INSERT INTO pre_race_checks (id, race_id, participant_id, referee_id, equipment_ok, health_ok, horse_identity_ok, jockey_identity_ok, weight_ok, result, checked_at, created_at) VALUES
(1, 1, 1, 6, 1, 1, 1, 1, 1, 'PASSED', GETDATE(), GETDATE()),
(2, 1, 2, 6, 1, 1, 1, 1, 1, 'PASSED', GETDATE(), GETDATE()),
(3, 2, 3, 6, 1, 1, 1, 1, 1, 'PASSED', GETDATE(), GETDATE());
SET IDENTITY_INSERT pre_race_checks OFF;

-- ==============================================================================
-- 16. RACE RESULTS
-- result_status: OFFICIAL, UNOFFICIAL, DISQUALIFIED
-- status: PUBLISHED, SUBMITTED
-- ==============================================================================
SET IDENTITY_INSERT race_results ON;
INSERT INTO race_results (id, race_id, participant_id, position, raw_finish_time_seconds, penalty_seconds, finish_time_seconds, points, prize_points, status, result_status, submitted_at, submitted_by, confirmed_at, confirmed_by, created_at) VALUES
(1, 1, 1, 1, 75.500, 0, 75.500, 10, 500, 'PUBLISHED', 'OFFICIAL', GETDATE(), 6, GETDATE(), 1, GETDATE()),
(2, 1, 2, 2, 78.200, 0, 78.200, 5, 200, 'PUBLISHED', 'OFFICIAL', GETDATE(), 6, GETDATE(), 1, GETDATE());
SET IDENTITY_INSERT race_results OFF;

-- ==============================================================================
-- 17. PREDICTIONS
-- ==============================================================================
SET IDENTITY_INSERT race_predictions ON;
INSERT INTO race_predictions (id, spectator_id, race_id, predicted_winner_id, prediction_type, entry_cost_points, reward_points, status, created_at) VALUES
(1, 8, 1, 1, 'WINNER_ONLY', 10, 50, 'WON', GETDATE()),
(2, 9, 1, 2, 'WINNER_ONLY', 10, 0, 'LOST', GETDATE()),
(3, 8, 2, 1, 'WINNER_ONLY', 10, 0, 'PENDING', GETDATE());
SET IDENTITY_INSERT race_predictions OFF;

-- ==============================================================================
-- 18. VIOLATIONS
-- ==============================================================================
SET IDENTITY_INSERT violations ON;
INSERT INTO violations (id, race_id, participant_id, reported_by, description, violation_type, severity, penalty, occurred_at, created_at) VALUES
(1, 1, 2, 6, 'Jockey whipped horse excessively near the finish line', 'EXCESSIVE_WHIPPING', 'MEDIUM', 'Warning', GETDATE(), GETDATE());
SET IDENTITY_INSERT violations OFF;

-- ==============================================================================
-- DONE
-- ==============================================================================
