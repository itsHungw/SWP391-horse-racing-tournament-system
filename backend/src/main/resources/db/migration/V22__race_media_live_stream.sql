-- V22: Cho phép LIVE_STREAM cùng tồn tại với HIGHLIGHT trên bảng race_media.
--
-- Bảng + partial unique (race_id, media_type) WHERE deleted_at IS NULL đã sẵn sàng cho nhiều loại
-- media (1 highlight + 1 live / race). Chỉ cần nới CHECK media_type. Không thêm cột nào.
-- Postgres-only: test H2 build schema từ ddl-auto + Flyway off nên migration này không chạy ở test.

ALTER TABLE race_media DROP CONSTRAINT IF EXISTS ck_race_media_type;
ALTER TABLE race_media ADD CONSTRAINT ck_race_media_type
    CHECK (media_type IN ('HIGHLIGHT', 'LIVE_STREAM'));
