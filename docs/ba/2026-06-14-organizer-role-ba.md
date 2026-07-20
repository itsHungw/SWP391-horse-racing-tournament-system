# BA - Organizer Role And Workspace

Updated: 2026-06-29
Status: source-aligned as-built specification

## 1. Business Context

The system separates platform governance from tournament operation.

- Admin is the platform governor: reviews identities, roles, organization applications, tournament launch approval, withdrawals, and audit surfaces.
- Organizer is a business account: owns an organization and operates that organization's tournaments.
- Owners, jockeys, and referees are personal participation roles: they participate in tournaments.
- Spectators are public/authenticated users who read content and place prediction wagers.

MVP organization structure is intentionally simple: one organizer account owns one organization record. No organization staff hierarchy is implemented.

## 2. Actors

| Actor | Responsibility | How account gets access |
| --- | --- | --- |
| Admin | Platform governance and audit | Seeded/assigned by platform |
| Organizer | Operate tournaments for one organization | Submit organization application, admin approves, `ORGANIZER` role is granted |
| Horse owner | Own horses and register them into tournaments | Submit role request, admin approves `HORSE_OWNER` |
| Jockey | Apply to tournament pools and accept owner contracts | Submit role request, admin approves `JOCKEY` |
| Referee | Accept organizer contracts and operate assigned races | Submit role request, admin approves `REFEREE` |
| Spectator | Read content and place wallet-backed predictions | Authenticated user role/session |

## 3. Core Business Decisions

- Organizer is a business workspace, not a fourth personal participation role.
- One user account may hold multiple personal roles globally.
- One user account may not mix active organizer role with active personal participation roles.
- A user with active personal roles cannot register or be approved for an organization workspace.
- An organizer account cannot request owner, jockey, or referee roles.
- A user can participate in the same tournament as only one personal role: horse owner, jockey, or referee.
- Organizer itself is not counted as a tournament participation role.

## 4. Organization Lifecycle

```text
PENDING -> ACTIVE
PENDING -> REJECTED
ACTIVE -> SUSPENDED
SUSPENDED -> ACTIVE
REJECTED -> PENDING
```

Business rules:

- `PENDING`: submitted and waiting for admin KYB review.
- `ACTIVE`: approved; owner account receives `ORGANIZER` role.
- `REJECTED`: admin rejected with reason; resubmission reuses the same organization row.
- `SUSPENDED`: admin temporarily blocks the organization.
- A unique active-owner index enforces one organization record per owner account.

Source mapping:

- `organization/controller/OrganizationController.java`
- `organization/controller/AdminOrganizationController.java`
- `organization/service/OrganizationService.java`
- `db/migration/V7__organizer_schema.sql`
- `db/migration/V8__organizer_kyb_idempotency.sql`

## 5. Organizer Workspace

Frontend routes:

- `/organizer`
- `/organizer/tournaments`
- `/organizer/tournaments/new`
- `/organizer/registrations`
- `/organizer/schedule`
- `/organizer/officials`
- `/organizer/results`
- `/organizer/profile`
- `/organizer/organization`

Backend API groups:

- `/api/v1/organizations`
- `/api/v1/admin/organizations`
- `/api/v1/organizer/tournaments`
- `/api/v1/organizer/tournaments/{tournamentId}/...`
- `/api/v1/organizer/races`
- `/api/v1/organizer/referees`
- `/api/v1/organizer/tournaments/{tournamentId}/referee-contracts`

## 6. Tournament Operation Gates

### Gate 1 - Organization onboarding

Admin approves/rejects the organization application. Approval grants `ORGANIZER`.

### Gate 2 - Tournament launch approval

Organizer creates and submits a tournament. Admin can approve/reject submitted tournaments through admin tournament endpoints.

### Gate 3 - Result publication

Referee submits race results. Organizer can confirm, reopen, or publish results through organizer race endpoints.

## 7. Participation Role Constraint

A user can hold multiple global personal roles, but must choose one role when joining a specific tournament.

Active participation detection:

- Owner: tournament registration status `PENDING` or `APPROVED`.
- Jockey: pool application status `PENDING` or `APPROVED_FOR_POOL`, or active locked participant.
- Referee: active referee contract for that tournament.

If a user already has active participation in the same tournament under a different role, backend returns conflict.

Source mapping:

- `tournament/service/TournamentParticipationGuardService.java`
- `tournament/enums/TournamentParticipationRole.java`
- `tournamentregistration/service/TournamentRegistrationService.java`
- `championship/service/JockeyPoolApplicationService.java`
- `championship/service/RefereeContractService.java`

## 8. UX Contract

- Authenticated users always keep access to public pages.
- The profile pill shows wallet balance and a dashboard selector.
- Current dashboard appears first in the dropdown.
- Personal dashboards are grouped together.
- Organizer dashboard is listed separately when the account has `ORGANIZER`.
- Users without organizer role can enter the organizer registration flow.
- Users with multiple personal roles can switch dashboard context without changing account.

## 9. Source-Aligned Gaps And Risks

- Organization staff/member hierarchy is not implemented.
- Suspension behavior exists at organization status level; any deeper cascade policy should be verified before promising automatic tournament freezes.
- Organizer payout, prize purse escrow, and platform commission are not implemented as accounting workflows.
- Referee fee terms are not represented as money fields on `referee_contracts`.
- Admin routes for some tournament operations still exist alongside organizer routes; demos should present organizer routes as the target business workflow.

## 10. Platform Enforcement Versus Tournament Discipline

- Only the platform admin controls global `SUSPENDED` and `BANNED` account states in the managed B2B2C model.
- Organizer and referee penalties remain scoped to their tournament, registration, assignment, incident, or result workflow.
- Global suspension does not automatically scratch a horse, disqualify a participant, cancel an assignment, stop an ongoing race, or rewrite a published result.
- If a competition consequence is required, the authorized organizer/referee must record it as a separate explicit and auditable decision under that tournament's policy.
