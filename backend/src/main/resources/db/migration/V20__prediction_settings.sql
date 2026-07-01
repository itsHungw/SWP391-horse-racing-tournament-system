CREATE TABLE prediction_settings (
    id bigint NOT NULL,
    display_seed double precision NOT NULL,
    takeout_rate numeric(5,4) NOT NULL,
    updated_at timestamp(6),
    updated_by bigint,
    PRIMARY KEY (id),
    CONSTRAINT FK_prediction_settings_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default settings matching the current configuration
INSERT INTO prediction_settings (id, display_seed, takeout_rate, updated_at)
VALUES (1, 40000000.0, 0.15, CURRENT_TIMESTAMP);
