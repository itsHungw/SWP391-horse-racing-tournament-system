# Account Enforcement And Error UI Design

**Date:** 2026-07-15

**Updated:** 2026-07-20

**Status:** Approved design

**Scope:** Account suspension/ban policy, wallet behavior, authorization, admin workflow, frontend route guards, and shared error UI

## 1. Context

The current account-ban implementation treats every user status other than `ACTIVE` as disabled. `AuthService`, `CustomUserDetailsService`, and `JwtAuthenticationFilter` therefore prevent a suspended or banned user from authenticating. This is simple, but it also removes access to existing tournament records, predictions, wallet history, payouts, refunds, and withdrawal tracking.

The product needs graduated enforcement: stop a user from creating new risk without silently removing rights or money that arose before enforcement. The design must remain small enough for a course project and reuse the existing user statuses and wallet status.

The frontend also has inconsistent access-error behavior. Some guards redirect to home, some redirect to login, admin has a bespoke 403 page, other roles get an inline card, and the catch-all route silently redirects unknown URLs to home. The error UI will be standardized as part of this feature.

### 1.1 Operating Model

The product uses a managed B2B2C model:

- The platform owner governs identities, global account status, wallets, prediction money, and platform-wide policy.
- An organizer is an approved business operator that runs tournaments for one organization under platform moderation. It is not an independent wallet custodian or a tenant with authority over global accounts.
- Platform Admin is the only actor that may suspend or ban a user globally or lock a user wallet.
- Organizers and referees may apply tournament-scoped operational decisions such as registration rejection, scratch, reassignment, incident reporting, and disqualification where their existing domain permissions allow it.
- A tournament-scoped penalty never changes `users.status` automatically, and an account-status decision never changes a participant or race result automatically.

The current MVP does not model organizer prize escrow, organizer payables, platform commission, separate cash/winnings balances, or tenant-specific wallets. Those capabilities require a separate accounting design rather than being inferred from the single user-wallet balance.

## 2. Goals

- Reuse `ACTIVE`, `SUSPENDED`, and `BANNED`; do not add another user status.
- Separate identity authentication from account authorization.
- Let restricted users see and resolve existing rights without creating new platform activity.
- Keep wallet enforcement separate from account enforcement.
- Keep platform account enforcement separate from tournament sporting discipline.
- Preserve system-generated payouts and refunds even when a wallet is locked.
- Preserve legitimate user funds; never convert an entire wallet balance into platform or organizer revenue merely because an account is banned.
- Give admins an explicit, auditable Suspend -> Restore/Ban workflow.
- Standardize 401, 403, 404, 500, validation, conflict, and rate-limit UX.
- Deliver a modern error-page family aligned with the product's horse-racing visual language.

## 3. Non-goals

- Automated fraud detection or automatic suspension.
- A new `UNDER_REVIEW` user status.
- Automatic suspension expiry.
- Confiscation, chargeback adjudication, KYC, or AML workflows.
- A full customer-support ticketing or legal appeal system.
- Granular per-transaction wallet freezes or double-entry accounting.
- Organizer-owned wallets, event escrow, prize-purse accounting, platform commission, and tenant-scoped account bans.
- Automatic scratch or disqualification caused solely by account suspension or ban.
- Cloudflare custom error-page configuration.

## 4. Account Lifecycle

Normal enforcement follows this lifecycle:

```text
ACTIVE
  | Suspend
  v
SUSPENDED
  |-- Restore ----------------> ACTIVE
  `-- Confirm permanent ban --> BANNED

BANNED
  `-- Reopen case -----------> SUSPENDED
```

Rules:

- `SUSPENDED` represents a temporary restriction while an admin reviews the account or applies a temporary operational restriction.
- Suspension does not expire automatically. An admin must restore or ban the account.
- `BANNED` is the final decision that ends participation in the platform.
- Normal admin UI does not offer `ACTIVE -> BANNED`; the account must be suspended and reviewed first.
- A banned account is reopened to `SUSPENDED`, not directly to `ACTIVE`.
- `PENDING_EMAIL_VERIFY` and `INACTIVE` retain their existing meanings and are outside the enforcement workflow.

## 5. Capability Matrix

| Capability | `ACTIVE` | `SUSPENDED` | `BANNED` |
| --- | --- | --- | --- |
| Authenticate identity | Yes | Yes | Yes, restricted mode only |
| Access public pages | Yes | Yes | Yes |
| Access normal role workspace | Yes, by role | Read-only, by role | No |
| View profile and notifications | Yes | Yes | Restricted summary only |
| View existing tournament/registration/race records | Yes | Yes | Through restricted summary/history only |
| View predictions already placed | Yes | Yes | Through restricted summary/history only |
| Receive settlement payout/refund | Yes | Yes | Yes |
| View wallet balance and transaction history | Yes | Yes | Yes |
| Create a withdrawal request | If wallet active | If wallet active | If wallet active |
| Track/cancel own eligible withdrawal | Yes | Yes | Yes |
| Top up wallet | Yes | No | No |
| Place a new prediction | Yes | No | No |
| Request a new role | Yes | No | No |
| Register a new horse/tournament entry | Yes | No | No |
| Create or mutate tournaments | By role | No | No |
| Accept new contracts/assignments | By role | No | No |
| Submit appeal/contact request | Yes | Yes | Yes |
| Log out and perform account recovery | Yes | Yes | Yes |

For the initial implementation, all suspended business mutations are blocked. An admin handles cancellation, reassignment, or operational takeover for an in-progress organizer/referee obligation. This avoids allowing a reviewed account to alter race outcomes while keeping all prior records visible.

## 6. Wallet Policy

Account status and wallet status answer different questions:

- `users.status` controls participation in the platform.
- `wallets.status` controls user-initiated money movement.

Rules:

- Suspending or banning an account does not automatically lock its wallet.
- Admin may choose to lock the wallet when suspending an account if the review concerns payments, account takeover, or prediction fraud.
- `WalletStatus.ACTIVE` permits an eligible withdrawal request even when the user is suspended or banned.
- `WalletStatus.LOCKED` blocks user-initiated top-up, wager, and new withdrawal actions.
- Existing `REQUESTED` withdrawals remain reviewable. They are not automatically rejected because account status changed.
- Existing `APPROVED`/payment processing continues unless an admin explicitly changes the withdrawal decision under the withdrawal workflow.
- System-originated `BET_PAYOUT`, `BET_REFUND`, and `WITHDRAWAL_REFUND` must still credit a locked wallet and remain in the append-only transaction log.
- A locked wallet keeps credited money unavailable for withdrawal until an admin unlocks it.
- Restoring the account does not automatically unlock the wallet; the two reviews may have different conclusions.

This requires refining the current wallet-lock rule, which blocks every adjustment. The new rule blocks user-originated operations while allowing idempotent system settlement and refund credits.

### 6.1 Money Ownership And Enforcement

Policy text does not by itself determine that every wallet amount belongs to the platform or organizer after a ban. The system treats each movement according to its business source:

| Money category | Enforcement behavior |
| --- | --- |
| Unused legitimate top-up balance | Remains recorded for the user; withdrawal depends on wallet status |
| Legitimate prediction winnings | Settlement still credits the wallet |
| System payout/refund | Still credits a locked wallet and remains auditable |
| Pending withdrawal | Continues through the withdrawal workflow; it is not auto-rejected by account status |
| Suspected fraudulent funds | Admin locks the wallet while the case is reviewed |
| Confirmed invalid transaction | Reversed through an explicit, auditable adjustment/refund operation |
| Tournament prize affected by disqualification | Resolved under tournament rules, not converted automatically into organizer or platform revenue |

The MVP does not classify portions of one balance as clean, fraudulent, cash, winnings, organizer-owned, or platform-owned. Therefore enforcement operates at wallet level (`ACTIVE`/`LOCKED`) plus audited transaction-specific corrections. Blanket confiscation is outside scope. A production implementation involving real-money forfeiture requires separate legal, contractual, and accounting review.

### 6.2 Account Enforcement Versus Race Discipline

Account enforcement controls access to the platform. Sporting discipline controls tournament participation and results. They are related by an investigation but remain separate decisions with separate reasons and audit records.

Rules for active commitments:

- Before participant lock, a suspended user cannot create or accept new participation.
- After assignment but before a race starts, the organizer/admin may retain, replace, or scratch the participant through the tournament workflow.
- During an `ONGOING` race, suspending the account immediately blocks digital mutations but does not stop the physical race, remove the participant, or rewrite the result.
- After the race, the actual result remains unless an authorized referee/admin performs an explicit disciplinary correction or disqualification under tournament rules.
- Existing organizer/referee work is preserved for audit. Admin or another authorized operator takes over pending operations.
- A safety emergency may trigger a separate scratch/incident action, but the account decision and sporting decision retain distinct reasons.

The admin suspension surface must warn when the user has active assignments. The warning explains that suspension blocks platform operations but does not automatically scratch or disqualify the participant.

## 7. Admin Workflow And Audit

Account enforcement is removed from the generic profile-edit operation and exposed as explicit actions on the admin user-detail page.

Only Platform Admin performs global account and wallet enforcement. Organizer/referee controls remain tournament-scoped and cannot call these endpoints.

### 7.1 Actions

1. **Suspend account** (`ACTIVE -> SUSPENDED`)
   - Requires a public reason.
   - Accepts an optional internal note.
   - Allows admin to lock the wallet in the same transaction.
2. **Restore account** (`SUSPENDED -> ACTIVE`)
   - Requires a conclusion/reason.
   - Does not unlock the wallet automatically.
3. **Ban account** (`SUSPENDED -> BANNED`)
   - Requires a final public reason and confirmation.
   - Ends normal workspace access.
4. **Reopen case** (`BANNED -> SUSPENDED`)
   - Requires a reason.
   - Does not restore normal activity until a later Restore action.

### 7.2 Safeguards

- Admin cannot suspend or ban their own account.
- The last active admin cannot be suspended or banned.
- Invalid transitions return `409 Conflict`.
- Consequential actions use a reviewed modal, never a native browser confirmation.
- Public reason is visible to the affected user; internal note is admin-only.
- A status change writes audit history in the same database transaction as the user change and optional wallet lock.
- A notification record is created after a successful decision. Email failure must not roll back the enforcement transaction.

### 7.3 Audit Model

Add `user_status_history` rather than overloading `user_role_history`:

```text
id
user_id
old_status
new_status
public_reason
internal_note
changed_by
changed_at
wallet_locked
```

`users.status` remains the current state. The history table is immutable audit data.

## 8. Backend Authentication And Authorization

### 8.1 Authentication semantics

Spring Security's `UserDetails.isEnabled=false` prevents authentication. Since suspended and banned users need restricted identity access, account participation status must no longer be represented only through `disabled`.

Use an account-aware principal containing:

```text
userId
email
accountStatus
roles
```

Authorities include both role and current account status:

```text
ROLE_SPECTATOR / ROLE_HORSE_OWNER / ROLE_JOCKEY / ROLE_REFEREE / ROLE_ORGANIZER / ROLE_ADMIN
ACCOUNT_ACTIVE / ACCOUNT_SUSPENDED / ACCOUNT_BANNED
```

Deleted, unverified, inactive, or invalid-credential accounts remain unable to create a normal authenticated session. Suspended and banned accounts can authenticate only so the application can provide restricted access.

### 8.2 Current status on every request

Do not trust a status claim in a long-lived JWT as the authorization source. The current JWT filter already loads user details from the database on each request; retain that behavior and build the principal from the current database status.

```text
Validate JWT
  -> load current user by email
  -> build principal from current status and roles
  -> apply account access policy
```

An admin decision therefore takes effect on the user's next request without waiting for token expiry. Existing refresh sessions may be revoked as a defense-in-depth action, but restricted users may sign in again to reach the resolution surface.

Login and refresh responses add `accountStatus`:

```json
{
  "accessToken": "...",
  "fullName": "...",
  "email": "...",
  "accountStatus": "SUSPENDED"
}
```

The public reason and wallet details are not stored in the token; the frontend reads them from the restriction endpoint.

### 8.3 Central access policy

Account rules must be centralized in an `AccountAccessPolicy`/authorization manager rather than copied into controllers.

- `ACTIVE`: normal endpoint and role rules.
- `SUSPENDED`: public endpoints, authenticated read-only access to owned/role-authorized records, and explicitly allowlisted resolution/wallet actions.
- `BANNED`: public endpoints and explicitly allowlisted account-resolution/wallet actions only.
- All non-active business mutations are denied by default.
- Existing role and ownership checks still apply; account status never bypasses them.
- Backend enforcement is authoritative. Frontend hiding/disabling controls is only UX.

Method-level policy may be used for sensitive service operations, while HTTP authorization handles broad route families. A denied authenticated request returns `403`, not `401`.

## 9. API Shape

### 9.1 Admin enforcement

```http
POST /api/v1/admin/users/{id}/suspend
POST /api/v1/admin/users/{id}/restore
POST /api/v1/admin/users/{id}/ban
POST /api/v1/admin/users/{id}/reopen
GET  /api/v1/admin/users/{id}/status-history
```

Suspend request:

```json
{
  "reason": "Account activity is being reviewed",
  "internalNote": "Related to race #123",
  "lockWallet": true
}
```

Other transition requests contain required `reason` and optional `internalNote`.

### 9.2 Restricted user

```http
GET  /api/v1/me/account-restriction
GET  /api/v1/wallet/me
GET  /api/v1/wallet/me/transactions
GET  /api/v1/wallet/withdrawals
POST /api/v1/wallet/withdrawals
POST /api/v1/wallet/withdrawals/{id}/cancel
POST /api/v1/auth/logout
```

Restriction response:

```json
{
  "status": "SUSPENDED",
  "reason": "Account activity is being reviewed",
  "changedAt": "2026-07-15T10:30:00",
  "walletStatus": "LOCKED",
  "canWithdraw": false
}
```

The response never exposes `internalNote`.

### 9.3 Error codes

| HTTP | Code | Meaning |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | No valid identity/session |
| 403 | `ACCOUNT_SUSPENDED` | New activity denied during suspension |
| 403 | `ACCOUNT_BANNED` | Normal platform access denied |
| 403 | `WALLET_LOCKED` | User-originated wallet action denied |
| 403 | `SELF_ACCOUNT_ACTION_FORBIDDEN` | Admin attempted self-enforcement |
| 409 | `INVALID_ACCOUNT_STATUS_TRANSITION` | Transition is not allowed |
| 409 | `LAST_ADMIN_PROTECTED` | Decision would remove the last admin |

## 10. Frontend Session And Routing

### 10.1 Session model

Add `accountStatus` to auth types, in-memory session, refresh handling, and `useClientSession`. The frontend may read it immediately for navigation but still handles backend `403` because server status is authoritative.

Expose account capabilities through one helper/hook rather than repeated status checks:

```text
canAccessWorkspace
canCreateActivity
canTopUp
canWithdraw
canViewRestriction
```

`canWithdraw` additionally depends on restriction data and wallet status.

### 10.2 Route behavior

```text
Unauthenticated protected navigation
  -> /login with returnTo

Authenticated but missing role
  -> render AccessDeniedPage and preserve requested URL

SUSPENDED
  -> allow public, owned read-only workspace, wallet, and restriction routes
  -> block mutation controls

BANNED
  -> redirect normal protected routes to /account-restricted with replace

Unknown frontend URL
  -> NotFoundPage
```

Using history replacement for auth/restriction redirects prevents Back-button redirect loops. After successful login, a validated internal `returnTo` route restores the original destination; external URLs are rejected.

### 10.3 API error handling

- Request interceptor attaches the token as today.
- A `401` first attempts refresh. If refresh fails, clear session and let the route/auth flow navigate to login with `returnTo`.
- A page-level `403` renders the appropriate access/restriction surface.
- A mutation-level `403` preserves the current screen and displays the backend message.
- A `429` reads `Retry-After` when available, disables the triggering control, and shows retry timing.
- The interceptor does not globally turn every `400`, `409`, `422`, or `500` into a full-page redirect.

## 11. Error UI System

The deciding rule is contextual:

> Use a full error page when the user cannot continue the current screen. Use inline feedback, a banner, or a toast when only one action failed and the current screen remains useful.

### 11.1 Dedicated pages

- `NotFoundPage`: unknown frontend route.
- `AccessDeniedPage`: authenticated user lacks the required role/page permission.
- `UnexpectedErrorPage`: unhandled React render error or unrecoverable page load.
- `AccountRestrictedPage`: business-status resolution surface; not presented as a generic 403.

There is no dedicated `UnauthorizedPage`: protected navigation redirects to login. There are no dedicated pages for `400`, `409`, `422`, or `429`.

### 11.2 Reusable states

- `ResourceNotFoundState`: valid route but missing tournament, race, horse, blog, or user resource.
- `PageLoadErrorState`: page-critical API failed, with Retry and safe navigation.
- `InlineApiError`: form/action-level validation, conflict, rate-limit, or server error.

A mutation returning `500` uses inline feedback. A page-critical load returning `500` uses `PageLoadErrorState`. A render crash uses the application error boundary and `UnexpectedErrorPage`.

### 11.3 404 visual direction: “Off the Racing Line”

The 404 is a self-contained, single-viewport cinematic page aligned with the public “Night at the Races” theme:

- Existing local horse-racing image as background and poster/fallback.
- Near-black turf gradient, subtle grain, and track-rail lines.
- Giant Fraunces `404` in ivory with restrained gold glow.
- Hanken Grotesk for body/actions and Geist Mono for error metadata.
- Copy: “This page missed the starting gate.”
- Primary action: “Back to home”; secondary action: “Go back”.
- Lightweight brand bar and compact status footer; no six-column marketing footer.
- No third-party Helvetica download or remote Earth/hosting video.

Motion:

- 18-second background Ken Burns scale.
- Slow light sweep over the track overlay.
- Staggered entrance for eyebrow, title, description, and actions.
- `404` floats no more than 6–8 px.
- Arrow shifts about 3 px on CTA hover.
- `prefers-reduced-motion` removes decorative animation.

The other pages share the same family with different metaphors:

- 403: a locked starting gate; clear role and next action.
- 500: interrupted race-control signal; Retry and Back home.
- Account restricted: a restrained status dossier, with minimal decorative motion because the content is consequential.

## 12. Account Restricted Page

Route: `/account-restricted`.

Content hierarchy:

1. Status label (`SUSPENDED` or `BANNED`) and plain-language title.
2. Public reason and decision timestamp.
3. A “What you can still do” capability list.
4. Wallet card: balance, wallet status, withdrawal eligibility, transaction-history link.
5. Existing activity/history links available for the current status.
6. Appeal/contact action and logout.

The page must never reveal internal notes. Suspended copy explains review and blocked new activity. Banned copy explains that participation has ended while financial records and resolution actions remain available.

## 13. Admin Enforcement UI

The admin user-detail page receives a dedicated Account Enforcement section:

- Current account status and wallet status.
- Contextual action buttons based on valid transitions.
- Status history timeline showing actor, time, transition, and public reason.
- Internal notes visible only inside admin detail/history.

Modal behavior:

- Suspend modal: required public reason, optional internal note, wallet-lock checkbox.
- Restore modal: required conclusion and explicit note that wallet remains unchanged.
- Ban modal: danger styling, final reason, typed/explicit confirmation, no direct action from `ACTIVE`.
- Reopen modal: required reason; explains the result is `SUSPENDED`, not `ACTIVE`.
- Submit is disabled while pending; API conflict/error remains inside the modal.

## 14. Route And Page Cleanup

The routing cleanup included in implementation is:

- Replace catch-all `<Navigate to="/" replace />` with `NotFoundPage`.
- Standardize missing authentication to `/login` with `returnTo`; do not redirect to home.
- Replace admin-only and inline role-denial variants with shared `AccessDeniedPage`.
- Remove unused `RoleDashboardPage` and its test.
- Remove unused `RequireRefereeRoute` and its test; `RequireRoleRoute` remains the shared role guard.
- Remove `AdminForbiddenPage` after migration to the shared page.
- Remove `AdminPlaceholderPage` and placeholder-only frontend routes `/admin/participants`, `/admin/standings`, `/admin/races`, and `/admin/settings` until real screens exist. Unknown direct visits then receive the truthful 404 page.

Backend `/api/v1/admin/races` endpoints are not removed by this frontend cleanup.

## 15. Testing Strategy

### Backend

- Authentication tests for active, suspended, banned, pending-verification, inactive, deleted, and invalid credentials.
- JWT request uses current database status, including status changes after token issuance.
- Transition tests for every valid and invalid edge.
- Self-action and last-admin protection tests.
- Suspended user can read owned history but cannot create new business activity.
- Banned user can access only allowlisted resolution/wallet endpoints.
- Wallet-active suspended/banned user may request an eligible withdrawal.
- Wallet-locked user cannot initiate withdrawal/top-up/wager.
- Locked wallet still accepts idempotent payout/refund credits.
- Status change, history write, and optional wallet lock are atomic.
- Internal note is absent from user-facing responses.
- Account suspension does not mutate participant, assignment, race, or result status.
- An ongoing race remains intact after account suspension; explicit disciplinary action is required for scratch/disqualification.
- Organizer/referee actors cannot invoke global account or wallet enforcement endpoints.

### Frontend

- Unknown URL renders 404 and does not redirect home.
- Unauthenticated protected route redirects to login and returns after successful login.
- Authenticated missing-role user sees 403 while URL is preserved.
- Banned account is routed to the restricted page without a Back-button loop.
- Suspended account sees read-only data and no enabled mutation controls.
- Backend mutation `403` remains on the current page and shows its message.
- Refresh failure clears the session and triggers the login flow.
- Error boundary renders 500 UI.
- Resource 404 and page-load failure render their contextual states.
- Error pages meet keyboard, focus, contrast, semantic-heading, and reduced-motion requirements.
- Admin enforcement modal validates reason, prevents duplicate submit, and renders transition conflict inline.
- Admin sees a clear active-assignment warning without language implying automatic disqualification.

## 16. Delivery Order

1. Shared error components/pages and application error boundary.
2. Route-guard normalization and dead/placeholder page cleanup.
3. Account-status audit model and explicit admin transition API.
4. Account-aware authentication principal and centralized authorization policy.
5. Wallet lock semantic refinement.
6. Auth/session response changes and frontend account capabilities.
7. Account Restricted page and workspace mutation gating.
8. Admin enforcement controls and status-history timeline.
9. Integration, route, accessibility, and reduced-motion verification.

## 17. Acceptance Criteria

- Admin can suspend an active user with a reason and optional wallet lock.
- Admin can restore or ban a suspended user and reopen a banned case to suspended.
- Every status transition is auditable and protected from self-action/last-admin loss.
- Suspended users authenticate, view existing records, receive payouts/refunds, and cannot create new activity.
- Banned users cannot enter role workspaces but can use the restricted resolution surface.
- Wallet lock, not account ban alone, controls withdrawal eligibility.
- Locked wallets retain system-originated payout/refund credits.
- Banning an account never transfers the whole wallet balance to the platform or organizer.
- Platform Admin alone controls global account status and wallet lock; organizer/referee penalties remain tournament-scoped.
- Suspending or banning a user never automatically scratches/disqualifies a participant or rewrites a race result.
- An ongoing race can finish and be recorded while a separate account investigation continues.
- Backend returns consistent 401/403/409 semantics and stable error codes.
- Frontend unknown routes show a branded 404; missing roles show shared 403; unrecoverable UI failures show 500.
- Action-level conflicts, validation errors, rate limits, and server failures stay in context rather than forcing an error-page navigation.
- Error UI uses the existing horse-racing design tokens, local asset, restrained motion, and reduced-motion fallback.
