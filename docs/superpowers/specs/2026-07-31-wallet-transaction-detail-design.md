# Wallet Transaction Detail Design

## Goal

Let a user open any wallet ledger row and see what actually happened. For a top-up,
that includes the payment provider's own transaction number and the payment
instrument behind it — data the system already receives from VNPay but currently
exposes only to admins through finance reconciliation.

Design the storage, the API contract, and the UI so that adding a second payment
provider later requires no frontend change and no schema migration.

## Current State

- `TopUpService.processResult` stores `vnp_TransactionNo` into
  `topup_orders.vnpay_transaction_no`. `AdminTopUpReconciliationResponse` exposes it.
  Nothing user-facing does.
- `TopUpReceiptResponse` carries only `txnRef`, so `PaymentResultDialog` shows the
  merchant reference and never the provider's transaction number.
- `GET /api/v1/wallet/me/transactions` returns every transaction unpaginated and
  carries no provider fields.
- The ledger table on `WalletPage` is not clickable. Each row holds a `Report`
  button inside the Balance cell.
- `vnp_BankCode`, `vnp_BankTranNo`, `vnp_CardType` and `vnp_PayDate` are discarded.

## Provider Neutrality: Where The Line Sits

"Do not hardcode VNPay" covers three surfaces with very different cost and payoff.
This design takes the first two and deliberately declines the third.

**1. API and UI contract — take it.** A DTO field named `vnpayTransactionNo` forces
both a backend and a frontend change per new provider. A neutral contract costs
nothing extra to build now.

**2. Callback translation — take it.** `TopUpService.processResult` currently reads
`vnp_TxnRef`, `vnp_Amount`, `vnp_ResponseCode` and `vnp_TransactionStatus` directly,
so the money-flow service knows the gateway's wire format. Moving that parsing into
`VNPayService` is not speculative abstraction; it puts format knowledge where the
format is already understood.

**3. A `PaymentGateway` interface with one implementation — decline.** An interface
derived from a single sample is almost always shaped wrong. MoMo and ZaloPay differ
in signing, callback flow and error reporting, so an interface modelled on VNPay
today would be rebuilt when a real second provider lands. `VNPayService` is already
isolated behind `TopUpService`; extracting an interface at that point is mechanical.

Two further deliberate limits:

- Callback routes stay `/api/v1/wallet/vnpay/return` and `/api/v1/wallet/vnpay/ipn`.
  They are registered in the VNPay merchant portal and in the production `.env`, and
  a per-provider callback route is correct design regardless.
- Top-up initiation stays VNPay-only. There is no second gateway to choose between,
  and `TopUpSheet` presents VNPay branding.

Renaming the existing `vnpay_txn_ref`, `vnpay_response_code` and
`vnpay_transaction_no` columns is deferred. It touches 13 files across the entity,
repository, `AdminFinanceLedgerService`, the reconciliation DTO, `adminFinance.ts`,
`AdminFinanceTopUpsPage`, three test files and the V36 index, changes nothing a user
can observe, and risks the working reconciliation page. The schema therefore carries
mixed naming until a second provider justifies the cleanup.

## Schema

Migration `V39__topup_orders_payment_provider.sql`:

```sql
ALTER TABLE topup_orders ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'VNPAY';
ALTER TABLE topup_orders ADD COLUMN provider_details JSONB;
```

Columns that are queried stay real columns: `provider`, plus the existing
`vnpay_transaction_no` that finance reconciliation already filters on. Display-only
extras — bank code, card type, bank transaction number — go into `provider_details`,
so a new provider needs neither a migration nor a frontend change. The `DEFAULT`
backfills existing rows.

`provider_details` must be mapped with an explicit `@JdbcTypeCode(SqlTypes.JSON)`.
Hibernate has previously inferred the wrong Postgres type for an unannotated `String`
in this codebase (`@Lob`), so the mapping is stated rather than inferred, and covered
by a save-then-load round-trip test.

## Backend

**Neutral callback record.**

```java
record PaymentCallback(
    PaymentProvider provider, String txnRef, long amountVnd, boolean success,
    String providerTxnNo, String rawResponseCode, LocalDateTime paidAt,
    Map<String, String> details) {}
```

It maps onto `topup_orders` as: `provider` -> `provider`, `providerTxnNo` ->
`vnpay_transaction_no`, `rawResponseCode` -> `vnpay_response_code`, `paidAt` ->
`paid_at`, `details` -> `provider_details`. `TopUpOrder.markSuccess` therefore
changes from `(responseCode, transactionNo)` to taking the callback record.

`VNPayService.verifyAndParse(Map<String, String>) -> Optional<PaymentCallback>`
verifies the signature and translates the wire format, returning empty on an invalid
signature. `vnp_PayDate` arrives as `yyyyMMddHHmmss` in Asia/Ho_Chi_Minh; parsing is
defensive and yields `null` on a malformed value. **A display field must never be
able to fail a wallet credit.**

`TopUpService` keeps a thin VNPay-specific entry point that calls `verifyAndParse`,
then delegates to `applyCallback(PaymentCallback)`, which holds the existing amount
check, terminal-state guard, idempotent credit and `TOPUP_SUCCESS` notification, and
contains no `vnp_` string. All existing behaviour moves across unchanged; only the
input type differs. A second provider reuses `applyCallback` as is.

`PaymentProvider` enum (`VNPAY`) carries a display label.

**Detail endpoint.** `GET /api/v1/wallet/me/transactions/{id}` returns:

```java
record WalletTransactionDetailResponse(
    Long id, long amount, String type, String referenceType, Long referenceId,
    Long balanceAfter, String description, LocalDateTime createdAt,
    PaymentDetail payment) {

  record PaymentDetail(
      String provider, String providerLabel, String reference,
      String providerTxnNo, LocalDateTime paidAt, List<Field> fields) {
    record Field(String label, String value) {}
  }
}
```

`payment` is null for non-top-up rows. `fields` is an ordered, already-labelled list
built from `provider_details`, so the frontend renders it without knowing any
provider.

A new `WalletTransactionDetailService` loads the transaction, returns **404** when it
belongs to another user — not 403, which would confirm the row exists — and attaches
the `TopUpOrder` when `referenceType` is `TOPUP_ORDER`.

The `ADMIN_ADJUSTMENT` description mask currently lives inline in
`WalletTransactionResponse.from`. It is extracted into a shared helper used by both
DTOs. Without this the detail endpoint would return the internal admin reason that the
list endpoint deliberately hides.

**Receipt.** `TopUpReceiptResponse` gains the provider transaction number so the
post-payment dialog shows it at the moment of payment, not only on later review.

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
- Top-up rows render `BankLogo(provider bank code)` plus provider label, provider
  transaction number, paid-at, merchant reference and the `fields` list. `BankLogo`
  already falls back to a coloured monogram, so an unrecognised bank code cannot break
  the layout.
- Copy stays English to match the rest of the wallet UI.

## Edge Cases

- Top-ups predating this change have `provider_details` null. Those rows are omitted
  from `fields` rather than rendered as em dashes.
- Failed top-up orders never produce a wallet transaction, so the modal only ever
  shows successful top-ups.
- A provider bank code with no logo asset falls back to a monogram chip.

## Verification

Backend: `vnp_PayDate` parses correctly and yields null on malformed input; a full IPN
callback persists `provider` and `provider_details`; `provider_details` survives a
save-then-load round trip; the detail endpoint returns 404 for another user's
transaction; `ADMIN_ADJUSTMENT` descriptions stay masked on the detail endpoint.

Frontend: clicking a ledger row opens the modal and shows the provider transaction
number; a withdrawal row shows its bank; a top-up with no `provider_details` renders
without empty rows.

## Branch

`feat/wallet-transaction-detail`, cut from `feat/admin-user-balance` because that
branch modifies `WalletTransactionResponse` and already occupies migration V38.
