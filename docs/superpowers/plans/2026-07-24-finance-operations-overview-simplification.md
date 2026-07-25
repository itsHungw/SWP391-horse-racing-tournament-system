# Finance Operations Overview Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the chart-heavy Admin Finance dashboard with a compact operations overview containing five finance metrics, reconciliation alerts, and recent immutable transactions.

**Architecture:** Keep `AdminFinanceQueryService` responsible for aggregate finance metrics and extend `AdminFinanceLedgerService` with database-backed reconciliation counts and issue filters. The React overview loads summary, reconciliation summary, and eight recent transactions independently and concurrently; detailed ledger and top-up pages remain canonical investigation workspaces.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, PostgreSQL, React 19, TypeScript 5.8, React Router 7, Tailwind CSS 4, Vitest, Testing Library.

---

## File Structure

**Backend create:**

- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinanceReconciliationSummary.java` — typed five-count response.
- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/FinanceReconciliationStatus.java` — accepted issue filter values, including orphan credits.

**Backend modify:**

- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/controller/AdminFinanceController.java` — expose reconciliation summary/filter and remove series/performance endpoints.
- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/service/AdminFinanceLedgerService.java` — assemble counts and filter reconciliation rows.
- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/service/AdminFinanceQueryService.java` — retain summary only; remove trend/performance construction.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/TopUpOrderRepository.java` — aggregate four order-backed issue counts.
- `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WalletTransactionRepository.java` — count orphan top-up credits.
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/RacePredictionRepository.java` — remove finance-only entity loading query.
- `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/StreakPredictionRepository.java` — remove finance-only entity loading query.
- `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceLedgerServiceTest.java` — summary/filter coverage.
- `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceQueryServiceTest.java` — remove deleted chart/performance tests; retain summary tests.

**Backend delete:**

- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinanceSeriesPoint.java`
- `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinancePerformanceRow.java`

**Frontend create:**

- `frontend/src/pages/admin/finance/FinanceReconciliationAlerts.tsx` — actionable issue counts and all-clear state.
- `frontend/src/pages/admin/finance/FinanceRecentTransactions.tsx` — compact eight-row investigation shortcut.

**Frontend modify:**

- `frontend/src/types/adminFinance.ts` — add reconciliation types and remove chart/performance types.
- `frontend/src/api/adminFinanceApi.ts` — add summary call/filter and remove unused calls.
- `frontend/src/api/adminFinanceApi.test.ts` — assert compact params and issue filter forwarding.
- `frontend/src/pages/admin/finance/AdminFinanceOverviewPage.tsx` — fixed ranges, five metrics, alerts, recent rows, local retry/detail.
- `frontend/src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx` — user-visible operations overview behavior.
- `frontend/src/pages/admin/finance/AdminFinanceTopUpsPage.tsx` — URL-backed issue filtering and orphan-only state.
- `frontend/src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx` — issue URL/filter behavior.
- `frontend/src/pages/admin/AdminOverviewPage.tsx` — remove finance pulse request and markup.
- `frontend/src/pages/admin/AdminOverviewPage.test.tsx` — assert finance pulse is absent.

**Frontend delete:**

- `frontend/src/pages/admin/finance/FinanceTrendChart.tsx`
- `frontend/src/pages/admin/finance/FinanceTrendChartCanvas.tsx`
- `frontend/src/pages/admin/finance/FinancePerformanceTable.tsx`

---

### Task 1: Add database-backed reconciliation alert counts

**Files:**

- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinanceReconciliationSummary.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/TopUpOrderRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WalletTransactionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/service/AdminFinanceLedgerService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/controller/AdminFinanceController.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceLedgerServiceTest.java`

- [ ] **Step 1: Write a failing service test for the five counts**

Mock four `TopUpOrderRepository` count queries and one orphan-credit count query, call `service.reconciliationSummary(from, to)`, and assert:

```java
assertThat(summary.missingWalletCredits()).isEqualTo(2);
assertThat(summary.amountMismatches()).isEqualTo(3);
assertThat(summary.unexpectedWalletCredits()).isEqualTo(1);
assertThat(summary.orphanWalletCredits()).isEqualTo(4);
assertThat(summary.stalePendingOrders()).isEqualTo(5);
```

- [ ] **Step 2: Run the focused test and verify the missing API failure**

Run: `mvn -Dtest=AdminFinanceLedgerServiceTest test` from `backend`  
Expected: FAIL because `reconciliationSummary` and its response type do not exist.

- [ ] **Step 3: Add the response record and aggregate repository queries**

Create:

```java
public record AdminFinanceReconciliationSummary(
        long missingWalletCredits,
        long amountMismatches,
        long unexpectedWalletCredits,
        long orphanWalletCredits,
        long stalePendingOrders
) {}
```

Add repository queries that count, within `[from, to)`, successful orders without a TOPUP credit, orders whose TOPUP amount differs, non-success orders with a TOPUP credit, and pending/initiated orders older than `staleBefore`. Add `countOrphanTopUpCredits(from, to)` mirroring the existing orphan-page predicate.

- [ ] **Step 4: Implement service assembly and controller endpoint**

Implement:

```java
public AdminFinanceReconciliationSummary reconciliationSummary(LocalDate from, LocalDate to) {
    validateRange(from, to);
    LocalDateTime start = from.atStartOfDay();
    LocalDateTime end = to.plusDays(1).atStartOfDay();
    LocalDateTime staleBefore = LocalDateTime.now().minusMinutes(30);
    return new AdminFinanceReconciliationSummary(
            topUps.countMissingWalletCredits(start, end),
            topUps.countAmountMismatches(start, end),
            topUps.countUnexpectedWalletCredits(start, end),
            transactions.countOrphanTopUpCredits(start, end),
            topUps.countStalePending(start, end, staleBefore));
}
```

Expose `GET /api/v1/admin/finance/reconciliation-summary` through the controller's existing default-range resolution.

- [ ] **Step 5: Run the focused test**

Run: `mvn -Dtest=AdminFinanceLedgerServiceTest test` from `backend`  
Expected: PASS.

### Task 2: Add reconciliation issue filters and remove duplicate reporting APIs

**Files:**

- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/FinanceReconciliationStatus.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/controller/AdminFinanceController.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/service/AdminFinanceLedgerService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/service/AdminFinanceQueryService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/RacePredictionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/StreakPredictionRepository.java`
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinanceSeriesPoint.java`
- Delete: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinancePerformanceRow.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceLedgerServiceTest.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceQueryServiceTest.java`

- [ ] **Step 1: Write failing filter tests**

Add tests proving `MISSING_WALLET_CREDIT` returns only that computed status and `ORPHAN_WALLET_CREDIT` routes to the orphan transaction page. Verify the order-backed path keeps server pagination.

- [ ] **Step 2: Run both finance service test classes**

Run: `mvn -Dtest=AdminFinanceLedgerServiceTest,AdminFinanceQueryServiceTest test` from `backend`  
Expected: FAIL because the reconciliation enum/filter argument does not exist.

- [ ] **Step 3: Add the enum and filter contract**

Create:

```java
public enum FinanceReconciliationStatus {
    MISSING_WALLET_CREDIT,
    AMOUNT_MISMATCH,
    UNEXPECTED_WALLET_CREDIT,
    ORPHAN_WALLET_CREDIT,
    STALE_PENDING
}
```

Add optional `reconciliationStatus` to `/topups`. For order-backed statuses, add the matching `exists`/`not exists` predicates to `topUpSpec`; orphan credits continue through `/topups/orphan-credits` and share the same URL value on the frontend.

- [ ] **Step 4: Remove series/performance code**

Delete the two controller mappings, service methods/helper accumulators, response records, tests, and `findFinanceSettledBetween` repository methods/imports. Keep aggregate summary projections because GGR remains required.

- [ ] **Step 5: Run focused backend finance tests**

Run: `mvn -Dtest=AdminFinanceLedgerServiceTest,AdminFinanceQueryServiceTest,AdminFinanceControllerTest test` from `backend`  
Expected: PASS with no `/series` or `/performance` compile references.

### Task 3: Update frontend contracts and API client

**Files:**

- Modify: `frontend/src/types/adminFinance.ts`
- Modify: `frontend/src/api/adminFinanceApi.ts`
- Test: `frontend/src/api/adminFinanceApi.test.ts`

- [ ] **Step 1: Write failing API tests**

Assert that:

```ts
await adminFinanceApi.getReconciliationSummary({ from: "2026-07-01", to: "2026-07-31" });
expect(httpClient.get).toHaveBeenCalledWith("/admin/finance/reconciliation-summary", {
  params: { from: "2026-07-01", to: "2026-07-31" },
});
```

Also assert `listTopUps` forwards `reconciliationStatus` and drops empty values.

- [ ] **Step 2: Run the API test and verify failure**

Run: `npm test -- --run src/api/adminFinanceApi.test.ts` from `frontend`  
Expected: FAIL because the summary method/type is absent.

- [ ] **Step 3: Add types and API method**

Add `FinanceReconciliationIssue`, `AdminFinanceReconciliationSummary`, and the optional `reconciliationStatus` filter. Remove `AdminFinanceSeriesPoint`, `AdminFinancePerformanceRow`, `getSeries`, and `getPerformance`.

- [ ] **Step 4: Re-run the API test**

Run: `npm test -- --run src/api/adminFinanceApi.test.ts` from `frontend`  
Expected: PASS.

### Task 4: Build the operations-focused Finance Overview

**Files:**

- Create: `frontend/src/pages/admin/finance/FinanceReconciliationAlerts.tsx`
- Create: `frontend/src/pages/admin/finance/FinanceRecentTransactions.tsx`
- Modify: `frontend/src/pages/admin/finance/AdminFinanceOverviewPage.tsx`
- Modify: `frontend/src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx`
- Delete: `frontend/src/pages/admin/finance/FinanceTrendChart.tsx`
- Delete: `frontend/src/pages/admin/finance/FinanceTrendChartCanvas.tsx`
- Delete: `frontend/src/pages/admin/finance/FinancePerformanceTable.tsx`

- [ ] **Step 1: Replace chart expectations with failing operations expectations**

Mock `getSummary`, `getReconciliationSummary`, `listTransactions`, and `getTransaction`. Assert five metric labels, an alert link containing `reconciliationStatus=MISSING_WALLET_CREDIT`, eight-row request size, recent row detail opening, no chart/table, and independent failure visibility.

- [ ] **Step 2: Run the overview test and verify failure**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx` from `frontend`  
Expected: FAIL because alert/recent components and calls do not exist.

- [ ] **Step 3: Implement focused child components**

`FinanceReconciliationAlerts` receives summary, range, and retry callback. It renders only non-zero issues as links and renders “No reconciliation exceptions in this period” when all are zero.

`FinanceRecentTransactions` receives rows and `onSelect`. Use a semantic table with a row button named `View transaction {id}`, signed amount text, and a link to `/admin/finance/transactions` preserving `from` and `to`.

- [ ] **Step 4: Refactor the overview orchestration**

Remove custom-range form and load the three sections with separate request state. Request:

```ts
adminFinanceApi.getSummary(range);
adminFinanceApi.getReconciliationSummary(range);
adminFinanceApi.listTransactions({ ...range, page: 0, size: 8 });
```

Render GGR, successful top-ups, paid withdrawals, net cash movement, and wallet liability. Use `TransactionDetailPanel` for selected rows and refetch detail before opening so source trace is available. Give each failed section its own retry button.

- [ ] **Step 5: Delete chart/performance components and run the overview test**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx` from `frontend`  
Expected: PASS and no imports of removed components.

### Task 5: Connect alert links and remove the main-dashboard duplicate

**Files:**

- Modify: `frontend/src/pages/admin/finance/AdminFinanceTopUpsPage.tsx`
- Modify: `frontend/src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx`
- Modify: `frontend/src/pages/admin/AdminOverviewPage.tsx`
- Modify: `frontend/src/pages/admin/AdminOverviewPage.test.tsx`

- [ ] **Step 1: Write failing navigation and duplicate-removal tests**

Render top-ups at `?reconciliationStatus=MISSING_WALLET_CREDIT` and assert `listTopUps` receives that value. Render `?reconciliationStatus=ORPHAN_WALLET_CREDIT` and assert only the orphan endpoint supplies results. Change the Admin Overview test to assert “Finance pulse” is absent and `getSummary` is never requested.

- [ ] **Step 2: Run both test files and verify failure**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx src/pages/admin/AdminOverviewPage.test.tsx` from `frontend`  
Expected: FAIL against the old unfiltered page and finance pulse.

- [ ] **Step 3: Implement URL-backed issue filtering**

Parse `reconciliationStatus` into `FinanceTopUpFilters`, retain it when applying other filters, and pass it to `listTopUps`. For `ORPHAN_WALLET_CREDIT`, display the orphan result as the primary table/section and do not present an unrelated empty order table.

- [ ] **Step 4: Remove the Admin Overview finance request and section**

Delete finance imports, state/effect, formatter, finance-only icons, and finance-pulse markup. Keep the main admin operational dashboard unchanged otherwise.

- [ ] **Step 5: Re-run both test files**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx src/pages/admin/AdminOverviewPage.test.tsx` from `frontend`  
Expected: PASS.

### Task 6: Bounded verification and cleanup

**Files:**

- Modify only files implicated by concrete verification failures.

- [ ] **Step 1: Scan for deleted API/component references**

Run: `rg -n "getSeries|getPerformance|FinanceTrendChart|FinancePerformanceTable|AdminFinanceSeriesPoint|AdminFinancePerformanceRow|Finance pulse" backend/src frontend/src`  
Expected: no obsolete production references; negative assertions in tests are acceptable.

- [ ] **Step 2: Run the focused backend suite once**

Run: `mvn -Dtest=AdminFinanceQueryServiceTest,AdminFinanceLedgerServiceTest,AdminFinanceControllerTest,FinanceReportingMigrationTest test` from `backend`  
Expected: PASS.

- [ ] **Step 3: Run the focused frontend suite once**

Run: `npm test -- --run src/api/adminFinanceApi.test.ts src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx src/pages/admin/AdminOverviewPage.test.tsx` from `frontend`  
Expected: PASS.

- [ ] **Step 4: Run one backend package build and one frontend production build**

Run: `mvn -DskipTests package` from `backend`  
Expected: BUILD SUCCESS.

Run: `npm run build` from `frontend`  
Expected: TypeScript and Vite build successfully.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check` and `git status --short` from the repository root.  
Expected: no whitespace errors; only the intended finance feature and documentation changes remain.
