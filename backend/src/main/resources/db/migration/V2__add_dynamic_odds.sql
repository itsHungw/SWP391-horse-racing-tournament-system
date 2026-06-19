IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[race_participants]') AND name = 'base_win_probability')
BEGIN
    ALTER TABLE race_participants ADD base_win_probability DECIMAL(5,4) DEFAULT 0.1000;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[race_predictions]') AND name = 'wager_amount')
BEGIN
    ALTER TABLE race_predictions ADD wager_amount INT NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[race_predictions]') AND name = 'locked_odds')
BEGIN
    ALTER TABLE race_predictions ADD locked_odds DECIMAL(10,2) NULL;
END
GO
