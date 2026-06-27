-- V18: gỡ thị trường cược TOP3 (đã bỏ khỏi UI + API).
-- Hai cột predicted_second_id / predicted_third_id chỉ phục vụ TOP3 (dự đoán ngựa
-- về nhì/ba) nên không còn được ghi. Drop để đóng bề mặt dữ liệu thừa.
-- Không có FK trên 2 cột này (xem V1 baseline) -> drop sạch.
-- Dialect: PostgreSQL.

ALTER TABLE race_predictions DROP COLUMN IF EXISTS predicted_second_id;
ALTER TABLE race_predictions DROP COLUMN IF EXISTS predicted_third_id;
