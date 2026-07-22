# Admin Withdrawal Direct Payment Design

**Date:** 2026-07-23
**Status:** Approved in brainstorming; awaiting written-spec review
**Scope:** Extend the existing admin withdrawal review modal into a complete, single-session payment workflow with VietQR, private receipt evidence, and client-side OCR.

## 1. Context

The current withdrawal operations workspace supports review, approval, rejection, mark-paid, audit history, risk reasoning, and Excel export. The current payment handoff assumes that approved withdrawals may be exported and completed outside the system.

The desired business flow removes that external handoff. An admin should open a withdrawal once, review it, approve it, transfer money directly, attach evidence, and confirm payment without leaving or reopening the modal.

The system does not model an accountant role. Admin is both the reviewer and payment operator. Excel remains available for reconciliation and bulk reporting, but it is not the primary payout workflow.

## 2. Goals

- Let an admin complete review and payment in one continuously open modal.
- Preserve separate `APPROVED` and `PAID` audit events without adding navigation friction.
- Generate a VietQR payment instruction from immutable withdrawal snapshot data.
- Support desktop QR scanning and mobile QR download.
- Read transaction details from a receipt image locally in the admin browser.
- Require a transaction reference and private receipt before marking a withdrawal paid.
- Keep rejection and refund behavior exact, atomic, and easy to explain.
- Use the existing Spring layered architecture and focused React components.
- Avoid scattered magic strings, bank-specific conditionals, and oversized services/components.

## 3. Non-goals

- Connecting directly to a bank transfer API.
- Automatically deciding that a transfer succeeded from OCR output.
- Creating an accountant role or a separate accountant workspace.
- Allowing users to view or download internal receipt images.
- Supporting batch transfer execution from Excel.
- Introducing Hexagonal Architecture or a framework-level frontend state machine.

## 4. Core Business Decisions

1. Admin performs the payout directly from the withdrawal review modal.
2. QR is unavailable until the withdrawal has been approved.
3. Approval does not close the modal. It advances the same modal to payment.
4. A successful bank transfer is confirmed manually with receipt evidence.
5. OCR may suggest values, but it never changes withdrawal status.
6. Mark-paid requires an approved withdrawal, a transaction reference, and a valid receipt.
7. Reject always refunds held funds exactly once.
8. An approved request may be rejected and refunded only when no transfer was made and the destination cannot receive payment.
9. Temporary bank or network failures leave the withdrawal `APPROVED` for retry.
10. A paid withdrawal is terminal and cannot be rejected through this workflow.

## 5. User Experience

### 5.1 Modal lifecycle

The modal header shows two steps:

`1. Review` -> `2. Payment`

For a `REQUESTED` withdrawal, the modal opens on Review:

- User identity, amount, immutable destination, risk evidence, wallet context, and audit history remain visible.
- Admin can approve or reject.
- High-risk approval retains the existing acknowledgement and internal-note requirements.
- Rejection requires a public reason and refunds the held amount exactly once.

When admin selects **Approve & continue to payment**:

- Backend revalidates lifecycle and risk.
- Backend records the `APPROVED` audit event.
- The modal remains mounted and open.
- The review step becomes complete.
- The payment step expands immediately.
- Recipient, amount, and withdrawal reference stay pinned for comparison.

For an already `APPROVED` withdrawal, opening the modal starts directly on Payment. Approval is never repeated.

### 5.2 Payment step

The payment step displays:

- VietQR image when supported.
- Bank name, account holder, account number, exact amount, and transfer content.
- **Download QR** for mobile banking apps that import QR images.
- Copy actions for account number, amount, and transfer content.
- Short, accessible copy confirmation feedback.
- Manual-transfer fallback when QR cannot be created.

The transfer content follows a configurable template and defaults to `WD{withdrawalId}` with a normalized, bank-safe output such as `WD000123`.

The admin performs the transfer in their banking application, returns to the still-open modal, chooses a receipt image, reviews OCR output, and selects **Confirm paid**.

### 5.3 Receipt interaction

- Accept `JPEG`, `PNG`, and `WebP` only.
- Support file selection and drag/drop.
- Show a local preview before upload.
- Run OCR locally after selection.
- Autofill a transaction-reference candidate when confidence is high.
- Show up to three candidates when confidence is medium.
- Fall back to manual entry when confidence is low.
- Allow the admin to correct every OCR-derived value.
- Keep the selected image and OCR results after recoverable errors.

The comparison panel reports independently:

- Transaction reference detected.
- Amount matched.
- Transfer content matched.
- Recipient or destination matched when the receipt exposes enough data.
- Transaction time detected.

An OCR mismatch shows a prominent warning. An admin may continue only by acknowledging the mismatch and entering an internal note. Low OCR confidence alone does not count as a mismatch.

### 5.4 Closing and resuming

- Clean, idle modals close by close button, Escape, or backdrop.
- Selected receipts, edited values, acknowledgements, or active OCR make the form dirty and trigger a discard confirmation.
- Uploading or finalizing payment temporarily disables dismissal.
- Closing after approval is safe; reopening resumes Payment.
- A completed modal shows a terminal success state and disables QR actions.

## 6. Withdrawal State Rules

Allowed transitions for this feature are:

| From | Action | To | Financial effect |
|---|---|---|---|
| `REQUESTED` | Approve | `APPROVED` | Held funds remain held |
| `REQUESTED` | Reject | `REJECTED` | Held funds refunded once |
| `APPROVED` | Confirm paid | `PAID` | Hold is finalized as payout |
| `APPROVED` | Reject unpayable destination | `REJECTED` | Held funds refunded once |

Disallowed transitions return `409 Conflict` and never partially update audit, evidence, or wallet data.

The existing locked withdrawal transition service remains the single place that changes withdrawal status and wallet holds. Payment orchestration calls it; controllers and React code never reproduce these rules.

## 7. Bank Directory and Immutable Payment Instructions

### 7.1 Bank directory

Introduce a maintained `bank_directory` table:

- `id`
- `code`
- `bin`
- `display_name`
- `qr_supported`
- `active`
- `directory_version`
- audit timestamps

New bank-account creation selects an active bank-directory record instead of accepting a free-form bank code. The account stores the bank-directory relationship while retaining the display name needed by existing responses.

Existing accounts are migrated by normalized bank code. Accounts that cannot be mapped remain valid for manual transfer but are not QR-capable.

### 7.2 Withdrawal snapshot

When a withdrawal is created, snapshot:

- Bank directory ID when available.
- Bank code.
- Bank BIN.
- Bank name.
- Account number.
- Account holder.

Payment instructions always use this snapshot. Later account edits, bank-directory changes, or account deletion cannot change an existing withdrawal destination.

### 7.3 VietQR generation

`VietQrService` receives a trusted withdrawal snapshot and configured transfer-content template. It returns a payment instruction containing:

- Availability and fallback reason.
- VietQR payload.
- Amount.
- Transfer content.
- Display-safe bank and recipient details.

The frontend renders the payload locally and creates the downloadable image. It does not send account data to a public QR-image URL. The frontend cannot submit replacement account, amount, or content values to generate a different QR.

QR payload generation is covered by reference-vector tests. Bank metadata comes from the directory, not `if/else` or `switch` blocks inside QR or modal code.

## 8. Receipt OCR

OCR runs in the browser through a lazily loaded module. It is split into two focused units:

- `BrowserReceiptOcr`: converts the image into text blocks and confidence information.
- `ReceiptFieldExtractor`: extracts transaction reference, amount, time, recipient hints, account hints, and transfer content.

The modal does not depend directly on a specific OCR library. A small internal TypeScript contract isolates the library without introducing a project-wide architecture pattern.

Extraction rules use named configuration and tested strategies. Bank-specific receipt layouts, when needed, live in dedicated strategy files with synthetic fixtures. They are not added as conditionals in the modal.

OCR output is advisory:

- It is not persisted until admin confirmation.
- It cannot approve or mark paid.
- It cannot override the trusted withdrawal amount or destination.
- It always remains editable.

The original receipt is sent only to this application's private backend storage during confirmation. It is never sent to an external OCR provider.

## 9. Payment Evidence and Idempotency

Because a withdrawal can have exactly one successful payment receipt, keep the payment reference on `withdrawal_requests` instead of introducing a one-to-one evidence entity. Add:

- unique nullable `payment_idempotency_key`
- `transfer_reference`
- private `payment_receipt_filename` referencing the existing `stored_files` metadata
- `payment_receipt_checksum`

Uploader identity, original filename, MIME type, file size, and upload timestamp remain in the existing private `stored_files` record. The mark-paid action history already records the payment actor, reference, and timestamp.

The admin performs one visible **Confirm paid** action. Internally, `WithdrawalPaymentService` performs:

1. Validate multipart metadata and authenticated admin.
2. Reuse the result when the idempotency key has already completed.
3. Validate file signature, MIME type, and configured size limit.
4. Store the file through the existing private `stored_files` flow using the `WITHDRAWAL_RECEIPT` category.
5. Lock and reload the withdrawal.
6. Validate `APPROVED`, transaction reference, file category/uploader, and mismatch acknowledgement.
7. Attach the private receipt filename/checksum, mark the withdrawal paid, and append audit history in one database transaction.

The private object and its existing stored-file metadata are created before the final database transaction, so a committed `PAID` state never points to a missing upload. If finalization fails, the request is not paid and the orchestration service deletes the newly stored file. A small scheduled safety-net cleanup removes old `WITHDRAWAL_RECEIPT` files that are not referenced by any withdrawal after the configured expiry.

Concurrent admins cannot attach two receipts because the withdrawal row is locked and the idempotency key is unique.

## 10. Backend Structure

Use the current layered Spring architecture:

```text
wallet/
  controller/
    AdminWithdrawalController
  service/
    WithdrawalService
    WithdrawalPaymentService
    VietQrService
    ReceiptStorageService
  repository/
    WithdrawalRequestRepository
    BankDirectoryRepository
  entity/
    WithdrawalRequest
    BankDirectory
  dto/
    payment request and response records
  config/
    WithdrawalPaymentProperties
```

Responsibilities:

- Controller handles HTTP mapping, authorization annotations, validation, and response status.
- `WithdrawalPaymentService` orchestrates payment use cases and idempotency.
- `WithdrawalService` owns lifecycle transitions, wallet holds, refunds, and action audit.
- `VietQrService` creates and validates payment instructions.
- `ReceiptStorageService` validates and stores private receipt files through the existing secure storage mechanism.
- Repositories only perform persistence/query work.
- Configuration properties contain operational policy values.

Do not introduce interfaces unless there is an actual replacement boundary or multiple implementations. Keep methods small and named after business use cases.

## 11. Frontend Structure

```text
withdrawals/
  WithdrawalReviewModal.tsx
  payment/
    WithdrawalPaymentStep.tsx
    VietQrCard.tsx
    ReceiptUploader.tsx
    ReceiptOcrResult.tsx
    useWithdrawalPayment.ts
    receiptOcr.ts
    receiptFieldExtractor.ts
```

- The modal owns selection and Review-to-Payment composition.
- `useWithdrawalPayment` owns asynchronous approval, OCR, receipt confirmation, retries, and dirty state.
- Payment components are presentational and receive typed props.
- A small state enum distinguishes `READY`, `OCR_RUNNING`, `READY_TO_CONFIRM`, `UPLOADING`, `COMPLETED`, and `ERROR`.
- The OCR implementation is dynamically imported only after image selection.
- No business-state transition is inferred solely in React; backend responses remain authoritative.

## 12. API Changes

### Review response

For `APPROVED` requests, review detail adds a payment instruction:

- QR availability.
- Fallback reason.
- Payload.
- Bank, recipient, amount, and transfer content display values.
- Whether private evidence already exists.

For `REQUESTED` requests, payment instruction is absent. After approval, the approve endpoint returns the updated review response containing it.

### Confirm paid

`POST /api/v1/admin/withdrawals/{id}/mark-paid`

Content type: `multipart/form-data`

Fields:

- `transferReference`
- `internalNote` when present
- `mismatchAcknowledged`
- `idempotencyKey`
- `receipt`

The endpoint returns updated review detail. Reusing a completed idempotency key returns the same completed state. Conflicting keys or lifecycle changes return `409`.

### Receipt retrieval

An authenticated admin-only endpoint streams receipt content with `Cache-Control: private, no-store`. Responses never expose raw storage keys or public object URLs.

The user withdrawal response may expose paid time and transfer reference, but never receipt metadata or a receipt endpoint.

## 13. Configuration

Use validated configuration properties, with environment overrides:

```yaml
wallet:
  withdrawal:
    payment:
      transfer-content-template: "WD{withdrawalId}"
      receipt-max-bytes: 5242880
      allowed-receipt-types:
        - image/jpeg
        - image/png
        - image/webp
      orphan-receipt-expiry: 24h
```

Spring property startup validation rejects empty templates, unsupported MIME configuration, non-positive sizes, and non-positive expiry.

OCR thresholds belong to the frontend because OCR runs entirely in the browser. A focused `receiptOcrConfig.ts` reads named Vite environment values with documented defaults:

```text
VITE_RECEIPT_OCR_HIGH_CONFIDENCE=0.85
VITE_RECEIPT_OCR_MEDIUM_CONFIDENCE=0.60
```

The config module validates that both values are between zero and one and that the high threshold is greater than the medium threshold. OCR components consume the typed config instead of repeating numeric literals.

User-visible text stays in frontend presentation constants/components. Business identifiers and limits do not appear as unexplained literals across the codebase.

## 14. Security and Privacy

- Admin authorization is enforced on review, approval, QR instruction, mark-paid, and receipt access.
- Receipt files use private authenticated storage.
- Validate file contents, not only extension or browser MIME.
- Sanitize filenames and never use them as storage paths.
- Store checksums and bounded metadata only.
- Do not log account numbers, QR payloads, receipt contents, or storage keys.
- Audit admin identity, withdrawal ID, action, private receipt filename, and outcome without logging file contents or storage keys.
- Keep full bank details out of list endpoints.
- Render OCR text as plain text; never inject extracted HTML.
- Apply `no-store` to QR/payment detail and receipt responses.
- Do not use OCR output as authorization or payment-success evidence by itself.

## 15. Error and Recovery Behavior

- Temporary bank failure: leave `APPROVED`; retry later.
- Permanently invalid destination before transfer: explicit Reject & Refund with public reason and confirmation that no transfer occurred.
- QR generation failure: manual-transfer card remains usable.
- OCR failure: retain preview; allow manual transaction reference.
- OCR mismatch: require acknowledgement and internal note.
- Receipt upload failure: retain local file and OCR state; retry with the same idempotency key.
- Database conflict: reload authoritative detail without duplicating evidence or payment.
- Lost success response: retry returns the existing `PAID` result.
- Unreferenced private receipt: immediate best-effort deletion plus scheduled cleanup after configured expiry.
- Completed payment: QR and payment actions are disabled.

## 16. Testing Strategy

### Backend

- Reference-vector tests for VietQR payloads.
- Bank-directory mapping and legacy manual fallback.
- Property validation tests.
- Mark-paid rejection when receipt, reference, or approval is missing.
- Multipart content, signature, size, and private-storage tests.
- Idempotent retry and lost-response behavior.
- Two-admin concurrency behavior.
- Receipt/idempotency uniqueness and orphan-receipt cleanup.
- Receipt authorization: admin allowed, user forbidden.
- Requested and approved rejection both refund exactly once.
- Paid requests cannot reject or refund.
- Audit history contains evidence reference without sensitive file data.

### Frontend

- Modal remains open and advances after approval.
- Opening `APPROVED` starts at Payment.
- QR rendering, copy controls, and download behavior.
- Manual fallback for unavailable QR.
- Lazy OCR loading.
- High, medium, and low-confidence extraction paths.
- Amount/content/recipient comparison and mismatch acknowledgement.
- Receipt preview, validation, dirty guard, retry, and focus behavior.
- Mobile download-first and desktop scan-first presentation.
- Idempotency key remains stable across retries.
- Successful confirmation shows terminal state.

OCR fixtures use synthetic receipts with no real bank-account or personal data.

## 17. Migration and Compatibility

- Add the bank directory and seed a versioned supported-bank dataset.
- Add nullable bank-directory/BIN fields to existing accounts and withdrawal snapshots.
- Backfill normalized known codes; leave unknown legacy records manual-transfer capable.
- Add nullable payment receipt/reference/idempotency columns to withdrawals without changing existing paid records.
- Existing `PAID` withdrawals remain readable without evidence and are labelled legacy evidence in admin review.
- Existing Excel export remains available and includes transaction references as before.

## 18. Acceptance Criteria

- Admin can open a requested withdrawal once and complete approval and payment without reopening the modal.
- QR appears only after successful approval and encodes immutable trusted data.
- Desktop can scan; mobile can download the same QR image.
- Receipt OCR runs locally and suggests a transaction reference without making payment decisions.
- Confirm paid requires private receipt evidence and a verified/corrected transaction reference.
- Retrying after a network failure cannot create a duplicate payment or receipt link.
- Reject from any permitted unpaid state refunds held funds exactly once.
- Users cannot access receipt evidence.
- Unsupported legacy bank data has a clear manual-transfer fallback.
- The implementation follows the existing layered architecture with focused services and components, validated configuration, and no scattered bank or policy hardcoding.
