-- V17: chống tràn kiểu dữ liệu tiền ở domain prediction (audit fix #2).
-- Vấn đề: ví dùng bigint (VND tiền thật, có thể > 2.147 tỷ) nhưng các cột tiền của
-- prediction vẫn là int -> tràn khi cược/đặt lớn, và payout = wager * odds dễ vượt
-- int max (2,147,483,647) -> Postgres "integer out of range" -> settlement FAIL,
-- người thắng không được trả. Đồng thời field Java rewardPoints là `long` nhưng cột
-- là `int` (lệch kiểu). Widen tất cả về bigint + numeric rộng hơn cho odds.
-- Dialect: PostgreSQL. ALTER COLUMN ... TYPE giữ nguyên NOT NULL/DEFAULT sẵn có.

-- race_predictions: tiền cược / hoàn / thưởng + tỷ lệ khóa
ALTER TABLE race_predictions ALTER COLUMN wager_amount      TYPE bigint;
ALTER TABLE race_predictions ALTER COLUMN entry_cost_points TYPE bigint;
ALTER TABLE race_predictions ALTER COLUMN reward_points     TYPE bigint;
ALTER TABLE race_predictions ALTER COLUMN locked_odds       TYPE numeric(18,4);

-- streak_predictions: cược + tổng tỷ lệ + thưởng
ALTER TABLE streak_predictions ALTER COLUMN wager_amount  TYPE bigint;
ALTER TABLE streak_predictions ALTER COLUMN reward_points TYPE bigint;
ALTER TABLE streak_predictions ALTER COLUMN total_odds    TYPE numeric(18,4);

-- streak_prediction_legs: tỷ lệ khóa từng chặng
ALTER TABLE streak_prediction_legs ALTER COLUMN locked_odds TYPE numeric(18,4);
