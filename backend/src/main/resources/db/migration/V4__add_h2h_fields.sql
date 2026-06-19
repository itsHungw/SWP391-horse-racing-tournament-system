IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[race_predictions]') AND name = 'matchup_opponent_id')
BEGIN
    ALTER TABLE race_predictions ADD matchup_opponent_id BIGINT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[race_predictions]') AND name = 'handicap_seconds')
BEGIN
    ALTER TABLE race_predictions ADD handicap_seconds DECIMAL(10, 3) NULL;
END
GO

-- Update existing TOP3 to HEAD_TO_HEAD to avoid enum mismatch, though there shouldn't be many in dev.
UPDATE race_predictions SET prediction_type = 'HEAD_TO_HEAD' WHERE prediction_type = 'TOP3';
