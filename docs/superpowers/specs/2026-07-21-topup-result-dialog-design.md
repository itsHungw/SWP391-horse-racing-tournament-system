# Top-up Result Dialog Design

## Purpose

Give users an unambiguous, receipt-quality result after returning from VNPay. Replace the small wallet banner with a single accessible result dialog that can represent confirmed success, failure, or cancellation without guessing from the latest ledger entry.

## Current limitation

VNPay currently redirects to the wallet with only `?topup=success` or `?topup=failed`. The wallet page displays a banner, so it cannot reliably show the amount, transaction reference, processing time, or balance after the confirmed credit.

## Backend receipt contract

The return redirect includes the existing opaque transaction reference:

```text
/wallet?topup=success&txnRef=<reference>
/wallet?topup=failed&txnRef=<reference>
```

The frontend loads an owner-scoped receipt:

```text
GET /api/v1/wallet/topups/{txnRef}/receipt
```

The response contains:

- `txnRef`;
- `status`: `PENDING`, `SUCCESS`, or `FAILED`;
- `amount`;
- `balanceAfter`, nullable until a successful wallet credit exists;
- `walletTransactionId`, nullable until a successful wallet credit exists;
- `processedAt`, nullable while pending;
- `failureReason`, nullable and mapped to user-safe copy.

The receipt DTO deliberately normalizes internal order states: `INITIATED` and `PENDING` become public `PENDING`; `FAILED` and `EXPIRED` become public `FAILED`; `SUCCESS` remains `SUCCESS`.

The endpoint resolves the authenticated user first and returns `404 Not Found` when the reference does not belong to that user. It never exposes gateway signatures or raw VNPay payloads.

An exact receipt GET path is allowed for suspended and banned users because a payment initiated before enforcement may complete afterward. Top-up creation remains blocked for restricted accounts.

## Dialog behavior

`WalletPage` consumes `topup` and `txnRef` into local result state and removes both query parameters using replace navigation so refresh and browser history do not reopen the dialog. Other query parameters are preserved.

The page refreshes wallet summary, ledger, and receipt together. It does not infer the receipt by selecting the newest `TOPUP` transaction.

### Success

Show:

- confirmation icon and `Top-up successful`;
- confirmed amount;
- new available balance;
- transaction reference and processing time;
- primary `Done` action;
- secondary `View transaction` action that closes the dialog and focuses or scrolls to the matching ledger row.

### Failed or cancelled

Show:

- failure icon and a friendly reason;
- attempted amount and transaction reference when the receipt is available;
- explicit copy that no successful wallet credit was recorded;
- primary `Try again` action that closes the result and opens the existing top-up sheet when account and wallet capabilities allow it;
- secondary `Back to wallet` action.

### Receipt unavailable

Do not claim that payment succeeded or failed. Show `We could not load the payment receipt`, retain the captured reference, and provide `Retry` and `Back to wallet`. A failed receipt request must not alter wallet balance or create another top-up.

## Interaction and accessibility

- Use one `PaymentResultDialog` component with success, failure, and unavailable variants.
- Move initial focus to the dialog heading and return focus to the wallet add-money trigger when appropriate.
- Trap focus while open and support Escape when no retry/action is running.
- Use text and icons in addition to color.
- Format VND and timestamps with the wallet page formatters.
- On mobile, use a bottom-aligned sheet with safe-area padding; on desktop, use a centered receipt card.
- Respect reduced-motion preferences and avoid celebratory animation that delays access to the receipt.

## Idempotency and security

Loading or reopening a receipt is read-only. VNPay result processing remains idempotent through the existing top-up order and wallet reference rules. The frontend never credits a wallet and never trusts `topup=success` without the owner-scoped receipt.

## Verification

Backend coverage proves:

- a user can read their successful or failed receipt;
- another user receives `404` for the same reference;
- success returns the recorded amount and balance after credit;
- loading a receipt does not create another wallet transaction;
- a banned user can read a pre-enforcement receipt but cannot start another top-up.

Frontend coverage proves:

- success, failure, and unavailable states render correct actions;
- consumed query parameters are removed while unrelated parameters remain;
- refresh does not reopen a consumed result;
- retry does not create a top-up;
- `Try again` is unavailable when account or wallet capabilities prohibit top-up;
- production build succeeds.
