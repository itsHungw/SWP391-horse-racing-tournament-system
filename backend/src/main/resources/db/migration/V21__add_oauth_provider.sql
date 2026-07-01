-- V21: Add OAuth Provider fields to users table
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(30) DEFAULT 'LOCAL' NOT NULL;
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);

-- Create index for faster OAuth account resolution
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);
