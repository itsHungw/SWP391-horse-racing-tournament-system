-- V2: dynamic odds + wager fields.
-- T-SQL "IF NOT EXISTS (sys.columns ...) BEGIN ALTER TABLE ADD ... END GO" idempotent
-- column-adds become Postgres "ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...".
ALTER TABLE race_participants ADD COLUMN IF NOT EXISTS base_win_probability numeric(5,4) DEFAULT 0.1000;
ALTER TABLE race_predictions  ADD COLUMN IF NOT EXISTS wager_amount int;
ALTER TABLE race_predictions  ADD COLUMN IF NOT EXISTS locked_odds  numeric(10,2);
