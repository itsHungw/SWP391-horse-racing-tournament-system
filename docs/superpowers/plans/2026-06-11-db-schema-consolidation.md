# Database Schema Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Commits:** the repo owner commits manually. Treat each "Commit" step as a
> review checkpoint — stage/show the diff and let the owner commit. Do not run
> `git commit` automatically.

**Goal:** Replace the three overlapping schema systems with a single Flyway
baseline generated from the JPA entities, so a fresh database boots in one pass.

**Architecture:** Generate SQL Server DDL offline from the entities with
Hibernate, hand-polish it into `V1__baseline.sql` (readable constraint names,
enum `CHECK`s, reference seed), delete the legacy schema files, and add a
dev-only admin seeder. Verify by booting on an empty containerized SQL Server.

**Tech Stack:** Spring Boot 4, Hibernate ORM, Flyway, SQL Server (MS SQL),
JUnit 5, Docker Compose (SQL Server + MinIO).

Spec: `docs/superpowers/specs/2026-06-11-db-schema-consolidation-design.md`.

---

### Task 1: Generate SQL Server DDL from the entities (offline)

**Files:**
- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/tools/SchemaScriptGenerationTest.java`

- [ ] **Step 1: Write the generation test**

This boots the Spring context with Hibernate schema-script generation enabled,
forcing the SQL Server dialect so the emitted DDL targets production, then writes
it to `target/generated/baseline-raw.sql`. It is a generation tool, not an
assertion test.

```java
package com.example.horseracingtournamentsystem.tools;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect",
        "spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create",
        "spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=target/generated/baseline-raw.sql",
        "spring.jpa.properties.hibernate.hbm2ddl.delimiter=;"
})
class SchemaScriptGenerationTest {

    @Test
    void generatesSqlServerBaselineScript() throws Exception {
        Path script = Path.of("target/generated/baseline-raw.sql");
        assertThat(Files.exists(script)).isTrue();
        String sql = Files.readString(script);
        assertThat(sql).contains("create table users");
        assertThat(sql).contains("create table stored_files");
    }
}
```

- [ ] **Step 2: Run it**

Run: `./mvnw -o test -Dtest=SchemaScriptGenerationTest`
Expected: PASS, and `backend/target/generated/baseline-raw.sql` exists with
`create table` statements for every entity (users, roles, horses, tournaments,
races, blogs, point_settings, point_transactions, stored_files, ...).

- [ ] **Step 3: Sanity-check the output**

Open `target/generated/baseline-raw.sql`. Confirm it contains all entity tables
and SQL Server types (`bigint`, `nvarchar`, `bit`, `datetime2`). If the dialect
override did not take effect (e.g. H2 types like `varchar` for booleans),
fallback: bring up `docker compose up -d` and regenerate against the live SQL
Server by also setting `spring.datasource.url` to the local SQL Server in the
test properties. Do not commit this file (it is under `target/`).

---

### Task 2: Build `V1__baseline.sql`

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__baseline.sql`
- Reference: `target/generated/baseline-raw.sql` (from Task 1)
- Reference enums: `point/entity/PointSettingKey.java`,
  `point/entity/PointTransactionType.java`, `blog/entity/BlogStatus.java`,
  `user/entity/RefereeProfileStatus.java`

- [ ] **Step 1: Seed the file from the generated DDL**

Copy the `create table` / `alter table ... add constraint` statements from
`baseline-raw.sql` into `V1__baseline.sql`, keeping Hibernate's dependency
ordering (parents before children). Rename Hibernate's hashed constraint names to
readable ones (`FK_<child>_<parent>`, `UQ_<table>_<col>`, `IX_<table>_<col>`).

- [ ] **Step 2: Add enum CHECK constraints**

Append these constraints (values copied from the enum source files):

```sql
ALTER TABLE blogs
  ADD CONSTRAINT CK_blogs_status CHECK (status IN ('DRAFT','PUBLISHED'));

ALTER TABLE point_settings
  ADD CONSTRAINT CK_point_settings_key CHECK (setting_key IN (
    'FIRST_LOGIN_BONUS','BLOG_REWARD_POINTS','DAILY_BLOG_REWARD_LIMIT',
    'PREDICTION_WINNER_ENTRY_COST','PREDICTION_TOP3_ENTRY_COST',
    'PREDICTION_WINNER_REWARD','PREDICTION_TOP3_EXACT_REWARD',
    'PREDICTION_TOP3_ANY_ORDER_REWARD'));

ALTER TABLE point_transactions
  ADD CONSTRAINT CK_point_transactions_type CHECK (transaction_type IN (
    'FIRST_LOGIN_BONUS','PREDICTION_ENTRY','PREDICTION_REWARD',
    'BLOG_REWARD','RACE_CANCEL_REFUND','ADMIN_ADJUSTMENT'));

ALTER TABLE referee_profiles
  ADD CONSTRAINT CK_referee_profiles_status CHECK (status IN (
    'PENDING','ACTIVE','REJECTED','SUSPENDED','INACTIVE'));
```

- [ ] **Step 3: Append reference seed (safe for all environments)**

```sql
-- Roles
INSERT INTO roles (name, description)
SELECT v.name, v.description FROM (VALUES
    ('ADMIN','Administrator'),
    ('HORSE_OWNER','Horse owner'),
    ('JOCKEY','Jockey'),
    ('REFEREE','Referee'),
    ('SPECTATOR','Spectator')
) AS v(name, description)
WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.name = v.name);

-- Point settings (all default 0)
INSERT INTO point_settings (setting_key, setting_value, description)
SELECT v.k, 0, v.d FROM (VALUES
    ('FIRST_LOGIN_BONUS','Points granted on first successful login when enabled.'),
    ('BLOG_REWARD_POINTS','Points awarded when an eligible blog reward is claimed.'),
    ('DAILY_BLOG_REWARD_LIMIT','Maximum blog reward points a user can earn per day.'),
    ('PREDICTION_WINNER_ENTRY_COST','Points spent to submit one Winner pick prediction.'),
    ('PREDICTION_TOP3_ENTRY_COST','Points spent to submit one Top 3 prediction.'),
    ('PREDICTION_WINNER_REWARD','Points awarded for a correct Winner pick prediction.'),
    ('PREDICTION_TOP3_EXACT_REWARD','Points awarded for matching the exact Top 3 order.'),
    ('PREDICTION_TOP3_ANY_ORDER_REWARD','Points awarded for predicting the Top 3 in any order.')
) AS v(k, d)
WHERE NOT EXISTS (SELECT 1 FROM point_settings p WHERE p.setting_key = v.k);
```

Confirm the seed column names match the generated table columns (e.g.
`point_settings` columns: `setting_key`, `setting_value`, `description`,
`updated_at`, `updated_by`). Adjust if the entity uses different names.

- [ ] **Step 4: Commit checkpoint**

```bash
git add backend/src/main/resources/db/migration/V1__baseline.sql \
        backend/src/test/java/com/example/horseracingtournamentsystem/tools/SchemaScriptGenerationTest.java
```
(Owner commits, e.g. `feat(db): generate consolidated Flyway baseline from entities`.)

---

### Task 3: Remove the legacy schema systems

**Files:**
- Delete: `backend/src/main/resources/db/migration/V2__blog_and_point_foundation.sql`
- Delete: `backend/src/main/resources/db/migration/V3__create_stored_files.sql`
- Delete: `backend/src/main/resources/db/migration/V1__baseline_schema.sql` (old marker — replaced by `V1__baseline.sql`)
- Delete: `backend/src/main/resources/schema.sql`
- Delete: `database/` (entire directory)

- [ ] **Step 1: Delete the files**

```bash
git rm backend/src/main/resources/db/migration/V2__blog_and_point_foundation.sql \
       backend/src/main/resources/db/migration/V3__create_stored_files.sql \
       backend/src/main/resources/db/migration/V1__baseline_schema.sql \
       backend/src/main/resources/schema.sql
git rm -r database/
```

- [ ] **Step 2: Confirm nothing references the deleted files**

Run: `grep -rin "schema.sql\|database/0\|V2__blog\|V3__create" backend docs README.md docker-compose.yml`
Expected: no references in active config/code (doc mentions in specs are fine).
If `FlywayMigrationNamingTest` asserts on the old file set, update it to expect
only `V1__baseline.sql`.

- [ ] **Step 3: Commit checkpoint** (owner commits, e.g. `chore(db): remove legacy schema.sql and database/ scripts`).

---

### Task 4: Dev-only admin seeder

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/config/DevDataSeeder.java`
- Reference: `user/entity/User.java`, `user/entity/Role.java`, `user/entity/UserRole.java`,
  `user/repository/UserRepository.java`, `user/repository/RoleRepository.java`,
  `user/repository/UserRoleRepository.java`

- [ ] **Step 1: Write the seeder**

Idempotent, dev-profile only, so prod never gets a default admin. Mirrors the
construction used in existing tests (`User.pending`, `verifyEmail`,
`UserRole.active`).

```java
package com.example.horseracingtournamentsystem.config;

import com.example.horseracingtournamentsystem.user.entity.Role;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.entity.UserRole;
import com.example.horseracingtournamentsystem.user.repository.RoleRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import com.example.horseracingtournamentsystem.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private static final String ADMIN_EMAIL = "admin@local.dev";
    private static final String ADMIN_PASSWORD = "Admin@12345";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmail(ADMIN_EMAIL).isPresent()) {
            return;
        }
        User admin = User.pending("Local Admin", ADMIN_EMAIL,
                passwordEncoder.encode(ADMIN_PASSWORD));
        admin.verifyEmail();
        userRepository.save(admin);

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role not seeded by baseline"));
        userRoleRepository.save(UserRole.active(admin, adminRole, admin));
    }
}
```

- [ ] **Step 2: Verify the entity API matches**

Confirm signatures exist: `User.pending(String,String,String)`, `User.verifyEmail()`,
`RoleRepository.findByName(String)`, `UserRole.active(User actor/role...)`. If any
differs, adapt the calls (do not invent methods). Confirm `verifyEmail()` leaves
the user in a status that `AuthService.login` accepts (not `PENDING_EMAIL_VERIFY`);
if an explicit activate step is required, add it.

- [ ] **Step 3: Compile**

Run: `./mvnw -o test-compile`
Expected: BUILD SUCCESS.

- [ ] **Step 4: Commit checkpoint** (owner commits, e.g. `feat(dev): seed a local admin under the dev profile`).

---

### Task 5: Remove dead config

**Files:**
- Modify: `backend/src/main/resources/application.yml`

- [ ] **Step 1: Delete the commented `spring.sql.init` block**

Remove these dead lines (schema.sql no longer exists):

```yaml
  # sql:
  #   init:
  #     mode: always
```

- [ ] **Step 2: Commit checkpoint** (owner commits, e.g. `chore(config): drop dead sql.init block`).

---

### Task 6: Fresh-boot verification

- [ ] **Step 1: Wipe and recreate the local stack**

```bash
docker compose down -v
docker compose up -d
```
Expected: `db-init` creates the empty `horseracing` database; MinIO bucket ready.

- [ ] **Step 2: Boot the backend on an empty database**

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev DB_URL="jdbc:sqlserver://localhost:1433;databaseName=horseracing;encrypt=true;trustServerCertificate=true" \
  DB_USERNAME=sa DB_PASSWORD=Local_Dev_Password123 AUTH_JWT_SECRET=local-dev-secret-at-least-32-characters \
  ./mvnw -o spring-boot:run
```
Expected: Flyway applies `V1__baseline` cleanly (no FK/order errors); app starts;
log shows the dev admin seeded (or skipped if present).

- [ ] **Step 3: Smoke-test login**

```bash
curl -i -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.dev","password":"Admin@12345"}'
```
Expected: HTTP 200 with an access token.

- [ ] **Step 4: Run the full backend test suite (H2 path unaffected)**

Run: `./mvnw -o test`
Expected: BUILD SUCCESS, all tests pass (≈153).

---

### Task 7: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the one-time wipe and single source of truth**

Add to the local-development section: the schema is now owned solely by the
Flyway baseline `V1__baseline.sql`; `schema.sql` and `database/` are gone; after
pulling this change every developer must run `docker compose down -v` once so the
new baseline applies to an empty database. Local dev admin: `admin@local.dev` /
`Admin@12345` (dev profile only).

- [ ] **Step 2: Commit checkpoint** (owner commits, e.g. `docs: document Flyway-only schema and one-time DB wipe`).

---

## Self-Review

- **Spec coverage:** generate-from-entities (Task 1), single baseline + enum
  CHECKs + reference seed (Task 2), delete legacy systems (Task 3), dev-only admin
  (Task 4), config cleanup (Task 5), fresh-boot + tests verification (Task 6),
  README/one-time-wipe (Task 7). All spec sections mapped.
- **Placeholders:** none — enum values, seed SQL, and seeder code are concrete.
- **Type consistency:** enum value lists in Task 2 match the enum source files;
  seeder in Task 4 uses the same entity API as existing tests, with a verify step
  for signature drift.

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review
   between tasks.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Note: Tasks 1–2 are judgment-heavy (review generated DDL) and best done inline
with a human in the loop; Tasks 3–7 are mechanical. The repo owner commits each
checkpoint manually.
