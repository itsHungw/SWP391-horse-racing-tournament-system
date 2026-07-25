# Admin Withdrawal Operations Workspace Design

## Purpose

Replace the current admin withdrawal table with an operations workspace that helps an administrator answer four questions quickly and safely:

1. What needs attention?
2. Why might it be risky?
3. What action is available now?
4. What changed after an action?

The workspace must support both day-to-day withdrawal review and Excel-based bank reconciliation without turning the product into a general accounting platform.

## Current state

`AdminWithdrawalsPage.tsx` currently loads the full withdrawal list, filters only by status, renders raw bank information, and performs actions directly from each row. Reject uses `window.prompt`. There is no search, pagination, KPI summary, risk context, detailed review surface, action history, concurrency feedback, or export.

The backend already enforces the withdrawal lifecycle `REQUESTED -> APPROVED -> PAID` with `REQUESTED/APPROVED -> REJECTED`, holds funds at creation, and refunds rejected or user-cancelled requests. It also has separate user-status and wallet-status histories that can be reused as review evidence.

## Goals

- Make normal requests fast to process while forcing richer review for flagged requests.
- Convert raw user, wallet, destination, and withdrawal history into transparent risk explanations.
- Preserve every administrative state transition and actor in an immutable action history.
- Add server-side search, filtering, sorting, and pagination.
- Export one `.xlsx` workbook with operations and bank-reconciliation sheets.
- Keep sensitive destination data masked except where full details are operationally required.
- Keep the admin interface in English and visually consistent with the existing admin workspace.

## Non-goals

- Automatic rejection, automatic approval, or an opaque machine-learning risk score.
- Automatic bank payout or bank API integration.
- Batch approval, batch rejection, or batch mark-paid actions.
- Double-entry accounting or a general finance reporting system.
- Uploading transfer receipts in the first version.
- A global internationalization migration.

## Information architecture

### Workspace header

The page header contains the title, a concise operational description, a last-refreshed timestamp, and the `Export Excel` action.

### Summary cards

Four compact cards show authoritative server aggregates:

- `Needs review`: count of `REQUESTED` withdrawals.
- `Ready to pay`: count of `APPROVED` withdrawals.
- `Pending value`: sum of `REQUESTED` and `APPROVED` amounts.
- `High risk`: count of active `REQUESTED` or `APPROVED` withdrawals assessed as `HIGH`.

Cards are clickable shortcuts that apply the corresponding list filter where that mapping is unambiguous. A summary failure does not hide or disable the operations table.

### Search and filters

The workspace supports:

- search by withdrawal ID, user name, user email, or normalized account number;
- status, risk level, and requested-date range filters;
- sorting by newest, oldest, amount, or risk severity;
- server-side pagination with a bounded page size;
- URL-backed search, filters, sort, and page so refresh and browser navigation preserve the view.

Search input is debounced. Filter changes reset to the first page. The server remains the source of truth for all result counts.

### Operations table

Columns are `Request`, `User`, `Amount`, `Destination`, `Risk`, `Status`, `Requested`, and `Action`.

The row presents only scan-critical information. Destination is masked. Clicking the row or `Review` opens the large review modal without changing the current list state.

- A `LOW` `REQUESTED` request may expose quick approve. Quick approve always opens a small confirmation popover that repeats amount and masked destination.
- `MEDIUM` and `HIGH` requests have no direct state-changing row action and must be reviewed in the modal.
- Mark paid requires a transfer reference and therefore occurs in the review modal.
- Terminal rows have no state-changing action.

On narrow screens, rows become compact cards. Risk, status, amount, user, and the review action remain visible without horizontal scrolling.

## Large review modal

The review surface is a centered modal rather than a drawer or separate route. It keeps the administrator in the current queue and allows dismissal by clicking the backdrop.

- Desktop width: `min(1120px, calc(100vw - 48px))`.
- Maximum height: `88vh` with independently scrolling content.
- Header and action footer remain fixed.
- Mobile presentation becomes a full-screen dialog.
- Escape, close button, and backdrop dismiss the modal while it is idle.
- Dismissal is blocked while an action is submitting.
- If an administrator has entered an unsaved note or transfer reference, dismissal requires confirmation.
- Focus is trapped inside the modal and returned to the row that opened it.

The information order is:

1. Decision summary: amount, lifecycle status, risk level, and a one-sentence explanation.
2. User and wallet: account status, wallet status, available balance, account age, and a link to the existing user detail page.
3. Destination: bank, holder, full account number, copy action, and whether the destination appears on another user.
4. Risk explanation: triggered rules, evidence, and suggested verification step.
5. Withdrawal history: lifetime counts and amounts plus five recent requests.
6. Lifecycle and audit: creation, approval, rejection, payment, cancellation, actor, time, and notes.

The amount is the primary visual anchor. `HIGH` risk is prominent but does not flood the modal with red. Timeline and older audit entries use progressive disclosure.

## Structured payout destination

The existing `bankInfo` string is unsuitable for reliable duplicate-account checks or reconciliation columns. New withdrawals therefore select an owned saved bank account by `bankAccountId`.

At request creation, the backend verifies ownership and snapshots these immutable values onto the withdrawal:

- bank code;
- bank name;
- account number;
- account holder;
- optional source bank-account ID.

The saved account may later be edited or deleted without changing an already-created withdrawal. `bank_info` remains populated as a legacy display snapshot for compatibility. Existing rows without structured fields remain readable; they receive a neutral `Legacy destination` information marker and do not participate in exact duplicate-account rules unless the data can be safely normalized.

The client withdrawal API changes from submitting free-form `bankInfo` to submitting `{ amount, bankAccountId }`. No client can submit an arbitrary destination snapshot.

## Transparent risk assessment

Risk assessment is deterministic and server-owned. It returns a level and a list of named findings. Each finding contains a stable code, severity, title, short explanation, evidence text, and suggested verification step. The UI never reimplements the rules.

The overall level is the maximum triggered severity:

- `HIGH`: account is currently restricted; wallet is currently locked; the normalized bank-code/account-number pair belongs to more than one user; or at least three withdrawals were requested by the user within 24 hours.
- `MEDIUM`: the amount exceeds twice the user's 90-day median after at least three terminal withdrawals exist; or a withdrawal was rejected or cancelled in the preceding seven days.
- `LOW`: no medium or high rule is triggered.

A first withdrawal and a legacy unstructured destination are neutral context markers, not risk findings. Rules never reject or approve automatically.

Thresholds are configuration properties with the values above as defaults. Risk is evaluated from batched/query-level aggregates for list rows to avoid N+1 queries. Detail evaluation may load richer evidence. The assessment is recalculated when data is read, then snapshotted into the action history when an administrator makes a decision.

A `HIGH` request requires the administrator to acknowledge `I reviewed the risk flags` and enter an internal note before approval. Reject remains a human decision and requires a user-visible reason.

## Action model and audit

Add `withdrawal_action_history` with:

- withdrawal ID;
- action type;
- old and new status;
- actor user ID and display name snapshot;
- public reason, when applicable;
- internal note, when applicable;
- bank transfer reference, when applicable;
- risk-level snapshot and serialized risk-finding snapshot;
- action timestamp.

History is append-only. Existing summary columns on `withdrawal_requests` remain for compatibility, but the new history is authoritative for who performed each transition.

Action requirements:

- Approve: optional internal note for `LOW/MEDIUM`; required risk acknowledgement and internal note for `HIGH`.
- Reject: required trimmed public reason; optional internal note.
- Mark paid: required trimmed bank transfer reference; optional internal note.
- User cancel: also records a history entry with the user as actor.

State-changing repository reads use a database lock or equivalent optimistic concurrency control. A stale or invalid transition returns `409 Conflict`. The UI explains that another administrator changed the request and refreshes the list, summary, and modal.

## API design

All endpoints remain under `/api/v1/admin/withdrawals`.

### List

`GET /api/v1/admin/withdrawals`

Parameters: `query`, `status`, `risk`, `from`, `to`, `sort`, `page`, and `size`.

Returns page content plus total elements/pages. Each row contains only list-safe fields and a masked destination.

### Summary

`GET /api/v1/admin/withdrawals/summary`

Returns the four workspace metrics. These are global operational metrics and are not changed by table filters.

### Review detail

`GET /api/v1/admin/withdrawals/{id}/review`

Returns the request, full structured destination, user/wallet context, risk assessment, withdrawal aggregates, recent withdrawals, lifecycle, and action history.

### Actions

- `POST /{id}/approve` with risk acknowledgement and optional/required internal note.
- `POST /{id}/reject` with public reason and optional internal note.
- `POST /{id}/mark-paid` with transfer reference and optional internal note.

The response is the refreshed review detail so the modal can update without composing state locally.

### Export preview and download

`GET /export/preview` accepts the same filters and returns eligible counts, date coverage, and whether sensitive rows will be included.

`GET /export.xlsx` accepts the same filters and returns the workbook. Export operates on every matching row, not only the visible page. A configurable maximum row count protects memory and response time; exceeding it returns a validation response that asks the administrator to narrow the date range.

## Excel workbook

The confirmation dialog states that the workbook contains full bank details in the reconciliation sheet and shows the matching row count before download.

### Operations sheet

Contains every matching request with request ID, user, amount, masked destination, status, risk level and reasons, reviewer/action summary, and timestamps.

### Bank Reconciliation sheet

Contains matching `APPROVED` and `PAID` requests only. It includes the full structured destination, amount, lifecycle status, approval metadata, transfer reference, and paid metadata.

Both sheets include export time, exporting administrator, and applied filters. Amount and timestamp cells use real spreadsheet types and formats rather than formatted strings. Column widths, frozen headers, auto-filter, and status styling make the workbook usable without manual cleanup.

Each export records an append-only audit entry containing the administrator, normalized filters, row counts, and timestamp. The audit record does not duplicate full account numbers.

## Data flow and component boundaries

Frontend units:

- `AdminWithdrawalsPage`: URL state and request orchestration.
- `WithdrawalSummaryCards`: independent summary loading state.
- `WithdrawalFilters`: search, filters, sort, and reset.
- `WithdrawalOperationsTable`: responsive rows, pagination, and quick-approve entry point.
- `WithdrawalReviewModal`: modal lifecycle and action forms.
- `WithdrawalRiskPanel`: risk/context rendering only.
- `WithdrawalTimeline`: lifecycle and action history.
- `WithdrawalExportDialog`: preview, confirmation, and download.

Backend units:

- query service for pageable list and summary projections;
- risk-assessment service with independently tested rules;
- review-detail assembler;
- existing withdrawal service for transactional state transitions;
- export service for workbook generation;
- action-history and export-audit repositories.

URL filters trigger list loading and reset page as needed. List and summary load independently. Review detail is fetched only when a request is opened. A successful action invalidates list, summary, and review detail. Export uses the same normalized filter object as list queries.

## Error, loading, and empty states

- List loading uses table/card skeletons; a failed list shows an inline retry state.
- Summary-card failure leaves the list usable and shows unavailable values rather than zero.
- Review-detail failure keeps the modal open with Retry and Close actions.
- Action failures preserve all entered notes and references.
- Export failure keeps the confirmation dialog open and offers Retry.
- Empty copy distinguishes an empty system from filters with no matches.
- API validation messages are mapped to field-level feedback; unknown failures use a concise workspace toast.

## Security and privacy

- Existing admin authorization applies to list, summary, review, actions, and export.
- List and operations export mask account numbers.
- Full account numbers are returned only by review detail and bank-reconciliation export.
- Destination ownership is validated when a user creates a withdrawal.
- Spreadsheet cells beginning with `=`, `+`, `-`, or `@` from user-controlled text are escaped to prevent formula injection.
- Export responses disable caching and use a safe generated filename.
- Logs and export-audit rows never include full account numbers.

## Visual and accessibility rules

The page retains the existing admin palette: white/slate surfaces, navy `#070f4f` hierarchy, and burgundy `#b3193a` accent. It does not adopt the cinematic client wallet theme.

Summary cards are flat and restrained. The table uses a sticky header and moderate density. Risk color is always accompanied by text and an icon. The modal uses whitespace and typography for hierarchy instead of excessive nested cards, borders, and shadows.

All dialog controls have accessible names. The modal has an accessible title and description, traps focus, restores focus, and guards dismissal. Interactive targets remain at least 44px on touch layouts. Loading and action results use appropriate status or alert semantics.

## Verification

Backend tests cover:

- destination ownership and immutable snapshots;
- pageable search, filters, sort, and summary metrics;
- every risk rule, threshold boundary, and maximum-severity behavior;
- no N+1 query regression in the list path where practical;
- approval requirements for high-risk requests;
- rejection, payment reference, cancellation, and immutable action history;
- concurrent/stale transitions returning conflict without duplicate refunds or history;
- workbook sheet names, row eligibility, typed cells, masking, formula-injection protection, and export audit.

Frontend tests cover:

- URL-backed filters and pagination;
- independent summary/list loading and failure states;
- responsive row/card rendering;
- quick approval only for eligible low-risk requests;
- modal opening, backdrop/Escape behavior, unsaved-change guard, focus return, and mobile full-screen behavior;
- risk evidence, acknowledgement, action validation, preserved form input, and conflict refresh;
- export preview, sensitive-data confirmation, file download, and error retry.

Focused browser verification covers the real modal layout at desktop and mobile widths, keyboard-only review, and the complete low-risk and high-risk action paths.

## Acceptance criteria

- Admins can search, filter, sort, and page withdrawals without loading the full dataset.
- The four operational metrics render from server aggregates.
- Every row shows masked destination, status, and server-calculated risk level.
- Low-risk requests support confirmed quick approval; flagged requests require modal review.
- The large modal clearly presents request, account, wallet, destination, risk evidence, history, and audit context.
- High-risk approval requires acknowledgement and an internal note; no rule makes an automatic decision.
- Every state transition records an immutable actor/action/risk snapshot.
- Mark paid requires a transfer reference.
- Concurrent actions fail safely with a refreshable conflict state.
- Excel export produces `Operations` and `Bank Reconciliation` sheets using the current filters, with masking and export audit as specified.
- Existing user withdrawal history and cancellation continue to work with structured destination snapshots.
- Focused backend, frontend, type-check, and browser verification pass.
