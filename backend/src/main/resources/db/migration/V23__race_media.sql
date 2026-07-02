CREATE TABLE IF NOT EXISTS race_media (
    id BIGSERIAL PRIMARY KEY,
    race_id BIGINT NOT NULL REFERENCES races(id),
    media_type VARCHAR(40) NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_video_id VARCHAR(100) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    title VARCHAR(160),
    provider_title VARCHAR(300),
    thumbnail_url VARCHAR(1000),
    status VARCHAR(40) NOT NULL,
    verification_status VARCHAR(40) NOT NULL,
    provider_error_code VARCHAR(80),
    last_verified_at TIMESTAMP,
    created_by BIGINT NOT NULL REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    published_by BIGINT REFERENCES users(id),
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT ck_race_media_type CHECK (media_type IN ('HIGHLIGHT')),
    CONSTRAINT ck_race_media_provider CHECK (provider IN ('YOUTUBE')),
    CONSTRAINT ck_race_media_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
    CONSTRAINT ck_race_media_verification CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'FAILED')),
    CONSTRAINT ck_race_media_published_verified CHECK (status <> 'PUBLISHED' OR verification_status = 'VERIFIED'),
    CONSTRAINT ck_race_media_video_id CHECK (provider_video_id ~ '^[A-Za-z0-9_-]{11}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_race_media_active_type
    ON race_media (race_id, media_type)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_race_media_public_lookup
    ON race_media (race_id, media_type, status, verification_status)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_race_media_published_at
    ON race_media (published_at)
    WHERE deleted_at IS NULL AND status = 'PUBLISHED';
