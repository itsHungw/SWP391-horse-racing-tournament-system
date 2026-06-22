# Database Schema Consolidation Design

## Purpose

Collapse the three overlapping schema systems into a single Flyway baseline
generated from the JPA entities, so a fresh database builds correctly in one pass
and there is exactly one source of truth for the schema.

Today the schema is scattered and order-dependent, which makes a fresh database
fail partway through setup:

- `database/001_create_tables.sql` (legacy) — creates the core tables
  (`users`, `roles`, `horses`, `tournaments`, `races`, ...) but has drifted from
  the current entities (it still defines removed tables such as `ai_predictions`,
  `notifications`, `pre_race_checks`, `referee_reports`, `tournament_rankings`,
  `user_blog_rewards`, `user_daily_point_limits`, `jockey_profiles`).
- `backend/src/main/resources/schema.sql` — re-creates a subset with `IF NOT
  EXISTS` guards and adds foreign keys to `dbo.users` / `dbo.horses` **without
  creating them**, so running it on an empty database fails on the first FK.
- Flyway `V1` (empty marker), `V2` (blog/point), `V3` (stored_files) — `V2`
  creates `blogs` with an FK to `dbo.users`, which does not exist on a fresh
  database, so Flyway breaks at `V2`.

The JPA entities are the only reliable source of truth: 34 `@Entity` classes,
verified by 153 tests that run on `ddl-auto: create-drop`.

## Scope

In scope: regenerate the schema as one Flyway baseline, retire the legacy schema
files, add reference + dev seed, verify a fresh database boots.

Out of scope: any domain rename (e.g. `tournament` → `championship`). That is a
separate, larger refactor and is intentionally excluded.

## Current Project Context

- Backend: Spring Boot under
  `backend/src/main/java/com/example/horseracingtournamentsystem`.
- Entities: 34 `@Entity` classes across the domain packages.
- Migrations: `backend/src/main/resources/db/migration` (`V1`, `V2`, `V3`).
- Legacy DDL: `backend/src/main/resources/schema.sql`, `database/` scripts.
- Flyway config in `application.yml`: `enabled: true`,
  `baseline-on-migrate: true`, `ddl-auto: none`.
- Tests run on H2 with `ddl-auto: create-drop` and Flyway disabled, so they are
  unaffected by the migration files.

## Decision: generate the baseline from entities

Because `database/001` has drifted from the entities, hand-merging the legacy SQL
would carry forward dead tables. Instead, generate the DDL from the entities:

1. Run Hibernate schema generation offline against the SQL Server dialect
   (`jakarta.persistence.schema-generation.scripts.action=create` with
   `hibernate.dialect=...SQLServerDialect`). This writes a `CREATE` script from
   the entities without needing a live database.
2. Hand-polish the generated script into the baseline: readable foreign-key and
   index names, and `CHECK` constraints for enum-backed columns.

Hibernate-generated names are otherwise random hashes, so the polish step is
required for a reviewable, stable schema.

## Migration Structure

Collapse to a single baseline (safe because every database is local and will be
reset):

- Create `backend/src/main/resources/db/migration/V1__baseline.sql` — the full
  schema (every entity table, in dependency order) plus reference seed.
- Delete `V2__blog_and_point_foundation.sql`, `V3__create_stored_files.sql`, and
  the old empty `V1__baseline_schema.sql` marker (folded into the new `V1`).
- Delete `backend/src/main/resources/schema.sql` and the `database/` directory.

Because the migration history changes, every developer must wipe their local
database once (`docker compose down -v`) so Flyway re-applies the new `V1` on an
empty database. This is documented in the README.

`baseline-on-migrate: true` stays. On a truly empty database Flyway simply runs
`V1`; the baseline behaviour only matters for pre-existing non-empty databases,
of which there are none to preserve.

## Enum Handling

Entities already use `@Enumerated(EnumType.STRING)`. The baseline stores enum
columns as `VARCHAR` holding the enum name and adds a `CHECK (column IN (...))`
constraint listing the allowed values, so the database rejects invalid values.
Ordinal mapping is never used (it breaks if enum order changes).

`roles` stays a lookup **table** (it carries id/name/description and is reference
data), not an enum.

## Seed Data

Two tiers, so production never gets test accounts or default credentials:

- **Baseline seed (all environments, in `V1`):** safe reference data only.
  - `roles`: `ADMIN`, `HORSE_OWNER`, `JOCKEY`, `REFEREE`, `SPECTATOR`.
  - `point_settings`: the 8 keys, all defaulting to `0`.
- **Dev seed (dev profile only, NOT in Flyway):** one admin account so a fresh
  local database is immediately usable. Implemented as a Spring
  `ApplicationRunner`/seeder guarded by `@Profile("dev")` (or equivalent), idempotent
  (only inserts if the admin does not already exist). It must never run under the
  `prod` profile, so there is no default admin credential in production.

## Configuration Changes

- Keep `spring.jpa.hibernate.ddl-auto: none` (schema owned by Flyway).
- Keep Flyway enabled.
- Remove the commented-out `spring.sql.init` block from `application.yml` (dead
  config; `schema.sql` is being deleted).

## Verification (Definition of Done)

1. `docker compose down -v && docker compose up -d` (empty database + bucket).
2. Start backend with `SPRING_PROFILES_ACTIVE=dev`; Flyway applies `V1` cleanly
   from empty — no FK/order errors.
3. Dev seeder creates the admin; logging in with it succeeds (smoke test).
4. `./mvnw test` still passes (H2 path is unchanged; 153 tests green).
5. No remaining references to `schema.sql` or `database/` in the codebase/config.

## Risks And Mitigations

- **Wiping local databases:** every developer must `docker compose down -v` once.
  Mitigation: call it out in the README and the PR description.
- **Hibernate DDL drift from hand-tuned legacy types** (column lengths, etc.):
  the polish step reviews types against the entity annotations; tests on H2 plus
  the fresh-boot check on SQL Server catch mismatches.
- **Missed seed needed by code paths** (e.g. a service expecting a settings row):
  `point_settings` rows are seeded; services already fall back to `0` via
  `ensureSetting`, so this is low risk.

## Follow-Ups (Out Of Scope)

- Domain rename `tournament` → `championship` (separate spec if pursued).
- Removing the legacy `/uploads/**` handler (tracked in the file-storage design).
