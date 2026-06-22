IF COL_LENGTH(N'dbo.password_reset_tokens', N'failed_attempts') IS NULL
BEGIN
    ALTER TABLE dbo.password_reset_tokens
        ADD failed_attempts int NOT NULL
            CONSTRAINT df_password_reset_tokens_failed_attempts DEFAULT 0 WITH VALUES;
END;

IF COL_LENGTH(N'dbo.password_reset_tokens', N'locked_at') IS NULL
BEGIN
    ALTER TABLE dbo.password_reset_tokens
        ADD locked_at datetime2 NULL;
END;
