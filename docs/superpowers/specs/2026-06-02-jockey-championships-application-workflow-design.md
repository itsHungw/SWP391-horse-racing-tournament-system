# Jockey Championships Application Workflow Design

## Design Read

This is a jockey-facing championship workflow for a horse racing tournament platform. The current jockey workspace already has a professional sports-operations direction: dark emerald cockpit shell, white work surfaces, championship timeline, contract inbox, schedule calendar, and racing passport. The Championships page should now become the place where a jockey understands their current championship status, applies to open championships, and reviews past championship performance.

The design should avoid a generic CRUD tournament list. It should answer three jockey questions:

- Where am I now?
- What can I join?
- What have I achieved?

Design dials:

- DESIGN_VARIANCE: 5
- MOTION_INTENSITY: 3
- VISUAL_DENSITY: 6

## Scope

This spec covers the Jockey Championships workflow and its relationship to the tournament participant lifecycle:

- `JockeyChampionshipsPage`
- Jockey championship application states
- Jockey pool approval concept
- Relationship between approved jockey applications, owner contracts, and tournament participants
- Admin review surface needed to approve or reject jockey championship applications
- Owner-side eligibility rule for sending tournament assignment contracts

This spec does not implement the code yet. It defines the domain and UI structure before implementation.

## Domain Model

The championship flow should be separated into distinct business layers:

```text
Role Approval
->
Championship Application
->
Jockey Pool
->
Tournament Assignment Contract
->
Tournament Participant
->
Rounds
->
Results
->
Standing
```

Each layer has a different purpose:

| Layer | Meaning |
| --- | --- |
| Role Approval | User is allowed to access jockey workflows in the system. |
| Championship Application | Jockey asks to enter the pool for one championship. |
| Jockey Pool | Approved jockeys visible to owners for that championship. |
| Tournament Assignment Contract | Owner proposes a horse-jockey assignment for the full championship. |
| Tournament Participant | Official horse + jockey pair competing across all championship rounds. |
| Results | Round-level placement and points. |
| Standing | Aggregated championship ranking. |

`APPROVED_FOR_POOL` must not create a participant. A participant is created only after a jockey accepts a tournament assignment contract.

## Jockey Application Statuses

Use these statuses for the jockey's application to a championship:

```text
NOT_APPLIED
PENDING_REVIEW
APPROVED_FOR_POOL
REJECTED
WITHDRAWN
COMMITTED
```

UI labels:

| Status | UI Label | Meaning |
| --- | --- | --- |
| `NOT_APPLIED` | Not Applied | Jockey has not applied to this championship. |
| `PENDING_REVIEW` | Pending Review | Application has been submitted and is waiting for admin review. |
| `APPROVED_FOR_POOL` | Approved for Pool | Jockey is eligible to receive owner contracts for this championship. |
| `REJECTED` | Rejected | Admin rejected the application. Show reason when available. |
| `WITHDRAWN` | Withdrawn | Jockey withdrew the application before approval or commitment. |
| `COMMITTED` | Committed | Jockey accepted a contract and is assigned to a horse for this championship. |

Avoid using `Enrolled` in the UI because it suggests the jockey is already part of the tournament. The correct action is `Apply for Championship`.

## Eligibility Rules

Before a jockey can apply:

```text
Role = JOCKEY
Racing Passport Complete
Application Window Open
Not already approved in this championship
Not already committed in this championship
```

If eligibility fails, the UI should show a clear blocked state:

- Missing racing passport fields: CTA to `Complete Racing Passport`.
- Application window closed: disabled apply action.
- Already approved: show `Approved for Pool`.
- Already committed: show `Committed`.

## Approval Rules

Admin reviews jockey championship applications. The project currently has an `ADMIN` role and admin tournament management, so this spec uses admin review rather than adding a new organizer role.

Admin approval result:

- Approve: application becomes `APPROVED_FOR_POOL`.
- Reject: application becomes `REJECTED` with optional reason.

Once approved, the jockey appears in the owner-facing available jockey pool for that championship.

## Owner Contract Eligibility

Owner can send a tournament assignment contract only when:

```text
Horse Registration = APPROVED
Jockey Application = APPROVED_FOR_POOL
Tournament still allows assignment
Jockey not already committed in this championship
Horse not already assigned in this championship
```

Owner cannot invite jockeys who have not applied or have not been approved for the championship pool.

## Participant Formation

When a jockey accepts a tournament assignment contract:

```text
Approved Horse Registration
+
Approved Jockey Pool Application
+
Accepted Contract
=
TournamentParticipant
```

Participant rule:

```text
1 jockey = 1 horse = 1 championship
```

The same jockey cannot accept another contract in the same championship. The same horse cannot be assigned to another jockey in the same championship.

Other pending contracts in the same championship should become unavailable or conflict-blocked in the jockey contract inbox.

## Championships Page IA

The Jockey Championships page should use three product-oriented tabs:

```text
Overview
Open Championships
Championship History
```

Default tab: `Overview`.

Do not use `Current`, `All Championships`, or `My Applications` as primary tabs. Those names feel like data categories. The chosen tabs match the jockey's mental model:

- `Overview`: Where am I now?
- `Open Championships`: What can I apply to?
- `Championship History`: What have I achieved?

## Tab 1: Overview

Purpose: show the jockey's current championship situation.

Priority order:

1. Active Championship Hero
2. Assignment or Application Status
3. Contract Status
4. Current Standing
5. Next Round
6. Championship Journey
7. Quick actions

Committed state:

```text
Summer Championship 2026
Status: Committed
Horse: Thunder Bolt
Stable: Sunrise Stable
Rank: #3
Points: 42
Next Round: Belmont Stakes Presented

[Open Schedule]
[View Contract]
```

Approved for pool state:

```text
Approved for Pool
Waiting for assignment contract.

[View Contracts]
```

Contract status examples:

```text
Approved for Pool
Waiting for assignment contract
```

```text
Committed Assignment
Horse: Thunder Bolt
Stable: Sunrise Stable
Contract: summer-assignment-agreement.pdf
```

Pending review state:

```text
Application under review
Submitted May 21, 2026

Admin will review your racing passport and championship eligibility.
```

Rejected state:

```text
Application rejected
Reason: Racing passport is incomplete.

[Open Championships]
```

No active championship state:

```text
No active championship.
Apply to an open championship to enter the jockey pool and receive assignment contracts.

[Open Championships]
```

Championship Journey example:

```text
Application Approved [done]
Contract Committed [done]
Round 1 [done]
Round 2 [done]
Round 3 [done]
Round 4 Current
Round 5 Upcoming
```

The journey is the visual feature that makes this page feel like a sports championship product rather than a management table.

## Tab 2: Open Championships

Purpose: browse championships and apply to enter the jockey pool.

Controls:

- Search by championship name, track, or location.
- Filter by application status.
- Filter by open application window.
- Quick filters: Open, Closing Soon, Approved for Pool, Committed.

Card content:

```text
Summer Championship 2026
Belmont Park
Jun 1 - Aug 20, 2026
8 rounds
Application closes May 24, 2026
Jockey Pool: 12 / 20

Requirements
[done] Jockey role approved
[done] Racing Passport complete
[done] Application window open

[Apply for Championship]
```

Status-specific card actions:

| Application State | Card Action |
| --- | --- |
| `NOT_APPLIED` | `Apply for Championship` |
| `PENDING_REVIEW` | Disabled `Pending Review` |
| `APPROVED_FOR_POOL` | `Approved for Pool`, optional `View Contracts` |
| `REJECTED` | `View Feedback`, optional reapply only if business allows later |
| `WITHDRAWN` | `Apply Again` if application window is open |
| `COMMITTED` | `View Schedule` |

Apply interaction:

- Open a confirmation drawer or modal.
- Show eligibility checklist.
- Optional application note textarea.
- Submit action label: `Submit Application`.

Do not make a single-click `Enroll` action.

## Tab 3: Championship History

Purpose: show past championship outcomes and career credibility.

Top summary:

```text
Championships Joined
Championships Won
Best Rank
Total Points
Win Rate
Top 3 Rate
```

History list item:

```text
Spring Cup 2026
Rank #1
58 pts
Horse: Golden Arrow
Stable: Sunrise Stable
2 wins
5 top 3
```

History should be compact. Avoid oversized cards for every past championship.

## Admin Review Surface

Admin tournament detail should eventually include a tab:

```text
Jockey Applications
```

Admin sees:

- Jockey name
- Racing passport completeness
- Career record summary
- Applied championship
- Submitted date
- Application note
- Conflict status
- Current application status

Actions:

```text
[Approve for Pool]
[Reject]
```

Reject should support a reason so the jockey can understand what to fix.

## Owner Jockey Pool Surface

Owner should only see jockeys approved for the selected championship.

Pool item should include:

- Jockey name
- Years experience
- Official starts
- Wins
- Top 3 rate
- Weight
- Height
- Current availability

Owner action:

```text
[Send Contract]
```

This action opens the Tournament Assignment Contract flow, including horse selection, owner message, and optional agreement PDF.

## UI Direction

Use the existing jockey workspace visual language:

- Dark emerald cockpit shell.
- White operational surfaces.
- Emerald primary actions.
- Amber pending review states.
- Red rejected or destructive states.
- Slate neutral metadata.
- No gradient backgrounds.
- Use opacity racing imagery only where it supports hierarchy.
- Use `rounded-md` for controls and `rounded-lg` for grouped surfaces.

The Championships page should feel like a sports career cockpit, not an admin tournament browser.

## Accessibility

The tab control should be keyboard-accessible and use clear active state semantics.

Requirements:

- Tabs should expose selected state.
- Application buttons must have clear accessible names.
- Rejected and blocked states should be announced with inline status text.
- Disabled actions need visible explanations.
- Focus rings must remain visible on all interactive elements.

## Testing And Verification

Focused tests should cover:

- Default tab is `Overview`.
- Committed overview shows championship, horse, stable, standing, next round, and journey.
- Committed overview shows contract status.
- No active championship state shows CTA to open championships.
- Open Championships tab shows `Apply for Championship`, eligibility checklist, filters, and application status.
- Applying changes UI to `Pending Review` in local UI state or mock state.
- Approved for pool state does not create a participant.
- History tab shows career summary and compact championship results.

Verification commands:

```bash
npm test -- --run
npm run build
```

## Non-Goals

- No new role such as `ORGANIZER` in v1.
- No public jockey marketplace.
- No earnings, fees, or payment logic.
- No drag-and-drop scheduling.
- No automatic participant creation from pool approval.
- No race-by-race jockey assignment.
- No changing the existing role request flow.
- No replacing the existing contract inbox design.

## Open Implementation Notes

Backend implementation can start with a simple admin-reviewed `JockeyChampionshipApplication` model. If backend scope is not ready yet, the frontend can first represent the flow with mock data while preserving the final statuses and UI labels.

Potential backend entities:

- `JockeyChampionshipApplication`
- `TournamentParticipant`
- `TournamentAssignmentContract`
- `RaceResult`
- `TournamentStanding`

The first implementation slice should focus on the Championships page UI and application state model before building the full participant and standing backend.
