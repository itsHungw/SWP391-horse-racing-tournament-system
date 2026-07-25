CREATE TABLE wallet_status_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    public_reason VARCHAR(500) NOT NULL,
    internal_note VARCHAR(1000),
    changed_by BIGINT NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_status_history_user_changed
    ON wallet_status_history(user_id, changed_at DESC);
