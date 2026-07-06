ALTER TABLE tournaments ADD COLUMN total_prize_pool BIGINT NOT NULL DEFAULT 0;
ALTER TABLE tournaments ADD CONSTRAINT chk_tournament_prize_pool CHECK (total_prize_pool >= 0);
