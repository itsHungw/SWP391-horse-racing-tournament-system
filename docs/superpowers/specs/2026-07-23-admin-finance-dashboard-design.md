# Admin Finance Dashboard Design

Date: 2026-07-23
Status: approved design, pending written-spec review

## 1. Objective

Add an admin finance workspace that serves two distinct needs:

1. show platform prediction revenue, cash movement, and financial exposure; and
2. preserve a searchable, read-only transaction trail for reconciliation and dispute handling.

The workspace is not a user-behavior monitoring product and is not a full accounting system. It must not describe wallet top-ups as revenue or withdrawals as expenses.

## 2. Existing Constraints

The current product already has:

- integer-VND wallets;
- append-only wallet transactions with business references and `balanceAfter`;
- VNPay top-up orders;
- withdrawal review and payment evidence;
- prediction wagers, payouts, refunds, settlement timestamps, and configurable house takeout;
- an admin dispute workflow that can reference wallet transactions.

The product does not have double-entry accounting, operating-expense entries, system accounts, automated bank reconciliation, or a general ledger. Consequently, the dashboard can report gross prediction revenue and wallet liabilities, but it must not label these figures as audited net profit.

## 3. Information Architecture

The admin Finance navigation contains:

- **Overview** at `/admin/finance`;
- **Transactions** at `/admin/finance/transactions`;
- **Top-up Reconciliation** at `/admin/finance/topups`;
- **Withdrawals** at the existing `/admin/withdrawals` route.

The main `/admin` overview remains cross-domain. It receives only a compact finance summary and a link to the Finance workspace so that the existing operational dashboard does not become overloaded.

## 4. Finance Overview

### 4.1 Date controls

The shared reporting range supports 7 days, 30 days, 90 days, and a custom range. The default is 30 days. Calendar boundaries use `Asia/Ho_Chi_Minh`; API values remain unambiguous ISO-8601 timestamps.

The preceding period of equal duration is used for comparison deltas.

### 4.2 Primary metrics

The first row contains four operational finance metrics:

- **Settled wagers:** stake belonging to predictions settled in the selected period.
- **Payouts:** `BET_PAYOUT` credits for those settled predictions.
- **Gross gaming revenue (GGR):** settled wagers minus payouts minus bet refunds.
- **GGR margin:** GGR divided by settled wagers, with a zero-safe calculation.

Pending or locked predictions do not contribute to GGR. Race predictions use `evaluatedAt` as the reporting date. Completed streak predictions use their `evaluatedAt`. Single-race and streak products are reported separately in the breakdown because their takeout and risk models differ.

The formula is:

```text
GGR = settled wager amount - BET_PAYOUT - BET_REFUND
```

This is gross prediction revenue, not net platform profit. If operating costs are introduced later, they require a separate expense ledger and a new net-profit metric.

### 4.3 Secondary financial position

A separate section prevents cash movement from being confused with revenue:

- successful VNPay top-ups;
- paid withdrawals;
- net external cash movement (`successful top-ups - paid withdrawals`);
- total user-wallet balance, labeled **wallet liability**.

Top-ups are money held for users and are never added to revenue. Withdrawals reduce held cash and are never subtracted as operating expenses.

### 4.4 Chart and breakdowns

One primary chart shows, per day or month depending on range:

- settled wagers;
- payouts and refunds;
- GGR.

The chart is backed by server-side time buckets. It does not download raw transactions for client-side aggregation.

Below the chart, a finance table groups settled performance by tournament and race. Columns include turnover, payout, refund, GGR, margin, settlement time, and settlement state. Streak predictions appear as a separate product row at tournament level rather than being attributed to a single race.

## 5. Transaction Ledger

The transaction ledger is an immutable reconciliation view, not an admin editing surface.

### 5.1 Search and filters

Admin can filter by:

- date range;
- user email or user ID;
- wallet transaction type;
- reference type and reference ID;
- VNPay transaction reference or transaction number;
- signed amount range.

Results are server-paginated and ordered newest first by default.

### 5.2 Transaction detail

Each detail view includes:

- transaction ID and timestamp;
- user identity;
- signed amount;
- calculated balance before and stored balance after;
- transaction type and description;
- reference type and reference ID;
- linked source record and its current status.

The balance before is calculated without another stored column:

```text
balanceBefore = balanceAfter - amount
```

The detail page presents the relevant trace:

- `TopUpOrder -> TOPUP -> wallet balance`;
- `BET_PLACED -> prediction result -> BET_PAYOUT or BET_REFUND`;
- `WITHDRAWAL_HOLD -> approval -> PAID or WITHDRAWAL_REFUND`.

Admin can copy reconciliation identifiers, export the filtered result as CSV/XLSX, and open or create a dispute with the transaction reference prefilled. No finance endpoint permits updating or deleting wallet transactions.

## 6. Top-up Reconciliation

The top-up page shows VNPay order state alongside its wallet credit. It detects and labels:

- successful VNPay order with no matching `TOPUP` transaction;
- `TOPUP` transaction with no matching order;
- mismatched order and ledger amounts;
- pending order older than 30 minutes;
- failed or expired orders.

The page is read-only. Remediation remains an explicit, separately designed operation; this feature does not introduce an automatic retry, replay, or balance adjustment action.

## 7. Backend Design

Create a read-only finance query boundary:

- `AdminFinanceController`;
- `AdminFinanceQueryService`;
- focused DTOs/projections for summaries, series, breakdown rows, ledger rows, and reconciliation rows.

It must not place reporting queries or reconciliation joins in `WalletService`, whose responsibility remains balance mutation and wallet invariants.

Proposed endpoints:

```text
GET /api/v1/admin/finance/summary
GET /api/v1/admin/finance/series
GET /api/v1/admin/finance/performance
GET /api/v1/admin/finance/transactions
GET /api/v1/admin/finance/transactions/{id}
GET /api/v1/admin/finance/topups
GET /api/v1/admin/finance/export
```

Summary, series, and performance endpoints accept `from` and `to`. List endpoints also accept their relevant filters and pagination.

All endpoints require `ROLE_ADMIN`. Date ranges are validated and bounded. Reporting queries use database aggregation and projections, not loaded entity graphs. Add only the indexes demonstrated necessary by query plans, expected to cover settlement date, transaction creation date, transaction type, user, top-up status, and VNPay references.

## 8. Frontend Design and Performance Requirements

Implementation must explicitly use these skills:

- `frontend-design` for a cohesive, production-grade finance workspace;
- `vercel-react-best-practices` for rendering, data-loading, and bundle performance;
- `frontend-accessibility-best-practices` for semantic controls, keyboard use, chart alternatives, contrast, and focus handling;
- `frontend-testing-best-practices` for user-visible behavior and integration-focused tests.

The UI follows the existing Aqueduct admin visual language rather than introducing a separate theme. Visual hierarchy is restrained: four primary KPI cards, one principal chart, a compact financial-position strip, and one performance table.

Performance requirements:

- lazy-load the Finance routes and chart implementation;
- reuse the installed `lightweight-charts` dependency instead of adding another chart library;
- request summary, series, and recent rows concurrently;
- keep filter state in the URL for shareable reconciliation links;
- debounce free-text search;
- use server pagination and aggregation;
- memoize only expensive derived presentation data;
- provide stable loading skeletons to avoid layout shift;
- allow each dashboard section to fail and retry independently.

Accessibility requirements:

- the chart has a text summary and accessible tabular fallback;
- positive and negative results are distinguished by signs and labels, not color alone;
- all filters have explicit labels;
- tables have correct headers and responsive card fallbacks where needed;
- focus returns predictably after closing transaction details;
- loading, empty, partial-error, and export states are announced appropriately.

## 9. Error Handling

- Invalid or excessive date ranges return a validation error rather than silently truncating data.
- A failed dashboard section does not erase other successful sections.
- Empty ranges show zero-valued metrics and an explanatory empty state.
- Missing source records remain visible in the ledger and are labeled as reconciliation exceptions.
- Export uses the exact active filters and reports generation/download failures without resetting the page.
- Monetary calculations use integer VND and exact database sums; no floating-point arithmetic is allowed in backend money paths.

## 10. Testing Strategy

Backend coverage includes:

- GGR calculations for wins, losses, refunds, and mixed periods;
- exclusion of pending and locked predictions;
- separation of single-race and streak performance;
- settlement-date and Vietnam-timezone boundaries;
- zero-denominator margin behavior;
- wallet liability and external cash movement calculations;
- all top-up reconciliation mismatch cases;
- ledger filters, pagination, ordering, and detail traces;
- admin authorization and the absence of mutation endpoints;
- query-count or query-plan checks for representative reporting volumes.

Frontend coverage includes:

- KPI and signed-currency presentation;
- range and filter URL synchronization;
- chart text/table fallback;
- partial loading and partial failure;
- empty results;
- keyboard-accessible transaction detail;
- export using active filters;
- reconciliation labels and linked dispute flow.

The frontend production build and relevant backend test suite must pass before completion is claimed.

## 11. Out of Scope

- user-behavior scoring or surveillance;
- transaction editing or deletion;
- automatic financial remediation;
- double-entry accounting;
- operating-expense entry and audited net profit;
- automated bank-statement reconciliation;
- tax, legal, or regulatory reporting.

These items require separate business rules and designs.
