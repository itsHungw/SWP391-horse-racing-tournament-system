-- =====================================================================
-- Horse Racing Tournament Management System
-- Seed Data Script
-- Version: 1.0
-- =====================================================================

-- =====================================================================
-- 1. SEED ROLES
-- =====================================================================
INSERT INTO roles (name, description) VALUES ('ADMIN', 'System administrator with full access');
INSERT INTO roles (name, description) VALUES ('SPECTATOR', 'Default role for all registered users');
INSERT INTO roles (name, description) VALUES ('HORSE_OWNER', 'Horse owner who can manage horses and register to tournaments');
INSERT INTO roles (name, description) VALUES ('JOCKEY', 'Jockey who rides horses in races');
INSERT INTO roles (name, description) VALUES ('REFEREE', 'Race referee who checks participants and submits results');

-- =====================================================================
-- 2. SEED ADMIN USER
-- Password: Admin@123 (BCrypt hash - generate in application startup if needed)
-- In production, change this password immediately!
-- =====================================================================
INSERT INTO users (full_name, email, password_hash, status, email_verified, created_at)
VALUES (
    'System Administrator',
    'admin@horse-racing.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',  -- BCrypt of 'Admin@123'
    'ACTIVE',
    1,
    GETDATE()
);

-- Assign ADMIN + SPECTATOR roles to admin user
INSERT INTO user_roles (user_id, role_id, status, assigned_at)
SELECT u.id, r.id, 'ACTIVE', GETDATE()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@horse-racing.local'
  AND r.name IN ('ADMIN', 'SPECTATOR');

-- =====================================================================
-- 3. SEED DEMO USERS (for development/testing only)
-- Password for all: Test@123
-- =====================================================================

-- User A: Will become Horse Owner
INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Nguyen Van A', 'owner@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000001', 'ACTIVE', 1, GETDATE());

-- User B: Will become Jockey
INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Tran Van B', 'jockey@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000002', 'ACTIVE', 1, GETDATE());

-- User C: Will become Referee
INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Le Van C', 'referee@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000003', 'ACTIVE', 1, GETDATE());

-- User D: Pure Spectator
INSERT INTO users (full_name, email, password_hash, phone, status, email_verified, created_at)
VALUES ('Pham Thi D', 'spectator@demo.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    '0901000004', 'ACTIVE', 1, GETDATE());

-- Assign SPECTATOR role to all demo users
INSERT INTO user_roles (user_id, role_id, status, assigned_at)
SELECT u.id, r.id, 'ACTIVE', GETDATE()
FROM users u
CROSS JOIN roles r
WHERE u.email IN ('owner@demo.local', 'jockey@demo.local', 'referee@demo.local', 'spectator@demo.local')
  AND r.name = 'SPECTATOR';

-- =====================================================================
-- 4. SEED ADDITIONAL ROLES FOR DEMO USERS
-- (Simulating already-approved role requests for quick testing)
-- =====================================================================

-- Owner role for User A
INSERT INTO user_roles (user_id, role_id, status, assigned_at, assigned_by)
SELECT u.id, r.id, 'ACTIVE', GETDATE(), (SELECT id FROM users WHERE email = 'admin@horse-racing.local')
FROM users u CROSS JOIN roles r
WHERE u.email = 'owner@demo.local' AND r.name = 'HORSE_OWNER';

-- Owner profile for User A
INSERT INTO horse_owner_profiles (user_id, stable_name, experience_years, bio, status, approved_at, created_at)
SELECT id, 'Thunder Stable', 5, 'Experienced horse owner with 5 years in racing.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'owner@demo.local';

-- Jockey role for User B
INSERT INTO user_roles (user_id, role_id, status, assigned_at, assigned_by)
SELECT u.id, r.id, 'ACTIVE', GETDATE(), (SELECT id FROM users WHERE email = 'admin@horse-racing.local')
FROM users u CROSS JOIN roles r
WHERE u.email = 'jockey@demo.local' AND r.name = 'JOCKEY';

-- Jockey profile for User B
INSERT INTO jockey_profiles (user_id, height_cm, weight_kg, experience_years, riding_style, bio, status, approved_at, created_at)
SELECT id, 170.5, 58.0, 3, 'BALANCED', 'Professional jockey with 3 years of experience.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'jockey@demo.local';

-- Referee role for User C
INSERT INTO user_roles (user_id, role_id, status, assigned_at, assigned_by)
SELECT u.id, r.id, 'ACTIVE', GETDATE(), (SELECT id FROM users WHERE email = 'admin@horse-racing.local')
FROM users u CROSS JOIN roles r
WHERE u.email = 'referee@demo.local' AND r.name = 'REFEREE';

-- Referee profile for User C
INSERT INTO referee_profiles (user_id, certification, experience_years, bio, status, approved_at, created_at)
SELECT id, 'FEI Certified Steward', 7, 'Certified race referee with 7 years experience.', 'ACTIVE', GETDATE(), GETDATE()
FROM users WHERE email = 'referee@demo.local';

-- =====================================================================
-- 5. SEED DEMO HORSE (for testing)
-- =====================================================================
INSERT INTO horses (owner_id, name, registration_code, breed, gender, date_of_birth, color, height_cm, weight_kg, health_status, description, status, approved_at, created_at)
SELECT id, 'Thunder', 'HORSE-001', 'Thoroughbred', 'MALE', '2020-05-15', 'Brown', 162.5, 480.0, 'EXCELLENT', 'Champion thoroughbred with outstanding racing record.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'owner@demo.local';

INSERT INTO horses (owner_id, name, registration_code, breed, gender, date_of_birth, color, height_cm, weight_kg, health_status, description, status, approved_at, created_at)
SELECT id, 'Lightning', 'HORSE-002', 'Arabian', 'FEMALE', '2019-08-20', 'White', 155.0, 420.0, 'GOOD', 'Fast Arabian mare known for sprint races.', 'APPROVED', GETDATE(), GETDATE()
FROM users WHERE email = 'owner@demo.local';

-- =====================================================================
-- END SEED DATA
-- =====================================================================
