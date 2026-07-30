# Wallet Transaction Detail Design

## Goal

Let a user open any wallet ledger row and see what actually happened. For a top-up,
that includes VNPay's own transaction number and the payment instrument behind it —
data the system already receives but currently exposes only to admins through finance
reconciliation.

## Current State

- `TopUpService.processResult` stores `vnp_TransactionNo` into
  `topup_orders.vnpay_transaction_no`. `AdminTopUpReconciliationResponse` exposes it.
  Nothing user-facing does.
- `TopUpReceiptResponse` carries only `txnRef`, so `PaymentResultDialog` shows the
  merchant reference and never VNPay's transaction number.
- `GET /api/v1/wallet/me/transactions` returns every transaction unpaginated and
  carries no VNPay fields.
- The ledger table on `WalletPage` is not clickable. Each row holds a `Report` button
  inside the Balance cell.
- `vnp_BankCode`, `vnp_BankTranNo`, `vnp_CardType` and `vnp_PayDate` are discarded.

## Scope Decision

An earlier revision of this spec made the storage, API contract and callback
translation provider-neutral so a second payment provider would need no frontend or
schema change. That was dropped for schedule reasons. This version is deliberately
VNPay-specific: plain columns, VNPay-named DTO fields, no gateway indirection.

What that costs later: adding a second provider means a migration, a DTO change and a
frontend change. What it avoids now: a JSONB column mapped through Hibernate, which is
the highest-risk part of the original design given this codebase has already been bitten
by Hibernate inferring the wrong Postgres type for an unannotated `String`.

Callback routes stay `/api/v1/wallet/vnpay/return` and `/api/v1/wallet/vnpay/ipn`.
They are registered in the VNPay merchant portal and in the production `.env`.

Renaming the existing `vnpay_*` columns is out of scope: 13 files, nothing a user can
observe, and it risks the working reconciliation page.

## Schema

Migration `V39__topup_orders_vnpay_payment_details.sql` adds four nullable columns to
`topup_orders`: `vnpay_bank_code`, `vnpay_bank_tran_no`, `vnpay_card_type`,
`vnpay_pay_date`. Existing rows keep them null.

## Backend

**Capture.** `TopUpService.processResult` reads the four extra params on success and
passes them to `TopUpOrder.markSuccess`, whose signature grows beyond
`(responseCode, transactionNo)`. `vnp_PayDate` arrives as `yyyyMMddHHmmss` in
Asia/Ho_Chi_Minh; parsing is defensive and yields `null` on a malformed value, since a
display field must never be able to fail a wallet credit. Every existing guard —
signature check, amount match, terminal-state check, idempotent credit, `TOPUP_SUCCESS`
notification — stays exactly as it is.

**Detail endpoint.** `GET /api/v1/wallet/me/transactions/{id}` returns
`WalletTransactionDetailResponse`: the generic ledger fields plus a nullable `topUp`
block holding `txnRef`, `transactionNo`, `bankCode`, `bankTranNo`, `cardType` and
`paidAt`. A new `WalletTransactionDetailService` loads the transaction, returns **404**
when it belongs to another user — not 403, which would confirm the row exists — and
attaches the `TopUpOrder` when `referenceType` is `TOPUP_ORDER`.

**Description mask.** The `ADMIN_ADJUSTMENT` mask currently lives inline in
`WalletTransactionResponse.from`. It is extracted into a shared helper used by both
DTOs. Without this the detail endpoint returns the internal admin reason that the list
endpoint deliberately hides.

**Receipt.** `TopUpReceiptResponse` gains `transactionNo` so `PaymentResultDialog`
shows it at the moment of payment, not only on later review.

## Frontend

- `TransactionDetailModal.tsx`, built on the existing `Modal`.
- Trigger: a real `<button>` in the Type cell as the keyboard and screen-reader entry
  point, with `onClick` on the `<tr>` as a mouse convenience. No ARIA role on `<tr>`.
- The `Report` button moves from the Balance cell into the modal. Leaving it in place
  would nest interactive controls once the row itself is clickable, and reporting is
  naturally a detail-level action.
- `WITHDRAWAL_HOLD` and `WITHDRAWAL_REFUND` rows match `referenceId` against the
  withdrawals array `WalletPage` already loads, showing `BankLogo` and a status badge
  at no backend cost.
- Top-up rows render `BankLogo(bankCode)` plus VNPay's transaction number, bank
  transaction number, card type, paid-at and the merchant reference. `BankLogo` already
  falls back to a coloured monogram, so an unrecognised bank code cannot break layout.
- Fields that are null are omitted rather than rendered as em dashes.
- Copy stays English to match the rest of the wallet UI.

## Edge Cases

- Top-ups predating this change have all four columns null; the top-up block renders
  with only `txnRef` and `transactionNo`.
- Failed top-up orders never produce a wallet transaction, so the modal only ever shows
  successful top-ups.

## Verification

Backend: `vnp_PayDate` parses correctly and yields null on malformed input; a full IPN
callback persists all four columns; the detail endpoint returns 404 for another user's
transaction; `ADMIN_ADJUSTMENT` descriptions stay masked on the detail endpoint.

Frontend: clicking a ledger row opens the modal and shows the VNPay transaction number;
a withdrawal row shows its bank; a legacy top-up with null columns renders without empty
rows.

## Branch

`feat/wallet-transaction-detail`, cut from `feat/admin-user-balance` because that branch
modifies `WalletTransactionResponse` and already occupies migration V38.
