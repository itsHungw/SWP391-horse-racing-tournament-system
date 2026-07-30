ALTER TABLE streak_prediction_legs
ADD COLUMN placed_odds DECIMAL(18, 4);

UPDATE streak_prediction_legs
SET placed_odds = locked_odds;

ALTER TABLE streak_prediction_legs
ALTER COLUMN placed_odds SET NOT NULL;
