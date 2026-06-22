IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[race_predictions]') AND name = 'predicted_position')
BEGIN
    ALTER TABLE race_predictions ADD predicted_position INT NULL;
END
GO
