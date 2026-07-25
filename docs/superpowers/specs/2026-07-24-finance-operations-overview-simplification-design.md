# Finance Operations Overview Simplification Design

Date: 2026-07-24  
Status: approved design, pending written-spec review  
Supersedes: the overview, chart, performance-breakdown, and main-dashboard finance-pulse portions of `2026-07-23-admin-finance-dashboard-design.md`

## 1. Objective

Refocus Admin Finance on two operational questions:

1. What is the platform's current finance and cash position?
2. Can an admin quickly reconstruct a transaction when a user reports that money was paid, deducted, or credited incorrectly?

The workspace remains read-only. It is not a user-behavior monitoring tool, a prediction operations dashboard, a general ledger, or an automated balance-repair surface.

## 2. Product Boundaries

Admin Finance owns:

- aggregate finance and cash-health metrics;
- immutable wallet transaction history;
- VNPay top-up reconciliation;
- links into the existing withdrawal workspace;
- evidence needed to investigate and handle complaints.

Prediction Admin owns:

- tournaments and races;
- ticket counts and prediction participation;
- prediction results;
- settlement and refund operations;
- race- and tournament-level prediction performance.

Finance must therefore not repeat race, tournament, ticket, settlement-status, or prediction-product breakdowns.

## 3. Information Architecture

The Finance navigation remains:

- **Overview** at `/admin/finance`;
- **Transaction History** at `/admin/finance/transactions`;
- **Top-up Reconciliation** at `/admin/finance/topups`;
- **Withdrawals** at the existing `/admin/withdrawals` route.

The finance pulse is removed from the main `/admin` dashboard. Admins intentionally enter Finance when they need finance health or reconciliation details, avoiding a second summary of the same data.

## 4. Finance Overview

### 4.1 Date range

The overview supports fixed 7-day, 30-day, and 90-day ranges, defaulting to 30 days. The custom date-range control is removed from this page to keep incident checks fast and predictable.

Calendar boundaries use `Asia/Ho_Chi_Minh`; API timestamps remain ISO-8601 instants. Detailed ledger and reconciliation pages may retain their existing date filters for precise investigations.

### 4.2 Primary finance metrics

The overview displays five figures:

- **Gross gaming revenue (GGR):** settled wagers minus payouts minus bet refunds;
- **Successful top-ups:** successful VNPay money-in during the selected period;
- **Paid withdrawals:** completed external money-out during the selected period;
- **Net cash movement:** successful top-ups minus paid withdrawals;
- **Wallet liability:** the current total user-wallet balance.

GGR is labeled as gross prediction revenue, not net profit. Top-ups are funds held for users and are not revenue. Paid withdrawals are cash movement and are not operating expenses. All money remains integer VND.

GGR uses prediction settlement time, successful top-ups use `paidAt`, and paid withdrawals use their completed payment time. Wallet liability is a current point-in-time balance and therefore does not change when the reporting range changes.

The overview does not show a chart, previous-period comparison, GGR margin, settled-wager/payout cards, or race/tournament performance table.

### 4.3 Reconciliation alerts

A prominent alert section reports exception counts for the selected period:

- successful top-up with no matching wallet credit;
- top-up and wallet-credit amount mismatch;
- unexpected wallet credit for a non-successful order;
- wallet top-up credit with no matching order;
- pending top-up older than 30 minutes.

Healthy states remain quiet: matched orders and ordinary pending orders do not create alerts. If every count is zero, the section shows one concise all-clear state.

Each non-zero alert is an accessible link to `/admin/finance/topups` with a reconciliation-issue filter in the URL. Unexpected and orphan credits may use separate result sections on that page, but the URL must preserve the selected issue and reporting range so the linked evidence is immediately visible.

### 4.4 Recent transactions

Below the alerts, the overview displays the eight newest wallet transactions in the selected period. Each row includes timestamp, user, signed amount, transaction type, and balance after. Selecting a row opens the existing transaction detail experience, including:

- balance before and after;
- reference type and ID;
- source status and source trace;
- copyable reconciliation identifiers;
- the existing dispute handoff when available.

The section links to the full Transaction History page. It is an investigation shortcut, not a second ledger implementation.

## 5. Detailed Investigation Workspaces

### 5.1 Transaction History

The existing read-only, server-paginated ledger remains the canonical cross-domain transaction trail. Existing search, filters, detail trace, export safeguards, and dispute linkage remain in scope.

No finance endpoint may update or delete a wallet transaction.

### 5.2 Top-up Reconciliation

The existing reconciliation table remains the canonical place to compare VNPay orders and wallet credits. Add a URL-backed reconciliation-issue filter so overview alerts open a pre-filtered result rather than an unfiltered page.

Supported issue values are:

- `MISSING_WALLET_CREDIT`;
- `AMOUNT_MISMATCH`;
- `UNEXPECTED_WALLET_CREDIT`;
- `ORPHAN_WALLET_CREDIT`;
- `STALE_PENDING`.

The page remains read-only. The design does not add retry, replay, manual credit, refund, or balance-adjustment actions.

## 6. Backend and Data Flow

The overview requests three independent sources concurrently:

```text
GET /api/v1/admin/finance/summary?from=...&to=...
GET /api/v1/admin/finance/reconciliation-summary?from=...&to=...
GET /api/v1/admin/finance/transactions?from=...&to=...&page=0&size=8
```

`reconciliation-summary` returns the five exception counts listed in section 4.3. Counts are calculated with database aggregate queries; the service must not load all top-up orders or wallet transactions and count them in Java.

Order-backed exception counts use the top-up order creation time for range filtering, matching the reconciliation table. The orphan-credit count uses the wallet transaction creation time because no order exists. `STALE_PENDING` is evaluated against the current server time with a fixed 30-minute threshold.

The top-up list endpoint gains an optional `reconciliationStatus` parameter. The existing orphan-credit query accepts the same date range and is used when `ORPHAN_WALLET_CREDIT` is selected. Frontend URL parameters map directly to these backend filters.

The overview sections fail independently. A failed alert summary does not hide valid metrics or recent transactions; each failed section exposes a local retry. Empty data produces zero metrics or an explicit empty state, never fabricated chart data.

All endpoints require `ROLE_ADMIN`. Date ranges remain validated and bounded. Query indexes introduced for the existing finance feature remain in place.

## 7. Removed API and Code Surface

Because no retained screen consumes prediction trend or performance data, remove:

```text
GET /api/v1/admin/finance/series
GET /api/v1/admin/finance/performance
```

Also remove their finance-only DTOs, service methods, repository queries, frontend API functions and types, chart components, performance-table component, and obsolete tests. Do not remove a shared chart dependency if another product area still imports it.

The summary endpoint may keep its current response fields for compatibility, but the Finance Overview consumes only the five metrics in section 4.2. This avoids unnecessary persistence or calculation changes while removing duplicate UI.

## 8. Frontend UX, Accessibility, and Performance

The UI follows the existing admin visual language and is implemented directly in the application without a separate image mockup.

Layout priority is:

1. five compact finance-health metrics;
2. actionable reconciliation alerts;
3. recent transactions;
4. clear links to full investigation workspaces.

Requirements:

- load summary, alert counts, and recent transactions concurrently;
- keep fixed range and alert filter state in the URL;
- use server aggregation and pagination;
- preserve stable skeleton dimensions to avoid layout shift;
- provide section-level loading, empty, error, and retry states;
- distinguish positive and negative values with signs and text, not color alone;
- give filters explicit labels and alert links meaningful accessible names;
- use semantic table headers and keyboard-accessible transaction detail;
- return focus predictably after closing transaction detail;
- avoid unnecessary memoization and avoid adding new UI dependencies.

Implementation applies `frontend-design`, `vercel-react-best-practices`, `frontend-accessibility-best-practices`, and `frontend-testing-best-practices` as requested.

## 9. Testing Strategy

Backend tests cover:

- each reconciliation exception count;
- exclusion of healthy/matched orders from alert counts;
- date boundaries and stale-pending cutoff;
- database-level aggregation behavior;
- reconciliation-status filtering, including orphan credits;
- overview summary values and admin authorization;
- ledger ordering and the eight-row overview request contract;
- absence of finance mutation endpoints.

Frontend tests cover:

- the five retained metrics and correct financial labels;
- absence of chart and prediction performance content;
- fixed 7/30/90-day range behavior;
- alert counts, all-clear state, and filtered reconciliation links;
- recent transaction rendering and detail opening;
- independent loading, empty, failure, and retry states;
- removal of the main-dashboard finance pulse;
- URL-backed reconciliation filtering.

Verification is intentionally bounded: run focused backend finance tests, focused frontend finance/admin-overview tests, then one backend package build and one frontend production build. Failures are diagnosed once from the first useful error rather than repeatedly rerunning unchanged commands.

## 10. Out of Scope

- user behavior monitoring or risk scoring;
- charts and synthetic trend visualization;
- race, tournament, ticket, or settlement performance analytics;
- automated financial remediation;
- transaction editing or deletion;
- double-entry accounting and operating-expense entry;
- audited net-profit reporting;
- automated bank-statement reconciliation;
- tax, legal, or regulatory reporting.
