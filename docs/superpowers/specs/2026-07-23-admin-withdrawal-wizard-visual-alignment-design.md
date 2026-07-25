# Admin Withdrawal Wizard Visual Alignment

## Goal

Turn the withdrawal review modal into one visually consistent, status-driven wizard. The admin should understand the current stage immediately, complete a payout without reopening the request, and retain enough context to transfer safely without carrying the full review screen into the payment stage.

## Design principles

- Use the existing admin visual language throughout: navy primary actions, white and neutral surfaces, red destructive actions, and green only for successful outcomes.
- Keep the active task prominent and collapse completed context.
- Derive the current step from the server-owned withdrawal status. Do not add a second client-side workflow state.
- Preserve the current business rules, private receipt handling, local OCR, idempotency, conflict reload, and reject/refund behavior.
- Prefer a small number of flat sections over nested cards.

## Wizard model

The modal has three stages:

1. **Review** — active while status is `REQUESTED`.
2. **Transfer & receipt** — active while status is `APPROVED`.
3. **Completed** — active for `PAID`, `REJECTED`, or `CANCELLED`.

Completed stages display a check mark. The active stage uses navy emphasis. Future stages remain neutral. Rejected or cancelled completion uses a neutral/red outcome treatment rather than a success treatment.

The stepper is informational, not arbitrary navigation. Admins cannot return an approved request to `REQUESTED`, and clicking a completed step must not imply that decisions can be edited.

## Step 1: Review

Keep the existing evidence, destination, risk assessment, user context, decision controls, and audit timeline. The primary approval action is labelled **Approve & continue to payment**.

After approval succeeds, the modal remains open and moves to Step 2 using the returned server response. No intermediate confirmation modal and no page reload are required.

## Step 2: Transfer & receipt

Replace the full review workspace with a compact summary bar containing:

- withdrawal reference and user;
- amount;
- bank and account destination;
- risk level.

The account number remains visible because this is the protected admin review modal. A **View review details** disclosure expands the original evidence and audit context without changing workflow state.

Below the summary, use a focused two-column payment layout on wide screens and a single column on small screens:

- Left: VietQR and verified transfer details.
- Right: receipt upload, local OCR result, editable transaction reference, mismatch acknowledgement when required, and the final confirmation action.

The payment surface uses white and light-neutral backgrounds. Navy is the primary action color. Red is reserved for the collapsed **Cannot complete payment** path. Green appears only after a successful payment confirmation.

## VietQR presentation

Render the server-generated EMV payload as a clean QR code without a center overlay. Add a small external identity row above or below the QR reading **VietQR · NAPAS 247**. This communicates the payment rail without covering QR modules or depending on a remote image-generation service.

Keep copy and download controls. The verified bank, account holder, account number, amount, and transfer content remain visible next to the QR so the admin can verify the transfer manually.

## Step 3: Completed

For `PAID`, show a concise success panel with the amount, transfer reference, paid timestamp, private receipt preview, and audit timeline.

For `REJECTED` or `CANCELLED`, show a final non-success outcome with the public reason and refund decision in the timeline. Do not use green success styling for these states.

The modal is read-only in all terminal states.

## Interaction and accessibility

- Preserve backdrop and Escape dismissal when there are no unsaved fields.
- Preserve the discard confirmation when receipt, OCR, notes, or rejection fields are dirty.
- Prevent dismissal while an approval, OCR operation, payment confirmation, or rejection is running.
- Keep visible focus states, semantic headings, labels, live OCR progress, and minimum 44-pixel interactive targets.
- Any step transition is a short fade/vertical shift and must respect reduced-motion preferences.

## Component boundaries

- `WithdrawalWizardStepper`: status-to-step presentation only.
- `WithdrawalCompactSummary`: payout facts and expandable review disclosure.
- `WithdrawalPaymentStep`: payment orchestration and layout, restyled to accept the admin theme.
- `VietQrCard`, `ReceiptUploader`, and `ReceiptOcrResult`: retain their behavior while replacing user-theme colors with admin surface styles.
- `WithdrawalReviewModal`: selects the stage from `review.status`, owns dismissal protection, and handles authoritative reloads.

No new backend endpoint or database migration is required.

## Error handling

- A `409` reloads the authoritative review and therefore the correct wizard stage.
- Missing payment instructions retain the manual-retry error state.
- OCR failure keeps manual transaction-reference entry available and allows retrying a new receipt.
- QR copy/download failure does not block manual bank transfer.
- Receipt upload or payment failure preserves the current fields.

## Verification

- Component tests cover step derivation for requested, approved, paid, and rejected states.
- Modal tests cover approve-to-payment transition without closing and compact-summary disclosure.
- Payment tests cover the admin visual container, clean QR branding, OCR retry, confirmation, and reject/refund path.
- Accessibility assertions cover step labels, expanded state, focusable controls, and live progress.
- Run the full frontend test suite and production build after the focused tests pass.
