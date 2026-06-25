-- V10: brute-force lockout fields on password reset tokens.
-- T-SQL "IF COL_LENGTH(...) IS NULL ... ADD ... DEFAULT 0 WITH VALUES" ->
-- Postgres "ADD COLUMN IF NOT EXISTS ... DEFAULT 0" (default applies to existing rows).
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS failed_attempts int NOT NULL DEFAULT 0;
ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS locked_at timestamp(6);
