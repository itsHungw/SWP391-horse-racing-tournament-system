# Role Dashboard Participation Design

## Status

Approved for implementation from the brainstorming session on 2026-06-28.

## Problem

The current project already stores multiple active roles per user through `user_roles`, and the access token exposes a `roles` array. However, the current role request policy treats owner, jockey, and referee as mutually exclusive "specialist roles". That blocks the target product model:

- A personal user can hold multiple global personal roles.
- The same user chooses one role context when working from a dashboard.
- In one tournament, the same user can have only one active participation role.
- Organizer is a business workspace and must stay separate from personal participation roles.

The UI should not force users into a dashboard immediately after login. Authenticated users should remain able to browse the public site, then use the profile pill dropdown to enter or switch dashboard context.

## Terms

Global role:
An account-level permission/license such as `HORSE_OWNER`, `JOCKEY`, `REFEREE`, `SPECTATOR`, or `ORGANIZER`.

Personal role:
One of `HORSE_OWNER`, `JOCKEY`, or `REFEREE`. A personal account may hold multiple personal roles.

Business role:
`ORGANIZER`. This belongs to a business/organization lane, not the personal competition lane.

Workspace context:
The dashboard selected from the profile pill dropdown. It controls which workflow the user enters, but it is not the source of authorization.

Tournament participation role:
The user's active business relationship to one tournament, inferred from existing records:

- Owner: active `TournamentRegistration`.
- Jockey: active `JockeyTournamentApplication` or active `TournamentParticipant`.
- Referee: active `RefereeContract`.

## UX Design

After login, the user stays in the public site shell. The header profile pill remains compact and money-first:

```text
Profile pill
- Avatar / initials
- User name
- Wallet balance
```

The profile dropdown contains the workspace switcher. It shows the current dashboard choice first and expands only when the user wants to switch:

```text
Profile dropdown
- Wallet balance
- Personal dashboard
  - Current dashboard row
  - Expand: other personal dashboards
  - Expand: business/platform workspaces when available
```

Only roles present in the session should be shown as enabled dashboard targets. `SPECTATOR` is always available for authenticated users.

For users with one personal role, the dropdown still exists but can feel lightweight: "Open Owner Dashboard" plus public account links.

For users with multiple personal roles, the dropdown clearly shows the current or last-used workspace. Selecting a dashboard navigates immediately:

- `HORSE_OWNER` -> `/owner/dashboard`
- `JOCKEY` -> `/jockey/dashboard`
- `REFEREE` -> `/referee/dashboard`
- `ORGANIZER` -> `/organizer`

The app should not use an interstitial dashboard selector page for normal login. A future first-run selector is optional, but not part of this implementation.

## Backend Authorization Design

Backend remains the source of truth.

### Global Role Policy

`HORSE_OWNER`, `JOCKEY`, and `REFEREE` are no longer mutually exclusive. A user can request and hold any combination of those personal roles.

Pending role requests should only block duplicate pending requests for the same role, not all specialist roles.

`ORGANIZER` is separate. This implementation keeps the organizer application route separate and does not add `ORGANIZER` to the personal role request page. Backend should also reject personal role requests when a user already has active `ORGANIZER`.

### Tournament Participation Guard

Add a focused service that answers:

```text
Does this user already have an active participation role in this tournament?
```

The guard should be called before creating or activating tournament participation:

- Before owner creates or resubmits a tournament registration.
- Before jockey creates or resubmits a pool application.
- Before organizer sends a referee contract.
- Before referee accepts a contract.

Active states:

- Owner: `TournamentRegistration.status in (PENDING, APPROVED)`.
- Jockey: `JockeyTournamentApplication.status in (PENDING, APPROVED_FOR_POOL)` or `TournamentParticipant.status = ACTIVE`.
- Referee: `RefereeContract.status = ACTIVE`.

Pending referee contracts do not block the referee from choosing another role. If the user later tries to accept the referee contract, the accept action must re-check and block if they already joined that tournament through owner or jockey.

Inactive states do not block a later role choice:

- Owner: `REJECTED`, `WITHDRAWN`.
- Jockey application: `REJECTED`, `WITHDRAWN`.
- Referee contract: `DECLINED`, `TERMINATED`, `PENDING`.
- Tournament participant: `WITHDRAWN`, `DISQUALIFIED`.

The guard must allow the same role flow to continue for the same existing participation. For example, an owner resubmitting a rejected owner registration is allowed because rejected is inactive; an owner withdrawing their own pending registration remains governed by the existing owner flow.

## Error Handling

When a conflict is detected, return HTTP `409 CONFLICT`.

Message shape can use existing `ResponseStatusException` handling:

```text
You are already participating in this tournament as JOCKEY. Use that dashboard or leave that participation before joining with another role.
```

The frontend should display the backend message in existing error alert surfaces. No new global error framework is needed.

## Frontend Design

Update `ClientHeader` to replace the current single-purpose role shortcut with a profile pill dropdown.

Required behavior:

- Show public nav as today.
- If unauthenticated: keep existing login/register CTAs.
- If authenticated: show a compact profile pill with user name and wallet balance.
- Dropdown shows the current dashboard target first; available alternatives stay collapsed until the user opens the workspace selector.
- Expanded workspace choices are based on `session.roles`.
- Organizer appears under a separate "Business workspace" group.
- Selecting a target navigates to the matching dashboard route.
- Keep dashboard route guards as defense in depth.

Do not make owner routes public-auth-only if the user lacks `HORSE_OWNER`. Owner dashboard and owner tournament registration should require owner role after this change.

Persisting the selected workspace is nice but not required for the first implementation. If implemented, store it in `localStorage` as a UI preference only; backend authorization still uses roles and participation guards.

## Data Flow

```text
Login / refresh
-> JWT contains active global roles
-> ClientHeader renders dashboard targets
-> User selects a dashboard from profile pill
-> Dashboard flow calls existing API
-> Backend role guard checks global role
-> Backend participation guard checks tournament conflict
-> Existing domain record is created or activated
```

## Testing Strategy

Backend tests:

- Role requests allow a user with active `JOCKEY` to request `HORSE_OWNER`.
- Pending `JOCKEY` request does not block `REFEREE` request.
- Active `ORGANIZER` blocks personal role requests.
- Owner registration is blocked when the user already has an active jockey application in the same tournament.
- Jockey application is blocked when the user already has an active owner registration in the same tournament.
- Referee contract acceptance is blocked when the user already has active owner or jockey participation.

Frontend tests:

- Public header shows profile pill for authenticated users.
- Multi-role user sees Owner, Jockey, Referee dashboard targets.
- Organizer appears in a separate business group.
- Selecting Owner navigates to `/owner/dashboard`; selecting Jockey navigates to `/jockey/dashboard`.
- Owner routes require `HORSE_OWNER`, matching other role workspaces.

## Non-Goals

- No new generic `tournament_role_participations` table in this slice.
- No new role selector page after login.
- No redesign of all dashboards.
- No migration that rewrites historical participation records.
- No change to spectator prediction eligibility.
