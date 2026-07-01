-- V21: Performance indexes on hot foreign-key / filter columns.
--
-- Audit finding: the Hibernate-generated baseline (V1) created only primary keys plus a
-- few unique indexes. Postgres does NOT auto-index foreign keys, so every list/detail/odds
-- query filtering by *_id / status / race_at / deleted_at ran a sequential scan — which
-- compounds the N+1 fan-out (each repeated query was itself a full table scan). These
-- indexes turn those seq scans into index scans across the whole app.
--
-- Idempotent (IF NOT EXISTS). Postgres-only: the test suite uses H2 with ddl-auto and
-- Flyway disabled, so this migration never runs there — service-level behaviour is unchanged.

-- races: list by tournament (+ order by race_at), referee schedule, global ordering, status.
-- Partial on deleted_at IS NULL because every list query filters soft-deleted rows out.
CREATE INDEX IF NOT EXISTS ix_races_tournament_race_at ON races (tournament_id, race_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_races_race_at           ON races (race_at)                 WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_races_referee           ON races (referee_id)              WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ix_races_status            ON races (status)                  WHERE deleted_at IS NULL;

-- race_results: per-race result list, batched IN (raceIds), per-participant lookups.
CREATE INDEX IF NOT EXISTS ix_race_results_race        ON race_results (race_id);
CREATE INDEX IF NOT EXISTS ix_race_results_participant ON race_results (participant_id);

-- race_participants: race field, per-horse history (odds), jockey schedule, owner roster.
CREATE INDEX IF NOT EXISTS ix_race_participants_race   ON race_participants (race_id);
CREATE INDEX IF NOT EXISTS ix_race_participants_horse  ON race_participants (horse_id);
CREATE INDEX IF NOT EXISTS ix_race_participants_jockey ON race_participants (jockey_id);
CREATE INDEX IF NOT EXISTS ix_race_participants_owner  ON race_participants (owner_id);

-- race_predictions: per-race pool, per-spectator history / in-play sums.
CREATE INDEX IF NOT EXISTS ix_race_predictions_race      ON race_predictions (race_id);
CREATE INDEX IF NOT EXISTS ix_race_predictions_spectator ON race_predictions (spectator_id);

-- tournament participants / registrations / jockey applications.
CREATE INDEX IF NOT EXISTS ix_tournament_participants_tournament ON tournament_participants (tournament_id);
CREATE INDEX IF NOT EXISTS ix_tournament_participants_jockey     ON tournament_participants (jockey_id);
CREATE INDEX IF NOT EXISTS ix_tournament_participants_owner      ON tournament_participants (owner_id);
CREATE INDEX IF NOT EXISTS ix_tournament_registrations_tournament ON tournament_registrations (tournament_id);
CREATE INDEX IF NOT EXISTS ix_tournament_registrations_owner      ON tournament_registrations (owner_id);
CREATE INDEX IF NOT EXISTS ix_jta_tournament ON jockey_tournament_applications (tournament_id);
CREATE INDEX IF NOT EXISTS ix_jta_jockey     ON jockey_tournament_applications (jockey_id);

-- referee surfaces.
CREATE INDEX IF NOT EXISTS ix_referee_reports_race    ON referee_reports (race_id);
CREATE INDEX IF NOT EXISTS ix_referee_reports_referee ON referee_reports (referee_id);
CREATE INDEX IF NOT EXISTS ix_pre_race_checks_race    ON pre_race_checks (race_id);
CREATE INDEX IF NOT EXISTS ix_violations_race         ON violations (race_id);

-- auth / roles: hit on nearly every authenticated request (role resolution, token refresh).
CREATE INDEX IF NOT EXISTS ix_user_roles_user     ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS ix_user_roles_role     ON user_roles (role_id);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_token ON auth_sessions (refresh_token_hash);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_user  ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS ix_role_requests_user  ON role_requests (user_id);

-- content.
CREATE INDEX IF NOT EXISTS ix_blogs_status        ON blogs (status);
CREATE INDEX IF NOT EXISTS ix_blogs_slug          ON blogs (slug);
CREATE INDEX IF NOT EXISTS ix_horse_documents_horse ON horse_documents (horse_id);
