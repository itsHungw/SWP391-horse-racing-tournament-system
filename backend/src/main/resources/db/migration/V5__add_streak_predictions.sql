IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[streak_predictions]') AND type in (N'U'))
BEGIN
    CREATE TABLE streak_predictions (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        spectator_id BIGINT NOT NULL,
        tournament_id BIGINT NOT NULL,
        wager_amount INT NOT NULL,
        total_odds DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        reward_points INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        evaluated_at DATETIME NULL,
        FOREIGN KEY (spectator_id) REFERENCES users(id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[streak_prediction_legs]') AND type in (N'U'))
BEGIN
    CREATE TABLE streak_prediction_legs (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        streak_prediction_id BIGINT NOT NULL,
        race_id BIGINT NOT NULL,
        predicted_winner_id BIGINT NOT NULL,
        locked_odds DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        FOREIGN KEY (streak_prediction_id) REFERENCES streak_predictions(id) ON DELETE CASCADE,
        FOREIGN KEY (race_id) REFERENCES races(id),
        FOREIGN KEY (predicted_winner_id) REFERENCES race_participants(id)
    );
END
GO
