CREATE TABLE user_status_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    public_reason VARCHAR(500) NOT NULL,
    internal_note VARCHAR(1000),
    changed_by BIGINT NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    wallet_locked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_user_status_history_user_changed
    ON user_status_history(user_id, changed_at DESC);
