# Database End-to-End Design

## 1. Purpose

This design turns the database into a coherent product foundation rather than a loose collection of tables.

The database should:

- support the full tournament-management domain,
- support phase-1 authentication and authorization,
- enforce key business invariants directly where practical,
- separate production-safe bootstrap data from development/demo data,
- keep the product clearly outside real-money betting semantics.

## 2. Target Shape

The database layer will have three concerns:

```text
schema
├─ full production schema
├─ constraints and indexes
└─ lifecycle-supporting tables

bootstrap seed
├─ system roles
└─ default admin account

dev/test seed
├─ demo users
├─ demo profiles
└─ demo horses and later demo walkthrough data
```

## 3. Migration and Seed Strategy

Because the project is still early, the database should move toward a clean migration chain instead of continuing with a monolithic schema file forever.

Recommended files:

```text
database/
├─ 001_create_tables.sql
├─ 002_bootstrap_seed.sql
└─ 900_dev_seed.sql
```

### 3.1 Production-facing files

- `001_create_tables.sql`
  - full schema for fresh installations,
  - includes auth tables and integrity constraints.
- `002_bootstrap_seed.sql`
  - inserts required system roles,
  - inserts one default admin account using a precomputed BCrypt hash,
  - assigns `ADMIN` and `SPECTATOR`.

### 3.2 Non-production seed

- `900_dev_seed.sql`
  - contains demo users, demo role assignments, demo profiles, and demo horses,
  - is intended only for local development and testing,
  - is never required for a production installation.

## 4. Authentication Data Model

### 4.1 User lifecycle

Newly registered users should be created with:

- `status = PENDING_EMAIL_VERIFY`
- `email_verified = 0`

After verification:

- `status = ACTIVE`
- `email_verified = 1`

### 4.2 Auth tables

Add:

- `auth_sessions`
- `email_verification_tokens`
- `password_reset_tokens`

These tables support:

- refresh-token rotation,
- logout,
- all-session revocation after password reset,
- single-use email verification and reset links.

### 4.3 Password-change tracking

Add:

- `users.password_changed_at`

This supports password-reset auditing and future policies such as forcing a seeded admin to change their default password.

## 5. Bootstrap Admin Strategy

The database should include one default admin in `002_bootstrap_seed.sql`.

The admin is seeded with:

- a known email,
- a precomputed BCrypt hash,
- `status = ACTIVE`,
- `email_verified = 1`,
- both `ADMIN` and `SPECTATOR` roles.

The seed file should explicitly document:

- the initial password is for first-run/bootstrap use only,
- it must be changed after first login in real deployments,
- production environments should rotate or override bootstrap credentials during deployment.

## 6. Integrity Rules to Enforce in the Database

### 6.1 Identity and role management

Enforce:

- unique user email,
- one role row per `(user_id, role_id)`,
- one pending role request per `(user_id, requested_role)`,
- valid role-request target roles only,
- valid status sets for users and user roles.

### 6.2 Invitations

Enforce:

- at most one pending jockey invitation for the same `(race_id, horse_id)`.

### 6.3 Predictions

Enforce:

- one prediction per `(race_id, spectator_id, prediction_type)`,
- positive entry cost,
- non-negative rewards,
- for `TOP3`, chosen participants must be distinct.

### 6.4 Existing race/ranking invariants

Keep existing:

- unique horse per race,
- unique jockey per race,
- unique start number and lane number per race,
- unique participant result per race,
- unique official finishing position per race,
- lifecycle/status checks already present in the schema.

## 7. Application-Enforced Rules

Some rules remain better enforced in the service layer because they depend on cross-row or temporal logic:

- only `OPEN_REGISTRATION` tournaments accept registrations,
- only the assigned referee may submit results,
- predictions must close before the deadline,
- rankings update only after official result publication,
- blog reading rewards respect anti-farming thresholds and daily limits,
- only active owners create horses,
- only eligible jockeys may accept invitations.

The database should support these rules, but not attempt brittle procedural enforcement for all of them.

## 8. Documentation Updates

Update:

- `docs/specs/data/01_database-design.md`
  - new source-of-truth explanation,
  - migration layout,
  - bootstrap vs dev seed distinction,
  - database-enforced vs application-enforced rule summary.
- `docs/specs/data/02_erd-and-status-lifecycles.md`
  - auth tables in the ERD,
  - role-request and auth-session relationships,
  - status lifecycle notes that match the final schema.
- any auth-related docs that still describe planned-but-not-created tables as future work.

## 9. Scope

Included:

- end-to-end review of the existing schema,
- auth schema completion,
- bootstrap/admin seed split from demo seed,
- additional integrity constraints and indexes,
- data-doc synchronization.

Excluded:

- implementing Java entities or repositories,
- introducing stored procedures for business workflows,
- building reporting views,
- changing product scope or business terminology.

## 10. Verification

The final database work should be checked by:

1. fresh database creation from the migration chain,
2. bootstrap seed execution without duplicates,
3. optional dev seed execution on top,
4. constraint smoke tests for invalid duplicates and invalid `TOP3` picks,
5. documentation review against the final SQL.

## 11. Expected Outcome

After this refactor:

- the database matches the written business model,
- auth is no longer only a design document,
- production-safe bootstrap data is cleanly separated from demo data,
- critical duplicate states are rejected at the database layer,
- future backend implementation can rely on a stable and explicit schema contract.
