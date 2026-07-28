# Admin Withdrawal Operations Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a searchable, risk-aware admin withdrawal workspace with a large review modal, immutable action audit, safe concurrency, and a two-sheet Excel export.

**Architecture:** Keep withdrawal state transitions transactional in `WithdrawalService`, add focused query, risk, review, and export services around it, and persist structured bank snapshots plus append-only histories. The React page owns URL-backed list state, fetches review detail only when opened, and delegates table, modal, risk, timeline, and export behavior to focused components.

**Tech Stack:** Java 21, Spring Boot 4.0.6, Spring Data JPA Specifications, Jakarta Validation, Flyway/PostgreSQL, Apache POI 5.4.1, React 19, TypeScript 5.8, React Router 7, Axios, Tailwind CSS 4, Vitest 3, Testing Library.

---

## File map

### Backend files to create

- `backend/src/main/resources/db/migration/V30__withdrawal_operations.sql` — structured payout snapshots, concurrency version, action history, and export audit schema.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalActionType.java` — stable audit action enum.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRiskLevel.java` — `LOW/MEDIUM/HIGH` ordering.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalActionHistory.java` — append-only transition evidence.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalExportAudit.java` — metadata-only sensitive export audit.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalActionHistoryRepository.java` — ordered history access.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalExportAuditRepository.java` — export audit persistence.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalRiskFindingResponse.java` — explainable finding contract.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalRiskAssessmentResponse.java` — overall level plus findings/context.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalRowResponse.java` — masked list projection.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalSummaryResponse.java` — four KPI values.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalReviewResponse.java` — complete modal payload.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/ApproveWithdrawalRequest.java` — acknowledgement/internal-note request.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/MarkWithdrawalPaidRequest.java` — transfer reference/internal note.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalExportPreviewResponse.java` — confirmation counts.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalRiskAssessmentService.java` — deterministic rules.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalQueryService.java` — specifications, paging, summary projections.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalReviewService.java` — detail aggregation.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java` — secure two-sheet workbook.
- `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java` — API and lifecycle coverage.
- `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalRiskAssessmentServiceTest.java` — rule boundaries.
- `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalExportServiceTest.java` — workbook semantics and security.

### Backend files to modify

- `backend/pom.xml` — Apache POI dependency.
- `backend/src/main/resources/application.yml` — configurable risk/export limits.
- `backend/src/test/resources/application.yml` — deterministic test limits.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRequest.java` — destination snapshot and `@Version`.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/UserBankAccount.java` — normalized identity helper only.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/UserBankAccountRepository.java` — owned-account lookup and duplicate-owner count.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java` — specifications, locks, aggregates, recent history.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/CreateWithdrawalRequest.java` — replace free-form bank text with bank-account ID.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/RejectWithdrawalRequest.java` — public reason plus internal note.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalResponse.java` — safe structured destination fields while retaining display text.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/WithdrawalController.java` — structured create contract.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWithdrawalController.java` — pageable/query/review/action/export endpoints.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java` — locked transitions and audit writes.

### Frontend files to create

- `frontend/src/pages/admin/withdrawals/withdrawalViewModel.ts` — URL filter parsing/serialization and presentation helpers.
- `frontend/src/pages/admin/withdrawals/WithdrawalSummaryCards.tsx` — independent KPI region.
- `frontend/src/pages/admin/withdrawals/WithdrawalFilters.tsx` — search/filter/sort controls.
- `frontend/src/pages/admin/withdrawals/WithdrawalOperationsTable.tsx` — responsive list and quick approve.
- `frontend/src/pages/admin/withdrawals/WithdrawalRiskPanel.tsx` — explainable findings.
- `frontend/src/pages/admin/withdrawals/WithdrawalTimeline.tsx` — lifecycle/action history.
- `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx` — large accessible review/action workspace.
- `frontend/src/pages/admin/withdrawals/WithdrawalExportDialog.tsx` — preview, sensitive-data confirmation, download.
- `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx` — workspace integration behavior.
- `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx` — modal accessibility and validation.

### Frontend files to modify

- `frontend/src/types/wallet.ts` — admin row/summary/review/risk/history/page contracts.
- `frontend/src/api/adminWalletApi.ts` — query, detail, actions, preview, blob download.
- `frontend/src/api/walletApi.ts` — user withdrawal creation by saved bank account ID.
- `frontend/src/pages/wallet/WithdrawSheet.tsx` — submit the selected account ID.
- `frontend/src/pages/wallet/WalletPage.test.tsx` — assert the updated request contract.
- `frontend/src/pages/admin/AdminWithdrawalsPage.tsx` — replace the monolith with workspace orchestration.

---

### Task 1: Persist structured destinations and immutable audit records

**Files:**
- Create: `backend/src/main/resources/db/migration/V30__withdrawal_operations.sql`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalActionType.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRiskLevel.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalActionHistory.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalExportAudit.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalActionHistoryRepository.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalExportAuditRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/WithdrawalRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`

- [ ] **Step 1: Write the failing persistence test**

Create the integration-test shell using the same `TestDatabaseCleaner`, role setup, JWT setup, and `activeUser` helper as `WalletEnforcementIntegrationTest`. Add a test that saves a withdrawal with structured snapshot data, appends an `APPROVED` history record, reloads it, and asserts immutable destination fields and ordered history:

```java
@Test
void withdrawalPersistsImmutableDestinationAndOrderedActions() {
    WithdrawalRequest withdrawal = withdrawalRepository.save(WithdrawalRequest.create(
            target, 250_000L, bankAccount, "TARGET · 0123456789 · Test Bank (TEST)"));
    actionHistoryRepository.save(WithdrawalActionHistory.record(
            withdrawal, WithdrawalActionType.APPROVED,
            WithdrawalStatus.REQUESTED, WithdrawalStatus.APPROVED,
            admin, null, "Reviewed account", null,
            WithdrawalRiskLevel.LOW, "[]"));

    WithdrawalRequest stored = withdrawalRepository.findById(withdrawal.getId()).orElseThrow();
    assertEquals("TEST", stored.getBankCode());
    assertEquals("0123456789", stored.getAccountNumber());
    assertEquals("TARGET", stored.getAccountHolder());
    assertEquals(WithdrawalActionType.APPROVED,
            actionHistoryRepository.findByWithdrawalIdOrderByCreatedAtAscIdAsc(stored.getId()).getFirst().getAction());
}
```

- [ ] **Step 2: Run the test and verify the new types are missing**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#withdrawalPersistsImmutableDestinationAndOrderedActions test`

Expected: test compilation fails because the new entity types and structured `create` overload do not exist.

- [ ] **Step 3: Add schema and entity model**

Use `V30__withdrawal_operations.sql` to add nullable legacy-compatible snapshot columns plus non-null version, create append-only tables, and index review paths:

```sql
ALTER TABLE withdrawal_requests ADD COLUMN bank_account_id BIGINT NULL;
ALTER TABLE withdrawal_requests ADD COLUMN bank_code VARCHAR(20) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN bank_name VARCHAR(100) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN account_number VARCHAR(40) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN account_holder VARCHAR(150) NULL;
ALTER TABLE withdrawal_requests ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE withdrawal_requests
    ADD CONSTRAINT fk_withdrawal_bank_account
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;

CREATE TABLE withdrawal_action_history (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    withdrawal_id BIGINT NOT NULL,
    action VARCHAR(30) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    actor_id BIGINT NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    public_reason VARCHAR(500),
    internal_note VARCHAR(1000),
    transfer_reference VARCHAR(120),
    risk_level VARCHAR(10) NOT NULL,
    risk_findings TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_withdrawal_action_request FOREIGN KEY (withdrawal_id) REFERENCES withdrawal_requests(id),
    CONSTRAINT fk_withdrawal_action_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE withdrawal_export_audits (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    actor_id BIGINT NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    normalized_filters VARCHAR(2000) NOT NULL,
    operations_rows INTEGER NOT NULL,
    reconciliation_rows INTEGER NOT NULL,
    exported_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_withdrawal_export_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE INDEX idx_withdrawal_requested_status ON withdrawal_requests(status, requested_at DESC);
CREATE INDEX idx_withdrawal_destination_identity ON withdrawal_requests(bank_code, account_number);
CREATE INDEX idx_withdrawal_action_request_time ON withdrawal_action_history(withdrawal_id, created_at, id);
```

Add `WithdrawalRiskLevel { LOW, MEDIUM, HIGH }` and `WithdrawalActionType { CREATED, APPROVED, REJECTED, MARKED_PAID, CANCELLED }`. Map the history/export entities with lazy `@ManyToOne` relations, immutable factory methods, `LocalDateTime.now()`, and no public mutators. Add snapshot fields and `@Version private long version` to `WithdrawalRequest`.

- [ ] **Step 4: Add repositories and locked lookup**

Extend `WithdrawalRequestRepository` with `JpaSpecificationExecutor<WithdrawalRequest>` and add:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select w from WithdrawalRequest w join fetch w.user where w.id = :id")
Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") Long id);
```

Add ordered history and export-audit repositories. Use one repository method per contract; do not expose delete methods through services.

- [ ] **Step 5: Run the focused persistence test**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#withdrawalPersistsImmutableDestinationAndOrderedActions test`

Expected: PASS.

- [ ] **Step 6: Commit the persistence foundation**

```powershell
git add backend/src/main/resources/db/migration/V30__withdrawal_operations.sql backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java
git commit -m "feat: add withdrawal operations audit model"
```

### Task 2: Create withdrawals from an owned saved bank account

**Files:**
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/CreateWithdrawalRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/entity/UserBankAccount.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/UserBankAccountRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/WithdrawalController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`

- [ ] **Step 1: Write API tests for ownership and snapshots**

Add two MockMvc tests:

```java
@Test
void userCreatesWithdrawalFromOwnedSavedAccount() throws Exception {
    mockMvc.perform(post("/api/v1/wallet/withdrawals")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"amount\":250000,\"bankAccountId\":" + targetBank.getId() + "}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.bankCode").value("TEST"))
            .andExpect(jsonPath("$.maskedAccountNumber").value("•••• 6789"));
}

@Test
void userCannotWithdrawToAnotherUsersSavedAccount() throws Exception {
    mockMvc.perform(post("/api/v1/wallet/withdrawals")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + targetToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"amount\":250000,\"bankAccountId\":" + otherUsersBank.getId() + "}"))
            .andExpect(status().isForbidden());
}
```

Fund the target wallet through `walletService.adjust` during setup so the first request reaches destination validation and hold creation.

- [ ] **Step 2: Run tests and verify the old free-form contract fails**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#userCreatesWithdrawalFromOwnedSavedAccount,AdminWithdrawalOperationsIntegrationTest#userCannotWithdrawToAnotherUsersSavedAccount test`

Expected: FAIL because `bankAccountId` is not accepted and no structured response fields exist.

- [ ] **Step 3: Replace the create contract and snapshot the account**

Use validation on the request:

```java
public record CreateWithdrawalRequest(
        @Positive long amount,
        @NotNull Long bankAccountId
) {}
```

Add `findByIdAndUserId(Long id, Long userId)` to `UserBankAccountRepository`. The controller passes the authenticated user plus ID to `WithdrawalService.createRequest`. The service loads only an owned account, returns `403` for a non-owned/missing destination without revealing its existence, snapshots its four structured fields, writes the legacy display string server-side, then holds funds and appends a `CREATED` action with a `LOW`/empty risk snapshot.

Return `bankCode`, `bankName`, `accountHolder`, and `maskedAccountNumber`; keep `bankInfo` temporarily for the existing user withdrawal list. Implement one masking helper that returns `•••• ` plus the last four digits.

- [ ] **Step 4: Run the focused create tests**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#userCreatesWithdrawalFromOwnedSavedAccount,AdminWithdrawalOperationsIntegrationTest#userCannotWithdrawToAnotherUsersSavedAccount test`

Expected: PASS, with one hold transaction and one `CREATED` history row.

- [ ] **Step 5: Commit structured creation**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java
git commit -m "feat: snapshot withdrawal payout destinations"
```

### Task 3: Implement explainable risk rules

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalRiskFindingResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalRiskAssessmentResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalRiskAssessmentService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/UserBankAccountRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalRiskAssessmentServiceTest.java`

- [ ] **Step 1: Write unit tests for every rule boundary**

Mock repositories and express each result as evidence, not a numeric score:

```java
@Test
void lockedWalletProducesHighRiskWithEvidence() {
    when(walletService.getOrCreateAccount(target)).thenReturn(lockedWallet);
    when(withdrawalRepository.findTerminalAmountsSince(target.getId(), ninetyDaysAgo)).thenReturn(List.of());

    WithdrawalRiskAssessmentResponse result = service.assess(withdrawal);

    assertEquals(WithdrawalRiskLevel.HIGH, result.level());
    assertTrue(result.findings().stream().anyMatch(f -> f.code().equals("WALLET_LOCKED")));
}

@Test
void twoTimesMedianRequiresAtLeastThreeTerminalWithdrawals() {
    when(withdrawalRepository.findTerminalAmountsSince(target.getId(), ninetyDaysAgo))
            .thenReturn(List.of(100_000L, 120_000L));
    assertEquals(WithdrawalRiskLevel.LOW, service.assess(withdrawalAt(500_000L)).level());

    when(withdrawalRepository.findTerminalAmountsSince(target.getId(), ninetyDaysAgo))
            .thenReturn(List.of(100_000L, 120_000L, 140_000L));
    assertEquals(WithdrawalRiskLevel.MEDIUM, service.assess(withdrawalAt(300_000L)).level());
}
```

Also test account restriction, shared normalized destination, exactly 2 versus 3 requests in 24 hours, recent reject/cancel at seven-day boundary, max-severity selection, first-withdrawal context, and legacy-destination context.

- [ ] **Step 2: Run risk tests and verify failure**

Run: `cd backend; .\mvnw.cmd -Dtest=WithdrawalRiskAssessmentServiceTest test`

Expected: test compilation fails because risk DTOs and service do not exist.

- [ ] **Step 3: Implement stable risk contracts and configurable thresholds**

Use records:

```java
public record WithdrawalRiskFindingResponse(
        String code,
        WithdrawalRiskLevel severity,
        String title,
        String explanation,
        String evidence,
        String suggestedCheck
) {}

public record WithdrawalRiskAssessmentResponse(
        WithdrawalRiskLevel level,
        List<WithdrawalRiskFindingResponse> findings,
        List<String> contextMarkers
) {}
```

Add configuration defaults:

```yaml
wallet:
  withdrawal:
    risk:
      velocity-count: ${WALLET_WITHDRAWAL_RISK_VELOCITY_COUNT:3}
      velocity-hours: ${WALLET_WITHDRAWAL_RISK_VELOCITY_HOURS:24}
      anomaly-multiplier: ${WALLET_WITHDRAWAL_RISK_ANOMALY_MULTIPLIER:2.0}
      anomaly-min-history: ${WALLET_WITHDRAWAL_RISK_ANOMALY_MIN_HISTORY:3}
      recent-terminal-days: ${WALLET_WITHDRAWAL_RISK_RECENT_TERMINAL_DAYS:7}
```

Keep rule methods private and independently named. Sort findings `HIGH` before `MEDIUM`, then by stable code. Never expose repository entities from the service.

- [ ] **Step 4: Run risk tests**

Run: `cd backend; .\mvnw.cmd -Dtest=WithdrawalRiskAssessmentServiceTest test`

Expected: PASS for all rule boundaries.

- [ ] **Step 5: Commit the risk engine**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/main/resources/application.yml backend/src/test/resources/application.yml backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalRiskAssessmentServiceTest.java
git commit -m "feat: add explainable withdrawal risk assessment"
```

### Task 4: Add pageable admin list and operational summary

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalRowResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalSummaryResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalQueryService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWithdrawalController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`

- [ ] **Step 1: Write list and summary API tests**

Seed requested, approved, paid, rejected, low-risk, and high-risk rows across two users. Assert page metadata, masked account, search, filters, sort, and KPI totals:

```java
@Test
void adminSearchesAndPagesMaskedWithdrawalRows() throws Exception {
    mockMvc.perform(get("/api/v1/admin/withdrawals")
                    .param("query", "target@example.com")
                    .param("status", "REQUESTED")
                    .param("risk", "HIGH")
                    .param("sort", "amount,desc")
                    .param("page", "0").param("size", "20")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].maskedAccountNumber").value("•••• 6789"))
            .andExpect(jsonPath("$.content[0].risk.level").value("HIGH"))
            .andExpect(jsonPath("$.totalElements").value(1));
}

@Test
void summaryReturnsGlobalOperationalMetrics() throws Exception {
    mockMvc.perform(get("/api/v1/admin/withdrawals/summary")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.needsReview").value(2))
            .andExpect(jsonPath("$.readyToPay").value(1))
            .andExpect(jsonPath("$.pendingValue").value(750000))
            .andExpect(jsonPath("$.highRisk").value(1));
}
```

- [ ] **Step 2: Run list/summary tests and verify failure**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#adminSearchesAndPagesMaskedWithdrawalRows,AdminWithdrawalOperationsIntegrationTest#summaryReturnsGlobalOperationalMetrics test`

Expected: FAIL because the existing endpoint returns an unpaged array and has no summary endpoint.

- [ ] **Step 3: Implement normalized query parameters and pageable results**

Build one `WithdrawalAdminFilter` value object in the query-service file with trimmed query, parsed enums, inclusive start, exclusive end, bounded `size` of 10–100, and an allowlist mapping for sort values. Reject unsupported sort/property input with `400` instead of passing arbitrary properties to Spring Data.

Use `JpaSpecificationExecutor.findAll(specification, pageable)` with `@EntityGraph(attributePaths = "user")` or an equivalent fetch strategy. For list risk data, batch user IDs and destination identities before assessment; do not call repositories once per row.

Return Spring's page-shaped JSON or an explicit `PageResponse<AdminWithdrawalRowResponse>` matching:

```java
public record AdminWithdrawalRowResponse(
        Long id, Long userId, String userName, String userEmail,
        long amount, WithdrawalStatus status,
        String bankCode, String bankName, String accountHolder,
        String maskedAccountNumber,
        WithdrawalRiskAssessmentResponse risk,
        LocalDateTime requestedAt
) {}
```

Summary aggregates status counts and pending value in database queries, while high-risk count reuses batched risk inputs for active requests.

- [ ] **Step 4: Run list and summary tests**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#adminSearchesAndPagesMaskedWithdrawalRows,AdminWithdrawalOperationsIntegrationTest#summaryReturnsGlobalOperationalMetrics test`

Expected: PASS.

- [ ] **Step 5: Commit query endpoints**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java
git commit -m "feat: add withdrawal operations query endpoints"
```

### Task 5: Add review detail, audited actions, and conflict handling

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/AdminWithdrawalReviewResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/ApproveWithdrawalRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/MarkWithdrawalPaidRequest.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/AdminWithdrawalReviewService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/RejectWithdrawalRequest.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWithdrawalController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java`

- [ ] **Step 1: Write review and action tests**

Add tests proving review composition, high-risk acknowledgement, public/internal note separation, transfer-reference requirement, append-only actors, cancel history, and conflict:

```java
@Test
void highRiskApprovalRequiresAcknowledgementAndInternalNote() throws Exception {
    mockMvc.perform(post("/api/v1/admin/withdrawals/{id}/approve", highRiskWithdrawal.getId())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"riskAcknowledged\":false,\"internalNote\":\"\"}"))
            .andExpect(status().isBadRequest());
}

@Test
void markPaidRequiresTransferReferenceAndPreservesApprover() throws Exception {
    approve(lowRiskWithdrawal, adminToken, true, "Reviewed");
    markPaid(lowRiskWithdrawal, secondAdminToken, "BANK-20260721-001", "Transferred");

    List<WithdrawalActionHistory> history = actionHistoryRepository
            .findByWithdrawalIdOrderByCreatedAtAscIdAsc(lowRiskWithdrawal.getId());
    assertEquals(List.of(WithdrawalActionType.CREATED, WithdrawalActionType.APPROVED,
            WithdrawalActionType.MARKED_PAID), history.stream().map(WithdrawalActionHistory::getAction).toList());
    assertEquals(admin.getId(), history.get(1).getActor().getId());
    assertEquals(secondAdmin.getId(), history.get(2).getActor().getId());
}
```

Simulate stale transitions with two transactions or consecutive requests and assert the second action returns `409` and creates no second refund/history row.

- [ ] **Step 2: Run action tests and verify failure**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest#highRiskApprovalRequiresAcknowledgementAndInternalNote,AdminWithdrawalOperationsIntegrationTest#markPaidRequiresTransferReferenceAndPreservesApprover test`

Expected: FAIL because action bodies, detail response, and append-only action writes are absent.

- [ ] **Step 3: Implement detail aggregation and validated action bodies**

Define action requests:

```java
public record ApproveWithdrawalRequest(boolean riskAcknowledged, @Size(max = 1000) String internalNote) {}

public record RejectWithdrawalRequest(
        @NotBlank @Size(max = 500) String publicReason,
        @Size(max = 1000) String internalNote
) {}

public record MarkWithdrawalPaidRequest(
        @NotBlank @Size(max = 120) String transferReference,
        @Size(max = 1000) String internalNote
) {}
```

`AdminWithdrawalReviewService.get(id)` returns immutable nested records for user/wallet context, structured destination, risk, lifetime aggregates, five recent withdrawals, and ordered action history. Reuse existing account and wallet status histories only as context; do not duplicate them into withdrawal history.

Change transitions to load `findByIdForUpdate`, assess risk inside the same transaction, enforce high-risk acknowledgement/note, mutate the state machine, and append one action history row. JSON-serialize only stable risk response data. `markPaid` stores the transfer reference only in its action row. `cancel` appends `CANCELLED` before refunding exactly once.

- [ ] **Step 4: Return review detail after every admin action**

Update controller mappings to accept `@Valid` request bodies and return `AdminWithdrawalReviewResponse`. Convert invalid lifecycle states and optimistic/lock conflicts to existing `409` error handling. Do not catch and downgrade transaction failures.

- [ ] **Step 5: Run all operations integration tests**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest test`

Expected: PASS.

- [ ] **Step 6: Commit audited review actions**

```powershell
git add backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/test/java/com/example/horseracingtournamentsystem/wallet/AdminWithdrawalOperationsIntegrationTest.java
git commit -m "feat: add audited withdrawal review actions"
```

### Task 6: Generate and audit the two-sheet Excel export

**Files:**
- Modify: `backend/pom.xml`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/dto/WithdrawalExportPreviewResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/service/WithdrawalExportService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/controller/AdminWithdrawalController.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/wallet/WithdrawalExportServiceTest.java`

- [ ] **Step 1: Write workbook contract tests**

Read generated bytes back with POI and assert semantic types and security:

```java
@Test
void workbookContainsMaskedOperationsAndFullReconciliationSheets() throws Exception {
    byte[] bytes = service.export(filter, admin);
    try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
        Sheet operations = workbook.getSheet("Operations");
        Sheet reconciliation = workbook.getSheet("Bank Reconciliation");
        assertNotNull(operations);
        assertNotNull(reconciliation);
        assertEquals(CellType.NUMERIC, operations.getRow(3).getCell(4).getCellType());
        assertEquals("•••• 6789", operations.getRow(3).getCell(7).getStringCellValue());
        assertEquals("0123456789", reconciliation.getRow(3).getCell(7).getStringCellValue());
    }
}

@Test
void userControlledFormulaTextIsEscaped() throws Exception {
    byte[] bytes = service.export(filterMatching("=HYPERLINK(\"bad\")"), admin);
    try (Workbook workbook = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
        Cell cell = workbook.getSheet("Operations").getRow(3).getCell(2);
        assertEquals(CellType.STRING, cell.getCellType());
        assertTrue(cell.getStringCellValue().startsWith("'="));
    }
}
```

Also assert `APPROVED/PAID` eligibility, transfer reference, freeze panes, auto-filter ranges, typed date cells, max-row validation, and one export-audit row without account numbers.

- [ ] **Step 2: Run export tests and verify missing dependency/service**

Run: `cd backend; .\mvnw.cmd -Dtest=WithdrawalExportServiceTest test`

Expected: test compilation fails because POI and export service are absent.

- [ ] **Step 3: Add POI and implement bounded streaming export**

Add:

```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.4.1</version>
</dependency>
```

Use `SXSSFWorkbook(100)` in try-with-resources. Create fonts and styles once per workbook and reuse them. Write numeric amounts with `setCellValue(long)`, Java time values as `java.util.Date` plus an Excel date format, freeze the header row, set auto-filters, and use fixed sensible widths rather than `autoSizeColumn` on streaming sheets. Escape strings whose first non-whitespace character is `=`, `+`, `-`, or `@` by prefixing an apostrophe.

Add:

```yaml
wallet:
  withdrawal:
    export:
      max-rows: ${WALLET_WITHDRAWAL_EXPORT_MAX_ROWS:50000}
```

Before workbook creation, count matching operations and reconciliation rows and reject counts over the limit. After successful byte generation, persist one metadata-only export audit.

- [ ] **Step 4: Add preview and download endpoints**

Preview returns counts and `containsSensitiveData = reconciliationRows > 0`. Download uses content type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Cache-Control: no-store`, and a filename such as `withdrawals-2026-07-21T143000.xlsx`. Both endpoints use the same filter normalization as the list.

- [ ] **Step 5: Run export and operations tests**

Run: `cd backend; .\mvnw.cmd -Dtest=WithdrawalExportServiceTest,AdminWithdrawalOperationsIntegrationTest test`

Expected: PASS.

- [ ] **Step 6: Commit export support**

```powershell
git add backend/pom.xml backend/src/main/resources backend/src/main/java/com/example/horseracingtournamentsystem/wallet backend/src/test/java/com/example/horseracingtournamentsystem/wallet
git commit -m "feat: export audited withdrawal workbooks"
```

### Task 7: Update frontend contracts and user withdrawal creation

**Files:**
- Modify: `frontend/src/types/wallet.ts`
- Modify: `frontend/src/api/walletApi.ts`
- Modify: `frontend/src/api/adminWalletApi.ts`
- Modify: `frontend/src/pages/wallet/WithdrawSheet.tsx`
- Modify: `frontend/src/pages/wallet/WalletPage.test.tsx`

- [ ] **Step 1: Update the wallet-page test to expect a bank account ID**

Submit the existing sheet and assert:

```ts
expect(walletApi.createWithdrawal).toHaveBeenCalledWith(150_000, 41);
```

The selected mocked account must use `id: 41`.

- [ ] **Step 2: Run the wallet test and verify it still sends bankInfo**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/wallet/WalletPage.test.tsx`

Expected: FAIL showing the second argument is the composed bank string.

- [ ] **Step 3: Add exact admin contracts and API methods**

Add TypeScript types matching backend names exactly:

```ts
export type WithdrawalRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type WithdrawalAdminFilters = {
  query?: string; status?: WithdrawalStatus; risk?: WithdrawalRiskLevel;
  from?: string; to?: string; sort?: "newest" | "oldest" | "amount_desc" | "risk_desc";
  page: number; size: number;
};
export type PageResponse<T> = {
  content: T[]; totalElements: number; totalPages: number; number: number; size: number;
};
```

Define risk finding/assessment, row, summary, nested review detail, action history, export preview, and action body types with no `any` fields.

Implement `listWithdrawals(filters)`, `getSummary()`, `getReview(id)`, `approve(id, body)`, `reject(id, body)`, `markPaid(id, body)`, `getExportPreview(filters)`, and `downloadExport(filters)`. Use `responseType: "blob"` for download and parse `Content-Disposition` only after validating the filename; otherwise use a generated safe default.

- [ ] **Step 4: Submit the selected account ID from the user sheet**

Change the API signature and call:

```ts
createWithdrawal: async (amount: number, bankAccountId: number) =>
  (await httpClient.post<Withdrawal>("/wallet/withdrawals", { amount, bankAccountId })).data,
```

In `WithdrawSheet`, call `walletApi.createWithdrawal(amountValue, selectedAccount.id)` and delete bank-info composition.

- [ ] **Step 5: Run wallet test and type-check**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/wallet/WalletPage.test.tsx; node node_modules/typescript/bin/tsc -b --force`

Expected: both commands PASS.

- [ ] **Step 6: Commit frontend contracts**

```powershell
git add frontend/src/types/wallet.ts frontend/src/api frontend/src/pages/wallet
git commit -m "feat: add withdrawal operations client contracts"
```

### Task 8: Build the URL-backed summary, filters, and operations table

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/withdrawalViewModel.ts`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalSummaryCards.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalFilters.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalOperationsTable.tsx`
- Create: `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.tsx`

- [ ] **Step 1: Write failing workspace tests**

Mock `adminWalletApi` and render the page inside `MemoryRouter` plus the existing admin-layout mocks. Cover independent KPI/list loading, URL filters, masked rows, pagination, card shortcuts, empty states, and quick-action eligibility:

```tsx
it("renders operational metrics and a masked risk-aware queue", async () => {
  renderPage("/admin/withdrawals?status=REQUESTED&page=1");
  expect(await screen.findByText("Needs review")).toBeInTheDocument();
  expect(screen.getByText("•••• 6789")).toBeInTheDocument();
  expect(screen.getByText("High risk")).toBeInTheDocument();
  expect(adminWalletApi.listWithdrawals).toHaveBeenCalledWith(
    expect.objectContaining({ status: "REQUESTED", page: 0 }),
  );
});

it("requires review instead of quick approve for flagged requests", async () => {
  renderPage();
  expect(await screen.findByRole("button", { name: /review withdrawal #22/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /quick approve withdrawal #22/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the admin page test and verify failure**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx`

Expected: FAIL because the current page has none of the new components/contracts.

- [ ] **Step 3: Implement URL state and focused presentation helpers**

`withdrawalViewModel.ts` exports `parseWithdrawalFilters(searchParams)`, `writeWithdrawalFilters(filters)`, `formatVnd`, `formatAdminDateTime`, `maskAccount`, and risk/status presentation maps. Clamp page/size and allow only known enums/sort values.

Use `useSearchParams` in the page. Debounce search by 300ms, reset page on filter changes, and load list/summary independently with separate loading/error state and request cancellation guards.

- [ ] **Step 4: Implement summary, filters, and responsive table**

Summary cards use buttons only where they apply a deterministic filter. Filters have labels, a clear-all action, and native date inputs. The table uses semantic table markup at desktop and labelled cards below the desktop breakpoint. Reuse `PaginationControls` with one-based UI and zero-based API conversion.

Only render quick approve when `row.status === "REQUESTED" && row.risk.level === "LOW"`. The quick action opens an in-page confirmation popover/dialog containing amount and masked destination; it never sends directly on the first click.

- [ ] **Step 5: Run workspace tests**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx`

Expected: PASS for list, filters, pagination, metrics, and eligibility.

- [ ] **Step 6: Commit the operations queue**

```powershell
git add frontend/src/pages/admin/AdminWithdrawalsPage.tsx frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx frontend/src/pages/admin/withdrawals
git commit -m "feat: build admin withdrawal operations queue"
```

### Task 9: Build the accessible large review modal and audited actions

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalRiskPanel.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalTimeline.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.tsx`
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`

- [ ] **Step 1: Write failing modal behavior tests**

Cover detail loading/retry, risk evidence, action requirements, backdrop/Escape dismissal, unsaved guard, busy lock, focus restoration, conflict refresh, and mobile semantics:

```tsx
it("guards a high-risk approval with acknowledgement and an internal note", async () => {
  renderModal({ review: highRiskReview });
  const approve = await screen.findByRole("button", { name: /approve withdrawal/i });
  expect(approve).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: /reviewed the risk flags/i }));
  await user.type(screen.getByLabelText(/internal note/i), "Verified account ownership by case review");
  expect(approve).toBeEnabled();
});

it("asks before backdrop dismissal when action fields are dirty", async () => {
  renderModal({ review: approvedReview });
  await user.type(screen.getByLabelText(/bank transfer reference/i), "BANK-001");
  await user.click(screen.getByTestId("withdrawal-review-backdrop"));
  expect(screen.getByRole("dialog", { name: /discard unsaved review changes/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run modal tests and verify failure**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx`

Expected: FAIL because modal components do not exist.

- [ ] **Step 3: Implement risk and timeline components**

`WithdrawalRiskPanel` renders level, findings, evidence, and suggested checks using icon plus text. Context markers are neutral. `WithdrawalTimeline` shows the first entries and expands with `Show all`; public reasons and internal notes are visually distinguished and labelled.

- [ ] **Step 4: Implement the large modal shell and action forms**

Use a portal or the existing app root overlay pattern. Desktop dimensions are `max-h-[88vh] w-[min(1120px,calc(100vw-48px))]`; mobile is inset-0/full screen. Add `role="dialog"`, `aria-modal`, title/description references, focus trap, Escape/backdrop close while idle, body-scroll restoration, and trigger focus return.

Render one primary action per lifecycle state. Reject uses required public reason plus optional internal note. Approved requests require transfer reference for mark paid. Preserve values after API errors. For `409`, show the explicit conflict message, refetch detail/list/summary, and keep the modal open on refreshed data.

- [ ] **Step 5: Integrate row selection and quick approval**

The page stores `selectedWithdrawalId`, fetches detail only while selected, and passes refresh callbacks. Quick approval reuses the same API body and on success refreshes list/summary without opening the large modal. If the backend returns a newly elevated risk or validation response, open the review modal instead of retrying automatically.

- [ ] **Step 6: Run modal and page tests**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/withdrawals/WithdrawalReviewModal.test.tsx src/pages/admin/AdminWithdrawalsPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit review UX**

```powershell
git add frontend/src/pages/admin/AdminWithdrawalsPage.tsx frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx frontend/src/pages/admin/withdrawals
git commit -m "feat: add withdrawal review modal and actions"
```

### Task 10: Add safe Excel export UX

**Files:**
- Create: `frontend/src/pages/admin/withdrawals/WithdrawalExportDialog.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.tsx`
- Modify: `frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx`

- [ ] **Step 1: Write failing export interaction tests**

```tsx
it("previews and confirms a sensitive two-sheet export", async () => {
  renderPage("/admin/withdrawals?status=APPROVED&from=2026-07-01");
  await user.click(await screen.findByRole("button", { name: /export excel/i }));
  expect(adminWalletApi.getExportPreview).toHaveBeenCalledWith(
    expect.objectContaining({ status: "APPROVED", from: "2026-07-01" }),
  );
  expect(await screen.findByText(/contains full bank account details/i)).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: /understand this export contains sensitive data/i }));
  await user.click(screen.getByRole("button", { name: /download workbook/i }));
  expect(adminWalletApi.downloadExport).toHaveBeenCalled();
});
```

Add a failure test proving the dialog stays open and Retry remains available.

- [ ] **Step 2: Run the page test and verify failure**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx`

Expected: FAIL because export UI is absent.

- [ ] **Step 3: Implement preview, acknowledgement, and download**

The dialog loads preview on open, displays operations/reconciliation counts and date coverage, and requires acknowledgement only when `containsSensitiveData` is true. During download, disable dismissal and actions. Create an object URL from the blob, click a temporary anchor with the validated filename, revoke the URL in `finally`, then close on success. On error, preserve preview and show Retry.

- [ ] **Step 4: Run export/page tests and type-check**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx; node node_modules/typescript/bin/tsc -b --force`

Expected: PASS.

- [ ] **Step 5: Commit export UX**

```powershell
git add frontend/src/pages/admin/AdminWithdrawalsPage.tsx frontend/src/pages/admin/AdminWithdrawalsPage.test.tsx frontend/src/pages/admin/withdrawals/WithdrawalExportDialog.tsx
git commit -m "feat: add withdrawal Excel export workflow"
```

### Task 11: Full verification, responsive review, and documentation sync

**Files:**
- Modify if evidence requires: files changed in Tasks 1–10 only
- Verify: `docs/superpowers/specs/2026-07-21-admin-withdrawal-operations-design.md`

- [ ] **Step 1: Run focused backend verification**

Run: `cd backend; .\mvnw.cmd -Dtest=AdminWithdrawalOperationsIntegrationTest,WithdrawalRiskAssessmentServiceTest,WithdrawalExportServiceTest test`

Expected: PASS with zero failures/errors.

- [ ] **Step 2: Run the broader wallet backend suite**

Run: `cd backend; .\mvnw.cmd -Dtest=*Wallet*,*Withdrawal* test`

Expected: PASS; existing wallet enforcement, holds, refunds, and cancellation behavior remain intact.

- [ ] **Step 3: Run frontend tests and production type/build checks**

Run: `cd frontend; node node_modules/vitest/vitest.mjs run src/pages/admin/AdminWithdrawalsPage.test.tsx src/pages/admin/withdrawals src/pages/wallet/WalletPage.test.tsx --maxWorkers=2 --minWorkers=1; node node_modules/typescript/bin/tsc -b --force; node node_modules/vite/bin/vite.js build`

Expected: tests PASS, TypeScript exits 0, and Vite reports a successful production build.

- [ ] **Step 4: Verify migration and workbook manually**

Run the backend with PostgreSQL/Flyway, verify `V30` applies, create sample requested/approved/paid rows, download a workbook, and open it in Excel or LibreOffice. Confirm sheet names, filters, frozen headers, numeric totals, date display, masked operations destinations, and full reconciliation destinations.

- [ ] **Step 5: Perform browser accessibility and responsive checks**

At 1440px, 1024px, and 390px widths, verify list/card layouts, modal sizing, keyboard-only open/action/close, focus return, dirty-form guard, and no background scroll. Verify risk/status meaning remains understandable without color and that click-backdrop dismissal works only while idle and clean.

- [ ] **Step 6: Review the final diff for privacy and scope**

Run: `git diff develop...HEAD --check; git diff develop...HEAD --stat; rg -n "accountNumber|bankInfo" frontend/src/pages/admin backend/src/main/java/com/example/horseracingtournamentsystem/wallet`

Expected: no whitespace errors; full account numbers appear only in review/reconciliation paths; no unrelated subsystem changes.

- [ ] **Step 7: Commit verification fixes, if any**

If verification required code changes, stage only those files and commit:

```powershell
git add -u -- backend frontend
git commit -m "fix: harden withdrawal operations verification"
```

If no files changed, do not create an empty commit.
