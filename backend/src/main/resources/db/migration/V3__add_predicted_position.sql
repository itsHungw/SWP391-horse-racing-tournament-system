-- V3: per-horse predicted finishing position.
ALTER TABLE race_predictions ADD COLUMN IF NOT EXISTS predicted_position int;
