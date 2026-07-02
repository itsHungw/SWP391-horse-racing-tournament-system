-- V4: head-to-head prediction fields.
ALTER TABLE race_predictions ADD COLUMN IF NOT EXISTS matchup_opponent_id bigint;
ALTER TABLE race_predictions ADD COLUMN IF NOT EXISTS handicap_seconds    numeric(10,3);

-- Update existing TOP3 to HEAD_TO_HEAD to avoid enum mismatch, though there shouldn't be many in dev.
UPDATE race_predictions SET prediction_type = 'HEAD_TO_HEAD' WHERE prediction_type = 'TOP3';
