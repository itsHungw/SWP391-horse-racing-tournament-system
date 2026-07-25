# Admin Finance Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a performant admin finance workspace for prediction revenue, wallet liability, transaction reconciliation, and VNPay top-up reconciliation.

**Architecture:** Add a read-only Spring finance query boundary over existing prediction, wallet, top-up, and withdrawal data. Expose compact DTOs and paginated lists, then add lazy React routes that reuse the installed chart library and existing admin visual language.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, React 19, TypeScript, Vite, Tailwind CSS 4, lightweight-charts, Vitest, Testing Library.

---

### Task 1: Backend finance contracts and aggregation

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinanceResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/service/AdminFinanceQueryService.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/RacePredictionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/prediction/repository/StreakPredictionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WalletRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/TopUpOrderRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WithdrawalRequestRepository.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceQueryServiceTest.java`

- [ ] **Step 1: Write aggregation tests**

Cover settled race and streak wagers, payouts, refunds, zero-safe GGR margin, successful top-ups, paid withdrawals, and wallet liability. Use repository mocks so each test has one financial rule.

- [ ] **Step 2: Run the focused test and verify the missing service failure**

Run: `mvn -Dtest=AdminFinanceQueryServiceTest test`

Expected: test compilation fails because the finance contracts do not exist.

- [ ] **Step 3: Add repository range queries and response records**

Repository methods return only predictions evaluated inside the range and terminal statuses. Add exact sums for wallet balances, successful top-ups, and paid withdrawals. Define response records for metrics, comparison deltas, time-series points, and product/tournament performance.

- [ ] **Step 4: Implement exact integer-VND aggregation**

Implement these invariants:

```java
long ggr = Math.subtractExact(Math.subtractExact(settledWagers, payouts), refunds);
BigDecimal margin = settledWagers == 0
        ? BigDecimal.ZERO
        : BigDecimal.valueOf(ggr).divide(BigDecimal.valueOf(settledWagers), 4, RoundingMode.HALF_UP);
long netCashMovement = Math.subtractExact(successfulTopUps, paidWithdrawals);
```

Use `evaluatedAt` for prediction reporting and `Asia/Ho_Chi_Minh` for date buckets.

- [ ] **Step 5: Run the focused backend test**

Run: `mvn -Dtest=AdminFinanceQueryServiceTest test`

Expected: PASS.

### Task 2: Ledger and top-up reconciliation APIs

**Files:**
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/controller/AdminFinanceController.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminFinanceTransactionResponse.java`
- Create: `backend/src/main/java/com/example/horseracingtournamentsystem/finance/dto/AdminTopUpReconciliationResponse.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/WalletTransactionRepository.java`
- Modify: `backend/src/main/java/com/example/horseracingtournamentsystem/wallet/repository/TopUpOrderRepository.java`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/finance/AdminFinanceControllerIntegrationTest.java`

- [ ] **Step 1: Add failing authorization, pagination, and reconciliation tests**

Verify admin access, non-admin rejection, newest-first pagination, email/type/reference filters, `balanceBefore = balanceAfter - amount`, and all four top-up mismatch states.

- [ ] **Step 2: Run the controller test and verify 404/missing contract failures**

Run: `mvn -Dtest=AdminFinanceControllerIntegrationTest test`

Expected: FAIL because `/api/v1/admin/finance/**` endpoints do not exist.

- [ ] **Step 3: Add specification-enabled repositories**

Extend transaction and top-up repositories with `JpaSpecificationExecutor`. Build specifications only from nonblank filters and always apply bounded date predicates.

- [ ] **Step 4: Implement read-only endpoints**

Expose:

```text
GET /api/v1/admin/finance/summary
GET /api/v1/admin/finance/series
GET /api/v1/admin/finance/performance
GET /api/v1/admin/finance/transactions
GET /api/v1/admin/finance/transactions/{id}
GET /api/v1/admin/finance/topups
GET /api/v1/admin/finance/transactions/export
```

Validate `from <= to`, cap ranges at 366 days, and annotate the controller with `@PreAuthorize("hasRole('ADMIN')")`.

- [ ] **Step 5: Run the focused controller test**

Run: `mvn -Dtest=AdminFinanceControllerIntegrationTest test`

Expected: PASS.

### Task 3: Database indexes

**Files:**
- Create: `backend/src/main/resources/db/migration/V35__finance_reporting_indexes.sql`
- Test: `backend/src/test/java/com/example/horseracingtournamentsystem/config/FinanceReportingMigrationTest.java`

- [ ] **Step 1: Add a migration contract test**

Assert the migration contains indexes for prediction evaluation timestamps, wallet transaction creation/type/user, top-up creation/status, and withdrawal paid timestamps.

- [ ] **Step 2: Add narrow reporting indexes**

Use `CREATE INDEX IF NOT EXISTS` and avoid duplicate indexes already declared by constraints.

- [ ] **Step 3: Run the migration test**

Run: `mvn -Dtest=FinanceReportingMigrationTest test`

Expected: PASS.

### Task 4: Frontend contracts, routes, and navigation

**Files:**
- Create: `frontend/src/types/adminFinance.ts`
- Create: `frontend/src/api/adminFinanceApi.ts`
- Modify: `frontend/src/layouts/AdminLayout.tsx`
- Modify: `frontend/src/routes/AppRouter.tsx`
- Test: `frontend/src/api/adminFinanceApi.test.ts`

- [ ] **Step 1: Write API contract tests**

Assert date parameters, pagination, filters, and detail IDs are sent to the expected `/admin/finance` URLs.

- [ ] **Step 2: Run the focused API test**

Run: `npm test -- --run src/api/adminFinanceApi.test.ts`

Expected: FAIL because the API module does not exist.

- [ ] **Step 3: Implement typed API functions**

Use one `adminFinanceApi` object with `getSummary`, `getSeries`, `getPerformance`, `listTransactions`, `getTransaction`, `listTopUps`, and `exportTransactions` methods. Omit empty query values and preserve the active filters for export.

- [ ] **Step 4: Add lazy routes and grouped Finance navigation**

Add Overview, Transactions, Top-up Reconciliation, and the existing Withdrawals route. Keep each new page lazy-loaded.

- [ ] **Step 5: Run the API test**

Run: `npm test -- --run src/api/adminFinanceApi.test.ts`

Expected: PASS.

### Task 5: Finance overview UI

**Files:**
- Create: `frontend/src/pages/admin/finance/AdminFinanceOverviewPage.tsx`
- Create: `frontend/src/pages/admin/finance/FinanceMetricCard.tsx`
- Create: `frontend/src/pages/admin/finance/FinanceTrendChart.tsx`
- Create: `frontend/src/pages/admin/finance/FinancePerformanceTable.tsx`
- Modify: `frontend/src/pages/admin/AdminOverviewPage.tsx`
- Test: `frontend/src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx`

- [ ] **Step 1: Write behavior tests**

Cover four primary KPIs, the cash/liability strip, period controls, signed GGR, accessible chart summary, empty data, and one-section retry without hiding successful sections.

- [ ] **Step 2: Run the focused page test**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx`

Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the page using the required frontend skills**

Apply `frontend-design`, `vercel-react-best-practices`, and `frontend-accessibility-best-practices`. Keep four KPI cards, one chart, a compact cash-position strip, and one performance table. Load summary, series, and performance concurrently with isolated error states.

Add a compact finance pulse to the cross-domain admin overview with GGR, wallet liability, and a link to `/admin/finance`; do not duplicate the full finance dashboard.

- [ ] **Step 4: Implement a lazy chart with a text fallback**

Reuse `lightweight-charts`; do not add dependencies. Provide a semantic summary/table so canvas is never the only representation.

- [ ] **Step 5: Run the focused page test**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx`

Expected: PASS.

### Task 6: Reconciliation pages

**Files:**
- Create: `frontend/src/pages/admin/finance/AdminFinanceTransactionsPage.tsx`
- Create: `frontend/src/pages/admin/finance/AdminFinanceTopUpsPage.tsx`
- Create: `frontend/src/pages/admin/finance/FinanceFilters.tsx`
- Create: `frontend/src/pages/admin/finance/TransactionDetailPanel.tsx`
- Test: `frontend/src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx`

- [ ] **Step 1: Write user-visible reconciliation tests**

Cover URL-backed filters, signed amounts, balance before/after, source trace, top-up mismatch labels, pagination, filtered export, loading, empty, and error states.

- [ ] **Step 2: Run the focused reconciliation test**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx`

Expected: FAIL because the pages do not exist.

- [ ] **Step 3: Implement responsive, accessible tables**

Use semantic tables on desktop, overflow-safe layouts, labeled controls, clear positive/negative signs, and a keyboard-safe transaction detail dialog/panel. Debounce text filters, keep active filters in `URLSearchParams`, and download CSV using the same active filter object.

- [ ] **Step 4: Run the focused reconciliation test**

Run: `npm test -- --run src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx`

Expected: PASS.

### Task 7: Final verification

**Files:**
- Modify only files proven necessary by failing commands.

- [ ] **Step 1: Run backend finance tests together**

Run: `mvn -Dtest=AdminFinanceQueryServiceTest,AdminFinanceControllerIntegrationTest,FinanceReportingMigrationTest test`

Expected: PASS.

- [ ] **Step 2: Run frontend finance tests together**

Run: `npm test -- --run src/api/adminFinanceApi.test.ts src/pages/admin/finance/AdminFinanceOverviewPage.test.tsx src/pages/admin/finance/AdminFinanceReconciliationPages.test.tsx`

Expected: PASS.

- [ ] **Step 3: Run production compilation once**

Run backend: `mvn -DskipTests package`
Run frontend: `npm run build`

Expected: both commands exit 0. Fix only reproducible failures caused by this feature, rerunning the smallest affected command before one final build.
