# Withdrawal Wizard Navigation and Export Design

## Objective

Refine the admin withdrawal workflow so the three-step wizard feels intentional rather than rigid, lets an admin inspect an approved review without implying that approval can be undone, and exports separate operational and reconciliation views without embedding private receipt images in Excel.

The server-owned withdrawal status remains the only workflow state. This work changes presentation, navigation, deep linking, and workbook structure; it does not add a reversible approval transition or a new accounting role.

## Wizard interaction model

The wizard retains three business stages:

1. **Review** for `REQUESTED`.
2. **Transfer & receipt** for `APPROVED`.
3. **Completed** for `PAID`, `REJECTED`, or `CANCELLED`.

The connected progress rail displays the authoritative stage derived from `AdminWithdrawalReview.status`:

- the current stage uses a solid navy node;
- completed stages use a white node with a navy check mark;
- future stages use a neutral outline;
- a navy connector indicates completed progress;
- brief secondary labels communicate `Approved`, `Current`, and `Pending` where space permits.

After approval, the completed Review stage becomes an inspection control. Activating it displays the approved evidence in read-only mode inside the same modal. It does not change the server status, reopen decision controls, or move the authoritative current stage away from Transfer & receipt. A clear **Return to transfer** action restores the payment workspace.

The modal owns a presentation-only `viewedStep`. It resets to the authoritative stage when the withdrawal ID or server status changes. Approval, conflict reload, payment confirmation, rejection, and cancellation continue to use the server response as the source of truth.

## Visual direction

The visual direction is a restrained connected progress rail inspired by the supplied reference, adapted to the existing admin language rather than copying its decorative mint treatment.

- Use 34–36 px circular nodes, a 2 px connector, and generous vertical spacing.
- Preserve the admin navy `#070f4f`, white surfaces, slate text, and restrained rose destructive color.
- Keep the rail flat: no gradients, glass, large shadows, illustration backgrounds, or rounded card containers.
- Use hierarchy through weight, spacing, and alignment rather than repeated uppercase kickers.
- Give completed Review a visible hover and keyboard-focus state only when it is inspectable.
- Use a short opacity/vertical transition when swapping the read-only review and payment workspace; provide an instant reduced-motion alternative.
- On small screens, retain the horizontal three-stage rail but shorten secondary copy before reducing target size. Interactive targets remain at least 44 px.

The approved payment view keeps the compact payout summary followed by QR and receipt work. Opening Review replaces the payment content with the original overview, risk evidence, user context, and timeline in a calm read-only layout. It must not stack the full review and payment workspaces together.

## Read-only review behavior

The read-only panel reuses existing evidence components:

- withdrawal overview and full destination snapshot;
- risk evidence and findings;
- user and wallet context;
- immutable decision timeline.

It excludes approve and reject controls. A small outcome notice states that the request was approved and that the admin is viewing the recorded decision. The primary action is **Return to transfer**. Backdrop, Escape, focus trapping, dirty-state confirmation, and busy-state dismissal protection remain unchanged.

Terminal withdrawals stay read-only. The Completed stage remains authoritative; recorded review and payment evidence can be inspected without restoring editable controls.

## Workbook structure

The export remains filter-aware and audited, but the workbook is reorganized into three purpose-built sheets.

### Payment Queue

This is the first sheet and contains only `APPROVED` requests. It supports direct transfer work and includes:

- withdrawal reference;
- approval timestamp;
- user name and email;
- amount as a numeric VND value;
- bank code and bank name;
- full account number stored as text to preserve leading zeroes;
- account holder;
- transfer content;
- risk level.

### Paid Reconciliation

This sheet contains only `PAID` requests and includes:

- withdrawal reference;
- request and payment timestamps;
- user identity;
- numeric VND amount;
- bank and full destination snapshot;
- transfer reference;
- payment actor when recorded;
- receipt availability;
- receipt checksum;
- an **Open in admin** hyperlink when an absolute admin URL can be configured.

The hyperlink opens the withdrawal admin route with a `review=<id>` query parameter. The application reads this parameter and opens the existing protected review modal. Receipt retrieval therefore continues through authenticated application behavior. If the frontend base URL is unavailable, the cell contains the withdrawal reference without creating a broken hyperlink.

Receipt images are never embedded in the workbook. This keeps exports small, filterable, and less likely to leak private evidence through copied spreadsheets.

### Operations

This sheet contains all requests matched by the active filters. It retains masked account numbers and supports general reporting without exposing full payout destinations unnecessarily.

## Workbook presentation and safety

- Put the workbook title, export timestamp, and normalized filter summary above each table.
- Use the existing navy header with white text, freeze the table header, and enable filters.
- Apply consistent widths, VND number formatting, and date-time formatting.
- Store account numbers and transfer references as text.
- Use restrained status fills only where they improve scanning; do not turn the workbook into a color grid.
- Preserve spreadsheet formula-injection escaping for all user-controlled text.
- Preserve the row limit, sensitive-data acknowledgement, and export audit record.
- Update the export preview to explain the three sheets and count Payment Queue and Paid Reconciliation rows separately.

## Data flow and component boundaries

### Frontend

- `WithdrawalWizardStepper` renders connected stage states and exposes inspection intent for completed stages.
- `WithdrawalReviewModal` owns `viewedStep`, resets it from authoritative review data, and selects one workspace at a time.
- A focused read-only review workspace reuses existing evidence components without decision controls.
- `AdminWithdrawalsPage` reads `review` from the URL and opens the modal, enabling Excel deep links.
- `WithdrawalExportDialog` previews the new three-sheet output and retains sensitive-data acknowledgement.

### Backend

- `WithdrawalExportService` writes Payment Queue, Paid Reconciliation, and Operations through separate focused methods.
- Existing withdrawal and action-history data provide destination, transfer reference, payment time, actor, filename, and checksum information.
- A configurable frontend base URL is used only to create valid admin deep links. Missing configuration degrades to plain text.
- No database migration or new file endpoint is required.

## Error handling

- A failed read-only navigation cannot mutate the withdrawal; the admin can return to the authoritative stage.
- A conflict reload resets the viewed panel to the stage returned by the server.
- Missing receipt metadata is exported as `Not available` and does not fail workbook generation.
- Missing frontend URL configuration omits the hyperlink instead of emitting an invalid link.
- Existing export size errors, download retry behavior, private-receipt authorization, and modal dismissal guards remain in place.

## Accessibility and responsive behavior

- Use semantic progress navigation and expose the authoritative stage with `aria-current="step"`.
- Completed Review is a real button only when inspection is available; decorative nodes remain non-interactive.
- Clearly announce read-only review context and preserve a logical focus destination after panel swaps.
- Keep visible focus rings and 44 px targets.
- Preserve readable labels on narrow screens and do not rely on color alone for completed/current states.
- Respect `prefers-reduced-motion` for all panel transitions.

## Testing

Frontend tests cover:

- status-to-stage rendering and connected completion states;
- Review inspection from an approved withdrawal without a status mutation;
- absence of decision controls in read-only review;
- Return to transfer behavior and focus handling;
- URL deep linking into the withdrawal modal;
- updated export preview copy and sensitive-data acknowledgement.

Backend tests cover:

- the three sheet names and order;
- status filtering for Payment Queue and Paid Reconciliation;
- full account numbers only in sensitive operational sheets and masked accounts in Operations;
- preservation of leading zeroes and numeric VND amounts;
- paid timestamp, transfer reference, receipt availability, checksum, and optional hyperlink;
- absence of embedded workbook images;
- formula-injection escaping, row limits, and export auditing.

Production build and the complete frontend and backend test suites must pass before completion.

## Out of scope

- Undoing approval or returning an `APPROVED` request to `REQUESTED`.
- Editing review evidence after approval.
- Adding an accountant role.
- Embedding receipt images in Excel.
- Creating a ZIP evidence archive.
- Introducing a new workflow engine, database migration, or file-storage model.
