# Admin User Wallet Credit Design

## Goal

Allow administrators to inspect a user's complete account and wallet history, then credit a failed top-up manually without allowing debits or self-credit.

## Backend

- Add `lastLoginAt` to the existing admin user detail response.
- Add wallet `balance` to the existing admin wallet-control response.
- Add `POST /api/v1/admin/users/{userId}/wallet/credit` with a positive integer VND `amount` capped at 50,000,000 and a required audit `reason`.
- Reject self-credit and reject credits while the target wallet is locked.
- Record each credit through `WalletService.adjust` as append-only `ADMIN_ADJUSTMENT` with the acting admin identity and reason in the ledger description.
- Add paginated `GET /api/v1/admin/users/{userId}/wallet-transactions` for the complete ledger. Return amount, balance before/after, reference, description, and timestamp.
- Keep the user's own wallet description generic as `Admin transferred money`; the admin endpoint returns the full audit description.

## Frontend

- Show last login, current balance, and wallet status on User Details.
- Add an accessible Add Balance dialog with amount, reason, current balance, projected balance, and explicit confirmation text.
- Add a Balance History tab with every wallet transaction, 20 rows per page.
- Show signed amounts, balance before/after, transaction type/content, reference, time, and full audit details for admin credits.
- Refresh balance and history immediately after a successful credit.

## Safety

- Admin role remains enforced at controller scope.
- Amount validation is enforced at the request boundary.
- Credits use the existing wallet row lock, non-negative guard, locked-wallet guard, and atomic ledger write.
- Wallet transactions remain immutable; no edit or delete endpoint is added.

## Verification

- Backend integration tests cover successful credit, complete history, self-credit rejection, amount validation, locked-wallet rejection, and user-safe descriptions.
- Frontend tests cover last login, balance, credit submission, projected balance, and full history rendering.
