# Account Enforcement Appeal Design

## Purpose

Give suspended and banned users a clear, auditable way to ask the platform to review the latest account-enforcement decision. An appeal does not automatically restore account or wallet access.

## Delivery order

1. Merge `fix/ban-acc` into `develop`.
2. Update and merge `feat/spectator-complaint`, renumbering its migration after the enforcement migrations.
3. Create a small integration branch from the resulting `develop` for account appeals.

The restricted-page background is independent and may ship with `fix/ban-acc`. The appeal workflow must reuse the dispute subsystem after that subsystem reaches `develop`.

## Restricted-page presentation

The page uses a full-viewport horse-racing background with a navy-to-burgundy overlay, subtle grain, and a dark lower vignette. The image is decorative and must not reduce text contrast. The existing decision card remains the visual focus and receives a translucent surface treatment only if readability remains at least WCAG AA.

The page continues to show:

- account status and public decision reason;
- effective time;
- wallet status, public wallet reason, and decision time;
- wallet access, status refresh, workspace return when permitted, and logout actions.

When the dispute subsystem is available, an `Appeal this decision` section appears below the decision details.

## Business rules

- Both `SUSPENDED` and `BANNED` users may appeal.
- An appeal always references the latest applicable `UserStatusHistory` record, never a user-supplied user ID.
- At most one non-terminal appeal may exist for an enforcement decision.
- Terminal statuses are `RESOLVED` and `REJECTED`.
- A new appeal is allowed only when a newer enforcement decision exists.
- Submitting or resolving an appeal does not itself change account status, wallet status, race participation, results, settlements, or refunds.
- Restoring, reopening, banning, or changing wallet access remains an explicit admin action recorded by the existing enforcement audit.
- Users may read only their own appeals. Admins may review all appeals through the dispute workspace.

## Dispute extension

Extend the shared dispute model rather than creating an `account_appeals` table:

- Add `ACCOUNT_ENFORCEMENT` to `DisputeReferenceType`.
- Use `UserStatusHistory.id` as `referenceId`.
- Use category `DISCIPLINARY` by default.
- Set requester from the authenticated user and handler role to `ADMIN`.
- Add a repository existence check for a non-terminal dispute with the same requester, reference type, and reference ID.

The account-appeal endpoint is separate from the spectator endpoint so eligibility is based on authenticated account ownership, not the presence of a `SPECTATOR` role.

## API flow

### Read current appeal

`GET /api/v1/me/account-appeal`

Returns the latest enforcement decision and its linked appeal, or `appeal: null` when the current decision has not been appealed.

### Submit appeal

`POST /api/v1/me/account-appeal`

Request fields:

- `title`: required, trimmed, maximum 160 characters;
- `description`: required, trimmed, maximum 3000 characters;
- `evidenceUrls`: optional list created through the existing dispute evidence upload flow.

The server selects and validates the latest enforcement decision inside the transaction. It returns `409 Conflict` if that decision already has a non-terminal appeal.

## Restricted-account access policy

For both suspended and banned accounts, explicitly allow:

- `GET /api/v1/me/account-appeal`;
- `POST /api/v1/me/account-appeal`;
- the narrowly scoped evidence upload endpoint required by appeals.

No broad `/disputes/**` or `/files/**` prefix is added to the allowlist. File type, count, and size validation remain enforced by the shared upload service.

## User experience states

- No appeal: show `Submit an appeal`.
- `OPEN`, `IN_PROGRESS`, or `ESCALATED`: show `Under review`, submission time, and disable duplicate submission.
- `RESOLVED`: show the resolution note and keep enforcement unchanged until an admin explicitly changes it.
- `REJECTED`: show the rejection note and do not allow another appeal for the same decision.
- Network failure: preserve entered text and show a retryable inline error.

The form asks for a concise title, detailed explanation, and optional screenshots. It clearly states that submitting an appeal does not immediately unlock the account or wallet.

## Admin experience

Account appeals appear in the existing admin dispute workspace with an `Account enforcement` reference label. The detail view links to the affected user and the referenced enforcement-history record. Resolving the dispute does not silently call account-enforcement endpoints.

## Concurrency and audit

Submission uses a database-backed uniqueness guarantee or an equivalent locked existence check so two concurrent requests cannot create duplicate open appeals. The dispute retains requester, timestamps, handler, status, resolution note, and attachments. Account and wallet decisions continue to use their own histories.

## Verification

Focused backend coverage must prove:

- suspended and banned users can submit an appeal;
- active users without a current restricted decision cannot submit one;
- users cannot select another user's decision;
- duplicate concurrent/open appeals are rejected;
- banned access policy permits only the exact appeal and evidence operations;
- resolving an appeal does not change account or wallet status.

Frontend verification covers the four appeal states, preserved form input on failure, disabled duplicate submission, responsive background readability, and production build.
