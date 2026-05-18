-- =====================================================================
-- Horse Racing Tournament Management System
-- Development Seed Script
-- Purpose:
--   - Optional local/demo data for development and testing
-- =====================================================================

-- =====================================================================
-- 1. SEED DEMO USERS (for development/testing only)
-- Password for all: Test@123
-- =====================================================================

INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Nguyen Van A', 'owner@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000001', 'ACTIVE', 1, GETDATE());

INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Tran Van B', 'jockey@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000002', 'ACTIVE', 1, GETDATE());

INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Le Van C', 'referee@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000003', 'ACTIVE', 1, GETDATE());

INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Pham Thi D', 'spectator@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000004', 'ACTIVE', 1, GETDATE());

INSERT INTO user_roles (user_id, role_id, status, assigned_at)
SELECT u.id, r.id, 'ACTIVE', GETDATE()
FROM users u
CROSS JOIN roles r
WHERE u.email IN ('owner@demo.local', 'jockey@demo.local', 'referee@demo.local', 'spectator@demo.local')
  AND r.name = 'SPECTATOR';

-- =====================================================================
-- 2. SEED ADDITIONAL ROLES FOR DEMO USERS
-- =====================================================================

INSERT INTO user_roles (user_id, role_id, status, assigned_at, assigned_by)
SELECT u.id, r.id, 'ACTIVE', GETDATE(), (SELECT id FROM users WHERE email = 'admin@horse-racing.local')
FROM users u CROSS JOIN roles r
WHERE u.email = 'owner@demo.local' AND r.name = 'HORSE_OWNER';

INSERT INTO horse_owner_profiles (user_id, stable_name, experience_years, bio, status, approved_at, created_at)
SELECT id, 'Thunder Stable', 5, 'Experienced horse owner with 5 years in racing.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'owner@demo.local';

INSERT INTO user_roles (user_id, role_id, status, assigned_at, assigned_by)
SELECT u.id, r.id, 'ACTIVE', GETDATE(), (SELECT id FROM users WHERE email = 'admin@horse-racing.local')
FROM users u CROSS JOIN roles r
WHERE u.email = 'jockey@demo.local' AND r.name = 'JOCKEY';

INSERT INTO jockey_profiles (user_id, height_cm, weight_kg, experience_years, riding_style, bio, status, approved_at, created_at)
SELECT id, 170.5, 58.0, 3, 'BALANCED', 'Professional jockey with 3 years of experience.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'jockey@demo.local';

INSERT INTO user_roles (user_id, role_id, status, assigned_at, assigned_by)
SELECT u.id, r.id, 'ACTIVE', GETDATE(), (SELECT id FROM users WHERE email = 'admin@horse-racing.local')
FROM users u CROSS JOIN roles r
WHERE u.email = 'referee@demo.local' AND r.name = 'REFEREE';

INSERT INTO referee_profiles (user_id, certification, experience_years, bio, status, approved_at, created_at)
SELECT id, 'FEI Certified Steward', 7, 'Certified race referee with 7 years experience.', 'ACTIVE', GETDATE(), GETDATE()
FROM users WHERE email = 'referee@demo.local';

-- =====================================================================
-- 3. SEED DEMO HORSES
-- =====================================================================

INSERT INTO horses (owner_id, name, registration_code, breed, gender, date_of_birth, color, height_cm, weight_kg, health_status, description, status, approved_at, created_at)
SELECT id, 'Thunder', 'HORSE-001', 'Thoroughbred', 'MALE', '2020-05-15', 'Brown', 162.5, 480.0, 'EXCELLENT', 'Champion thoroughbred with outstanding racing record.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'owner@demo.local';

INSERT INTO horses (owner_id, name, registration_code, breed, gender, date_of_birth, color, height_cm, weight_kg, health_status, description, status, approved_at, created_at)
SELECT id, 'Lightning', 'HORSE-002', 'Arabian', 'FEMALE', '2019-08-20', 'White', 155.0, 420.0, 'GOOD', 'Fast Arabian mare known for sprint races.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'owner@demo.local';
