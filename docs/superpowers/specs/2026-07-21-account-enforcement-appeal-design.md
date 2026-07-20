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

When the dispute subsystem is available, a `Request a review` section appears below the decision details. It is a specialized enforcement surface backed by the shared dispute subsystem; users are never redirected into the generic complaint creation flow.

## Business rules

- Both `SUSPENDED` and `BANNED` users may appeal.
- An appeal always references the latest applicable `UserStatusHistory` record, never a user-supplied user ID.
- At most one appeal may exist for an enforcement decision, regardless of its status.
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
- Add a repository existence check for any dispute with the same requester, reference type, and reference ID.

The account-appeal endpoint is separate from the spectator endpoint so eligibility is based on authenticated account ownership, not the presence of a `SPECTATOR` role.

## API flow

### Read current appeal

`GET /api/v1/me/account-appeal`

Returns the latest enforcement decision and its linked appeal, or `appeal: null` when the current decision has not been appealed.

### Submit appeal

`POST /api/v1/me/account-appeal`

Request fields:

- `description`: required, trimmed, maximum 3000 characters;
- `evidenceUrls`: optional list created through the existing dispute evidence upload flow.

The server generates the dispute title, fixes category to `DISCIPLINARY`, and selects and validates the latest enforcement decision inside the transaction. It returns `409 Conflict` if that decision already has an appeal. The client cannot submit a title, category, requester, handler, user ID, or reference ID.

## Restricted-account access policy

For both suspended and banned accounts, explicitly allow:

- `GET /api/v1/me/account-appeal`;
- `POST /api/v1/me/account-appeal`;
- the narrowly scoped evidence upload endpoint required by appeals.

No broad `/disputes/**` or `/files/**` prefix is added to the allowlist. File type, count, and size validation remain enforced by the shared upload service.

## User experience

The restricted page owns a compact appeal summary card:

- No appeal: show `Request a review` and `Submit an appeal`.
- `OPEN`, `IN_PROGRESS`, or `ESCALATED`: show `Under review`, case number, submission time, and a `View appeal details` action; do not render another submit action.
- `RESOLVED`: show the resolution note and keep enforcement unchanged until an admin explicitly changes it.
- `REJECTED`: show the rejection note and do not allow another appeal for the same decision.
- Network failure: preserve entered text and show a retryable inline error.

Submission opens a centered modal on desktop and a bottom sheet on narrow screens. The form shows a read-only summary of the referenced decision, one detailed explanation field, and optional screenshots. It clearly states that submitting an appeal does not immediately unlock the account or wallet. While uploading or submitting, dismissal is disabled. On success, the form transitions to an in-place confirmation state before the page card refreshes to `Under review`.

The dialog has an accessible name and description, traps focus, closes with Escape only while idle, and returns focus to the trigger. Statuses always use text and an icon in addition to color.

## Admin experience

Account appeals appear in the existing admin dispute workspace with an `Account enforcement` reference label. The detail view shows the original enforcement reason, appeal explanation, evidence, and case timeline, and links to the affected user and referenced enforcement-history record through `Review account enforcement`. Resolving or rejecting the dispute does not silently call account-enforcement endpoints.

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
