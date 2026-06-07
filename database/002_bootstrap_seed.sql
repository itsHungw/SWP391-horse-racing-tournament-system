-- =====================================================================
-- Horse Racing Tournament Management System
-- Bootstrap Seed Script
-- Purpose:
--   - Required system roles
--   - Default administrator account for first-run access
-- =====================================================================

INSERT INTO roles (name, description)
VALUES
    ('ADMIN', 'System administrator'),
    ('HORSE_OWNER', 'Horse owner'),
    ('JOCKEY', 'Jockey'),
    ('REFEREE', 'Race referee'),
    ('SPECTATOR', 'Spectator and race prediction user');

-- Password: Admin@123
-- BCrypt hash of Admin@123.
-- This is a bootstrap credential only and must be changed after first login in real deployments.
INSERT INTO users (full_name, email, password_hash, status, email_verified, created_at)
VALUES (
    'System Administrator',
    'admin@horse-racing.local',
    '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG',
    'ACTIVE',
    1,
    SYSDATETIME()
);

INSERT INTO user_roles (user_id, role_id, status, assigned_at)
SELECT u.id, r.id, 'ACTIVE', SYSDATETIME()
FROM users u
CROSS JOIN roles r
WHERE u.email = 'admin@horse-racing.local'
  AND r.name IN ('ADMIN', 'SPECTATOR');
