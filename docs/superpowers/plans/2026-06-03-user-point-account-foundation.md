# User Point Account Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the logged-in user's point account foundation with one account per user, balance reads, transaction history reads, and a protected internal service path for future point changes.

**Architecture:** Extend the existing backend `point` package with account and transaction entities mapped to `user_point_accounts` and `point_transactions`. Add read-only user APIs for balance/history and a small frontend display using the shared `httpClient`. Keep Admin Point Settings independent from existing balances.

**Tech Stack:** Spring Boot, Spring Data JPA, Bean Validation, Spring Security, SQL Server schema script, React, TypeScript, Vitest, Testing Library.

---

## Current Status

- `backend/src/main/resources/schema.sql` currently has `point_settings`.
- `backend/src/main/resources/schema.sql` does not have `user_point_accounts`.
- `backend/src/main/resources/schema.sql` does not have `point_transactions`.
- Backend docs mention both tables as intended domain tables.
- Backend code has no account/transaction JPA mapping yet.
- Frontend has `frontend/src/api/httpClient.ts` and must use it for point APIs.

## File Map

Backend create:

- `backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/UserPointAccount.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/PointTransaction.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/entity/PointTransactionType.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/repository/UserPointAccountRepository.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/repository/PointTransactionRepository.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/dto/UserPointBalanceResponse.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/dto/PointTransactionResponse.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/service/PointAccountService.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/point/controller/UserPointController.java`
- `backend/src/test/java/com/example/horseracingtournamentsystem/point/UserPointAccountIntegrationTest.java`

Backend modify:

- `backend/src/main/resources/schema.sql`

Frontend create:

- `frontend/src/types/pointAccount.ts`
- `frontend/src/api/pointAccountApi.ts`
- `frontend/src/api/pointAccountApi.test.ts`
- `frontend/src/components/PointBalancePanel.tsx`
- `frontend/src/components/PointBalancePanel.test.tsx`
- `frontend/src/components/PointTransactionHistory.tsx`
- `frontend/src/components/PointTransactionHistory.test.tsx`

Frontend modify:

- `frontend/src/pages/RoleDashboardPage.tsx`

## Task 1: Database Schema

**Files:**

- Modify: `backend/src/main/resources/schema.sql`

- [ ] Add idempotent `user_point_accounts` table creation after `users` exists.

Use SQL Server checks:

```sql
IF OBJECT_ID(N'dbo.user_point_accounts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_point_accounts (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id BIGINT NOT NULL,
        balance INT NOT NULL CONSTRAINT DF_user_point_accounts_balance DEFAULT 0,
        version BIGINT NOT NULL CONSTRAINT DF_user_point_accounts_version DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_user_point_accounts_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_point_accounts_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_user_point_accounts PRIMARY KEY (id),
        CONSTRAINT uq_user_point_accounts_user UNIQUE (user_id),
        CONSTRAINT chk_user_point_accounts_balance CHECK (balance >= 0)
    )
END;
```

- [ ] Add foreign key to `users` only if it does not exist.

```sql
IF OBJECT_ID(N'dbo.user_point_accounts', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE name = N'FK_user_point_accounts_user'
         AND parent_object_id = OBJECT_ID(N'dbo.user_point_accounts')
   )
BEGIN
    ALTER TABLE dbo.user_point_accounts
    ADD CONSTRAINT FK_user_point_accounts_user
    FOREIGN KEY (user_id) REFERENCES dbo.users(id)
END;
```

- [ ] Add idempotent `point_transactions` table creation after `user_point_accounts`.

```sql
IF OBJECT_ID(N'dbo.point_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.point_transactions (
        id BIGINT IDENTITY(1,1) NOT NULL,
        account_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        amount_delta INT NOT NULL,
        balance_after INT NOT NULL,
        reference_type VARCHAR(80) NULL,
        reference_id BIGINT NULL,
        note NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_point_transactions_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT pk_point_transactions PRIMARY KEY (id),
        CONSTRAINT chk_point_transactions_amount_delta CHECK (amount_delta <> 0),
        CONSTRAINT chk_point_transactions_balance_after CHECK (balance_after >= 0)
    )
END;
```

- [ ] Add foreign keys for `point_transactions.account_id` and `point_transactions.user_id`.

- [ ] Add index if missing:

```sql
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_point_transactions_user_created_at'
      AND object_id = OBJECT_ID(N'dbo.point_transactions')
)
BEGIN
    CREATE INDEX IX_point_transactions_user_created_at
    ON dbo.point_transactions(user_id, created_at DESC, id DESC)
END;
```

- [ ] Run:

```powershell
rg -n "user_point_accounts|point_transactions|IX_point_transactions_user_created_at" backend/src/main/resources/schema.sql
```

Expected: both table names and the index appear.

## Task 2: Backend Red Tests

**Files:**

- Create: `backend/src/test/java/com/example/horseracingtournamentsystem/point/UserPointAccountIntegrationTest.java`

- [ ] Add integration tests for:

```text
GET /api/v1/users/me/points returns balance 0 and creates one account.
Calling GET /api/v1/users/me/points twice still leaves one account for the user.
GET /api/v1/users/me/points/transactions returns empty page for a new account.
Service credit transaction increases balance and creates one transaction row.
Service debit beyond balance throws and does not create a transaction row.
PUT /api/v1/admin/point-settings does not change an existing user's balance.
```

- [ ] Run:

```powershell
cd backend
mvn -Dtest=UserPointAccountIntegrationTest test
```

Expected before implementation: compilation fails because the new point account classes do not exist, or requests return `404`.

## Task 3: Backend Entities And Repositories

**Files:**

- Create entity and repository files listed in the file map.

- [ ] Create `PointTransactionType` enum with:

```java
FIRST_LOGIN_BONUS,
BLOG_REWARD,
PREDICTION_ENTRY,
PREDICTION_CORRECT_REWARD,
RACE_CANCEL_REFUND,
ADMIN_ADJUSTMENT
```

- [ ] Create `UserPointAccount` mapped to `user_point_accounts`.

Required fields:

```text
id, user, balance, version, createdAt, updatedAt
```

Required methods:

```text
static UserPointAccount create(User user)
void applyDelta(int amountDelta)
```

`applyDelta` must throw `IllegalArgumentException` when the new balance would be negative.

- [ ] Create `PointTransaction` mapped to `point_transactions`.

Required fields:

```text
id, account, user, type, amountDelta, balanceAfter, referenceType, referenceId, note, createdAt
```

Required factory:

```text
static PointTransaction create(UserPointAccount account, PointTransactionType type, int amountDelta, String referenceType, Long referenceId, String note)
```

- [ ] Create repositories:

```text
UserPointAccountRepository.findByUserEmail(String email)
UserPointAccountRepository.findByUserId(Long userId)
UserPointAccountRepository.existsByUserId(Long userId)
PointTransactionRepository.findByUserEmailOrderByCreatedAtDescIdDesc(String email, Pageable pageable)
```

## Task 4: Backend DTOs, Service, Controller

**Files:**

- Create DTO/service/controller files listed in the file map.

- [ ] Create `UserPointBalanceResponse`.

Shape:

```json
{ "balance": 0 }
```

- [ ] Create `PointTransactionResponse`.

Shape:

```json
{
  "id": 1,
  "type": "BLOG_REWARD",
  "amountDelta": 10,
  "balanceAfter": 10,
  "referenceType": "BLOG",
  "referenceId": 5,
  "note": "Blog read reward",
  "createdAt": "2026-06-03T10:30:00"
}
```

- [ ] Create `PointAccountService`.

Required methods:

```text
UserPointBalanceResponse getBalance(String email)
Page<PointTransactionResponse> getTransactions(String email, Pageable pageable)
PointTransactionResponse applyTransaction(String email, PointTransactionType type, int amountDelta, String referenceType, Long referenceId, String note)
```

Transactional rules:

- `getBalance` creates missing account with balance `0`.
- `getTransactions` creates missing account before querying history.
- `applyTransaction` updates account and inserts a transaction in one transaction.
- `applyTransaction` rejects `amountDelta == 0`.
- `applyTransaction` rejects any debit that would make balance negative.

- [ ] Create `UserPointController`.

Endpoints:

```text
GET /api/v1/users/me/points
GET /api/v1/users/me/points/transactions?page=0&size=20
```

- [ ] Run:

```powershell
cd backend
mvn -Dtest=UserPointAccountIntegrationTest test
```

Expected: all user point account tests pass.

## Task 5: Frontend API

**Files:**

- Create: `frontend/src/types/pointAccount.ts`
- Create: `frontend/src/api/pointAccountApi.ts`
- Create: `frontend/src/api/pointAccountApi.test.ts`

- [ ] Define types:

```ts
export type UserPointBalance = { balance: number };

export type PointTransaction = {
  id: number;
  type: string;
  amountDelta: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: number | null;
  note?: string | null;
  createdAt: string;
};

export type PointTransactionPage = {
  content: PointTransaction[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
```

- [ ] Implement API with shared `httpClient`.

Endpoints:

```text
GET /users/me/points
GET /users/me/points/transactions
```

- [ ] Tests must assert `httpClient.get` calls these endpoints and passes pagination params for history.

- [ ] Run:

```powershell
cd frontend
npm.cmd test -- --run src/api/pointAccountApi.test.ts
```

Expected: API tests pass.

## Task 6: Frontend Components

**Files:**

- Create: `frontend/src/components/PointBalancePanel.tsx`
- Create: `frontend/src/components/PointBalancePanel.test.tsx`
- Create: `frontend/src/components/PointTransactionHistory.tsx`
- Create: `frontend/src/components/PointTransactionHistory.test.tsx`

- [ ] `PointBalancePanel` loads balance on mount.

Behavior:

```text
loading: role="status" with "Loading point balance..."
success: heading "Point Balance" and value like "0 points"
error: role="alert" with "Could not load point balance."
```

- [ ] `PointTransactionHistory` loads first page on mount.

Behavior:

```text
loading: role="status" with "Loading point history..."
empty: "No point activity yet."
success: list/table of transactions newest first
error: role="alert" with "Could not load point history."
```

- [ ] Tests cover loading success, empty state, error state, and positive/negative deltas.

- [ ] Run:

```powershell
cd frontend
npm.cmd test -- --run src/components/PointBalancePanel.test.tsx src/components/PointTransactionHistory.test.tsx
```

Expected: component tests pass.

## Task 7: Spectator Dashboard Integration

**Files:**

- Modify: `frontend/src/pages/RoleDashboardPage.tsx`

- [ ] Render point widgets only for `role === "Spectator"`.

Expected user-visible result:

```text
Spectator Dashboard
Point Balance
Recent Point Activity
```

- [ ] Add or update route/page tests so `/spectator/dashboard` displays the point balance panel for authenticated spectator users.

- [ ] Run:

```powershell
cd frontend
npm.cmd test -- --run src/App.test.tsx
```

Expected: route tests pass.

## Task 8: Full Verification

- [ ] Backend focused test:

```powershell
cd backend
mvn -Dtest=UserPointAccountIntegrationTest test
```

- [ ] Existing point settings regression:

```powershell
cd backend
mvn -Dtest=AdminPointSettingsIntegrationTest test
```

- [ ] Frontend focused tests:

```powershell
cd frontend
npm.cmd test -- --run src/api/pointAccountApi.test.ts src/components/PointBalancePanel.test.tsx src/components/PointTransactionHistory.test.tsx src/App.test.tsx
```

- [ ] Frontend build:

```powershell
cd frontend
npm.cmd run build
```

Expected: all commands exit `0`. Vite chunk size warnings are acceptable if the build succeeds.

## Out Of Scope

- No blog reward claim endpoint.
- No prediction entry spending endpoint.
- No prediction reward payout.
- No first-login bonus award.
- No admin point balance list or adjustment UI.
- No change to user balances when `/admin/points` settings are updated.

## Self-Review

Spec coverage:

- One point account per user: Tasks 1, 3, 4.
- Balance in `user_point_accounts`: Tasks 1 and 3.
- Future point changes logged in `point_transactions`: Tasks 1, 3, 4.
- Logged-in balance/history APIs: Task 4.
- Frontend spectator/user display: Tasks 5, 6, 7.
- Admin settings do not change balances: Task 2 regression coverage.

Placeholder scan:

- The plan uses concrete file paths, endpoints, table names, response shapes, commands, and expected outcomes.

Type consistency:

- Database names, JPA concepts, API paths, frontend types, and test names use the same point account vocabulary.
