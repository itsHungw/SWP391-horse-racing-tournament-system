# User Point Account Foundation Design

## Purpose

Create the user-side point wallet foundation before blog rewards and race predictions are connected to points.

This slice provides:

- one point account per user,
- balance stored in `user_point_accounts`,
- append-only transaction history stored in `point_transactions`,
- logged-in user APIs for current balance and transaction history,
- frontend display for the logged-in spectator/user.

This slice does not grant blog rewards, charge prediction entry costs, pay prediction rewards, apply first-login bonuses, or expose admin balance management.

## Current Database Status

Runtime schema status from `backend/src/main/resources/schema.sql`:

- `point_settings` exists and is seeded.
- `user_point_accounts` does not exist.
- `point_transactions` does not exist.

Backend code status:

- `com.example.horseracingtournamentsystem.point` currently contains Admin Point Settings code.
- There are no JPA entities, repositories, services, or controllers for user point accounts.
- There are no user point balance APIs.

Documentation status:

- `docs/specs/data/01_database-design.md` names `user_point_accounts` and `point_transactions` as part of the virtual point model.
- `docs/specs/data/02_erd-and-status-lifecycles.md` shows `users ||--|| user_point_accounts`.
- `docs/superpowers/specs/2026-05-17-prediction-schema-refactor-design.md` explicitly says to keep `user_point_accounts` and `point_transactions`.

Conclusion: the tables are planned in docs but not implemented in the runtime backend schema. This implementation should add them idempotently and must not create duplicate tables if they are added before the work starts.

## Recommended Approach

Use a dedicated backend point-account module under the existing `point` package. Keep account reads and future balance mutation logic in one service so later blog and prediction features cannot update balances without transaction logging.

Recommended approach:

- Add missing DB tables only when they do not already exist.
- Map tables with JPA entities and repositories.
- Use `PointAccountService.getOrCreateAccount(email)` for read APIs and future point flows.
- Add an internal `applyTransaction(...)` service method for future features, but do not expose any public API that changes points in this slice.
- Keep `PointSettingsService` separate. Updating `/admin/points` settings must not update existing balances.

Alternative approaches considered:

1. Add balance column directly to `users`.
   - Rejected because docs already define `user_point_accounts`, and a separate account table keeps wallet data isolated.
2. Use only `point_transactions` and calculate balance by summing history.
   - Rejected for runtime reads because account balance should be cheap and explicit. Transactions remain the audit trail.
3. Build admin balance management now.
   - Rejected for scope. User balance/history is the foundation; admin views can be a separate slice.

## Database Design

### `user_point_accounts`

One row per user.

```sql
CREATE TABLE dbo.user_point_accounts (
    id BIGINT IDENTITY(1,1) NOT NULL,
    user_id BIGINT NOT NULL,
    balance INT NOT NULL CONSTRAINT DF_user_point_accounts_balance DEFAULT 0,
    version BIGINT NOT NULL CONSTRAINT DF_user_point_accounts_version DEFAULT 0,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_user_point_accounts_created_at DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_point_accounts_updated_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_user_point_accounts PRIMARY KEY (id),
    CONSTRAINT uq_user_point_accounts_user UNIQUE (user_id),
    CONSTRAINT chk_user_point_accounts_balance CHECK (balance >= 0),
    CONSTRAINT fk_user_point_accounts_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
);
```

Notes:

- New accounts start with balance `0`.
- `version` supports optimistic locking with JPA `@Version`.
- Existing users do not need immediate backfill if service creates accounts on first read; a backfill insert can also be included safely for existing users with no account.

### `point_transactions`

Append-only point ledger.

```sql
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
    CONSTRAINT chk_point_transactions_balance_after CHECK (balance_after >= 0),
    CONSTRAINT fk_point_transactions_account FOREIGN KEY (account_id) REFERENCES dbo.user_point_accounts(id),
    CONSTRAINT fk_point_transactions_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
);
```

Recommended index:

```sql
CREATE INDEX ix_point_transactions_user_created_at
ON dbo.point_transactions(user_id, created_at DESC, id DESC);
```

Transaction types for the enum:

- `FIRST_LOGIN_BONUS`
- `BLOG_REWARD`
- `PREDICTION_ENTRY`
- `PREDICTION_CORRECT_REWARD`
- `RACE_CANCEL_REFUND`
- `ADMIN_ADJUSTMENT`

This slice should not create any transaction rows during account creation, because creating an account with balance `0` is not a point change.

## Backend Design

Create or extend package:

```text
backend/src/main/java/com/example/horseracingtournamentsystem/point
```

Recommended files:

- `entity/UserPointAccount.java`
- `entity/PointTransaction.java`
- `entity/PointTransactionType.java`
- `repository/UserPointAccountRepository.java`
- `repository/PointTransactionRepository.java`
- `dto/UserPointBalanceResponse.java`
- `dto/PointTransactionResponse.java`
- `service/PointAccountService.java`
- `controller/UserPointController.java`

Service responsibilities:

- Find the authenticated user by email.
- Create a missing account with balance `0`.
- Return current balance for the logged-in user.
- Return paged transaction history for the logged-in user.
- Provide an internal transactional method for future point changes:

```java
PointTransactionResponse applyTransaction(
        String userEmail,
        PointTransactionType type,
        int amountDelta,
        String referenceType,
        Long referenceId,
        String note
);
```

Rules for `applyTransaction`:

- `amountDelta` must not be `0`.
- Resulting balance must never be negative.
- Account balance and transaction row must be saved in the same database transaction.
- `balance_after` must match the account balance after the update.
- No controller should expose this method in this slice.

Controller responsibilities:

- Provide user-only endpoints under `/api/v1/users/me/points`.
- Depend on `Authentication.getName()` for the current email.
- Return `401` for unauthenticated requests via existing security.

## API Endpoints

### GET `/api/v1/users/me/points`

Returns the current user's balance.

```json
{
  "balance": 0
}
```

### GET `/api/v1/users/me/points/transactions?page=0&size=20`

Returns the current user's point transaction history, newest first, using Spring `Page`.

Example empty response:

```json
{
  "content": [],
  "number": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

Example transaction item:

```json
{
  "id": 1001,
  "type": "BLOG_REWARD",
  "amountDelta": 10,
  "balanceAfter": 30,
  "referenceType": "BLOG",
  "referenceId": 42,
  "note": "Blog read reward",
  "createdAt": "2026-06-03T10:30:00"
}
```

## Frontend Display Plan

Use the shared `httpClient`, not raw `fetch`.

Recommended files:

- `frontend/src/types/pointAccount.ts`
- `frontend/src/api/pointAccountApi.ts`
- `frontend/src/components/PointBalancePanel.tsx`
- `frontend/src/components/PointTransactionHistory.tsx`
- Tests beside the API/components.

Display locations:

- Show a compact point balance panel on the spectator dashboard.
- Show recent point history below the balance panel.
- If the generic dashboard remains shared for multiple roles, render point widgets only when `role === "Spectator"`.

Initial UI behavior:

- Balance loads from `GET /users/me/points`.
- History loads from `GET /users/me/points/transactions`.
- Empty history shows a clear empty state.
- API failure shows `role="alert"`.
- Loading states use `role="status"`.

## Relationship To Admin Point Settings

Admin Point Settings controls point rule values only.

Changing:

- `FIRST_LOGIN_BONUS`
- `BLOG_REWARD_POINTS`
- `DAILY_BLOG_REWARD_LIMIT`
- `PREDICTION_ENTRY_COST`
- `PREDICTION_CORRECT_REWARD`

must not directly modify any row in:

- `user_point_accounts`
- `point_transactions`

Balances change only through explicit point transaction workflows.

## Testing Strategy

Backend tests:

- Logged-in user can read balance and missing account is created with `0`.
- Repeated balance reads do not create duplicate accounts.
- Logged-in user can read an empty transaction history.
- Transaction history returns only the authenticated user's transactions.
- Internal service transaction method credits points and logs a transaction.
- Internal service transaction method rejects debits that would make balance negative.
- Updating admin point settings does not change a user's account balance.

Frontend tests:

- API module calls `/users/me/points` and `/users/me/points/transactions` through `httpClient`.
- Balance panel renders loaded balance.
- Transaction history renders empty state.
- Transaction history renders positive and negative deltas.
- API errors render accessible alerts.
- Spectator dashboard includes the point balance panel.

## Out Of Scope

- Blog reward claim flow.
- Daily blog reward cap enforcement.
- Prediction entry spending.
- Correct prediction reward payout.
- First-login bonus award.
- Admin balance adjustment or admin balance list UI.
