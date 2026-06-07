# Jockey Championship Workspace UI Design

## Design Read

This is a professional jockey-facing workspace for a championship-style horse racing tournament system. The audience is approved jockeys who enroll into tournament pools, review owner assignment contracts, commit to a horse for a championship, and track race rounds, standings, and official results.

The workspace should feel like a premium sports operations cockpit, not a generic admin dashboard and not a marketing page.

Design dials:

- DESIGN_VARIANCE: 6
- MOTION_INTENSITY: 3
- VISUAL_DENSITY: 7

## Domain Model

The jockey workspace follows a championship/season model:

```text
Tournament = Championship / Season
Jockey Enrollment = jockey enters the tournament pool
Tournament Assignment Contract = owner invites jockey from the pool
Committed Assignment = jockey accepts and commits to a horse for the championship
Tournament Participant = Horse + Jockey pair
Race = round inside the championship
Race Result = points and position for one round
Tournament Standing = accumulated points across all rounds
```

Primary flow:

```text
Jockey enrolls tournament
Owner invites from enrolled pool
Jockey reviews tournament assignment contract
Accept = committed assignment
Horse + Jockey becomes tournament participant
Participant competes across all rounds
Points accumulate into standings
```

## Scope

Build or redesign the jockey workspace around these pages:

- `JockeyLayout`
- `JockeyDashboardPage`
- `JockeyChampionshipsPage`
- `JockeyContractsPage`
- `JockeySchedulePage`
- `JockeyProfilePage`

Routes:

- `/jockey/dashboard`
- `/jockey/championships`
- `/jockey/contracts`
- `/jockey/schedule`
- `/jockey/profile`

Navigation labels:

- Dashboard
- Championships
- Contracts
- Schedule
- Racing Passport

Terminology note:

- Backend/domain code can keep `Tournament` where that is already established.
- Jockey-facing UI should present the same object as `Championship` because the experience is season/standing/round based.
- `Contracts` replaces `Invitations` because the page is about reviewing and committing to tournament assignment terms, not casual race invites.

## Visual System

Use the existing emerald racing brand, but make the jockey workspace visually distinct from the owner workspace.

Core rules:

- Use real racetrack or horse racing imagery as low-opacity atmosphere.
- Use a track map motif as a 3-5% opacity watermark where a surface needs domain texture.
- Do not use gradient backgrounds.
- Use image opacity plus solid overlays for depth.
- Keep main work areas white or light neutral.
- Use emerald as the primary accent.
- Use amber for pending/attention states.
- Use blue for upcoming/assigned states.
- Use green/neutral for completed/published states.
- Use red only for rejected, cancelled, expired, or destructive states.
- Keep controls compact and workspace-like.
- Avoid oversized marketing heroes, generic bento grids, and AI-style purple/blue glow.

Recommended surface language:

- Sidebar: dark emerald base, racetrack image or oval track-map motif at 8-16% opacity, dark solid overlay.
- Main content: `bg-slate-50`, white panels, thin slate borders.
- Cards: use only where they represent real objects such as contracts, tournament enrollments, race rounds, or record summaries.
- Radius: `rounded-md` for controls, `rounded-lg` for grouped surfaces.

## Jockey Layout

The layout should provide a stable cockpit for the role.

Sidebar content:

- Aqueduct/Racing brand mark.
- Small `Racing Cockpit` label.
- Jockey identity block with avatar, display name, role label, and availability badge.
- Navigation links.
- Mini `Career Record` summary at the bottom when data exists.

Mobile:

- Collapse sidebar into a compact top/horizontal navigation.
- Keep route labels unchanged.
- Do not hide critical actions such as contract accept/reject.

## Dashboard

The dashboard should answer:

- What championship am I committed to?
- What is my next round?
- Do I have pending contracts?
- How am I performing?

### Current Championship Hero

The first surface should be a championship hero, not a row of generic metric cards.

Content:

- Championship selector, such as `Summer Championship`.
- Current championship name.
- Participant pair: `Horse + Jockey`.
- Stable/owner name.
- Current rank.
- Current points.
- Gap to leader.
- Next round.
- Time until next round when available.
- CTA: `View Schedule`.

Use a low-opacity racetrack image background with a solid overlay. Do not use gradient background.

Do not use generic copy such as `Welcome Back`. The hero identity should be `Current Championship`.

If the jockey has multiple active or enrolled championships, show a compact championship selector in the hero header:

```text
Summer Championship
```

The selector changes the hero, standing widget, progress timeline, and schedule preview context.

Empty state:

```text
No active championship.
Enroll in an open championship to become visible to stable owners and receive assignment contracts.
```

### Current Standing

Add a dedicated standing widget beside or directly below the hero.

Fields:

- Current Rank, such as `#3`.
- Points.
- Gap To Leader, such as `-8 pts`.
- Rounds Completed, such as `3 of 8`.
- Standing status:
  - Leading.
  - In podium range.
  - Chasing points.
  - Unranked.

This widget is what makes the dashboard feel like a championship cockpit instead of assignment management.

### Championship Progress

Treat the championship progress timeline as a hero feature, not a small secondary widget.

Show a horizontal or stepped season progress timeline:

Use `Round` labels in the UI, not `Race` labels, because each race is a championship round from the jockey's point of view.

```text
Round 1 - Finished - 1st - 10 pts
Round 2 - Finished - 2nd - 8 pts
Round 3 - Finished - 4th - 4 pts
Round 4 - Next Race
Round 5 - Locked
```

Each round should show status:

- Finished
- Current / Next
- Upcoming
- Locked
- Cancelled

Clicking a round opens the shared race detail drawer.

### Metrics

Show compact metrics below the hero:

- Pending Contracts
- Active Championships
- Upcoming Rounds
- Top 3 Rate

### Dashboard Previews

Show concise previews:

- Contract preview, max 3.
- Upcoming rounds, max 3.
- Career Record summary.

## Championships

Route: `/jockey/championships`

Purpose: jockey enrolls into championship pools so owners can invite them.

Tabs:

- Open Enrollment
- My Championships

### Open Enrollment

Championship card content:

- Championship name.
- Track/location.
- Season dates.
- Number of rounds.
- Enrollment deadline.
- Enrollment status.
- CTA: `Enroll`.

Statuses:

- Open Enrollment
- Enrolled
- Withdrawn
- Enrollment Closed

After enrollment, show:

```text
Enrolled
Owners can now invite you for this championship.
```

### My Championships

Championship card content:

- Championship name.
- Commitment status.
- Horse.
- Stable/owner.
- Current rank.
- Points.
- Next round.
- CTA: `View Schedule`.

Commitment statuses:

- Enrolled
- Contract Pending
- Committed
- Withdrawn
- Completed

## Contracts

Route: `/jockey/contracts`

Purpose: jockey reviews owner assignment contracts and commits or declines.

The page should use the wording:

```text
Tournament Assignment Contract
```

not "race invitation" and not "legal contract".

### Contract Card

Card content:

- Owner/stable name.
- Horse.
- Championship.
- Number of rounds.
- Season duration.
- Owner message.
- Assignment terms summary.
- Agreement PDF attachment when available.
- Response deadline.
- Status.
- Actions: `Accept Contract`, `Reject`.

Example:

```text
Contract from Sunrise Stable

Horse: Thunder Bolt
Tournament: Summer Championship 2026
Rounds: 8
Season: Jun 1 - Aug 20

Assignment Terms
Expected participation: All championship rounds
Reserve rider allowed: No

Agreement PDF
View PDF
```

### Contract Detail Drawer

Clicking a contract opens a drawer or modal.

Sections:

- Assignment: horse, championship, rounds, season dates.
- Stable: owner/stable information.
- Owner Message.
- Assignment Terms.
- Agreement Attachment.
- Decision controls.

Accepting creates a `Committed Assignment`.

Rejecting should support a response note/reason.

### Conflict Rule

Because this is a championship model, conflict is tournament-level:

```text
One jockey can commit to one horse per championship.
```

If the jockey already committed to another horse in the same championship:

- Disable `Accept Contract`.
- Show:

```text
You already committed to another horse in this championship.
```

## Schedule

Route: `/jockey/schedule`

This is the primary visual showcase page.

Top controls:

- Title: `Schedule`.
- Subtitle: `View championship rounds, upcoming races, and official results`.
- View switch:
  - Championship Timeline
  - Calendar
  - List
  - Completed
- Month navigation:
  - Previous
  - Today
  - Next
- Optional filters:
  - Championship
  - Status

### Calendar View

Calendar view should be a secondary schedule mode.

Calendar is useful, but it should be a schedule view, not the identity of the module. The domain-specific flagship view is `Championship Timeline`.

Design:

- 7-column grid.
- Day cells with date numbers.
- Today highlighted.
- Race/round cards inside day cells.
- Low visual noise, strong readable hierarchy.

Event card content:

- Race/round name.
- Time.
- Championship short name.
- Horse.
- Status badge.

Example:

```text
Race 4       11:00 AM
Belmont Stakes
TODAY
Your Ride: Thunder Bolt
```

If multiple races occur on one day:

- Show first 2.
- Then show `+2 more`.
- Clicking `+ more` opens a day list modal.

No drag/drop.
No editing dates.

### List View

Group by time:

- Today
- This Week
- Later

Race row/card content:

- Race/round name.
- Championship.
- Date/time.
- Horse.
- Stable/owner.
- Status.

Clicking opens the shared race detail drawer.

### Championship Timeline

Show the current championship as a vertical or horizontal round timeline.

This should be the flagship schedule view because it communicates the F1-style season model better than a standard calendar.

Default Schedule view:

```text
Championship Timeline
```

Example:

```text
Summer Championship 2026

Round 1
Finished - 2nd - 8 pts

Round 2
Finished - 1st - 10 pts

Round 3
Finished - 3rd - 6 pts

Round 4
Upcoming - Jun 20

Round 5
Locked
```

Default to this view when the jockey has one active committed championship. If there are multiple active championships, ask the user to choose one through a compact championship selector.

### Completed View

Show only rounds with official published results.

Fields:

- Race/round name.
- Championship.
- Date.
- Horse.
- Position.
- Points.
- Result status.

Empty state:

```text
No published race results yet.
```

## Race Detail Drawer

Use one shared drawer for calendar, list, timeline, and dashboard progress clicks.

Content:

- Race/round name.
- Championship.
- Round number, such as `Round 4 of 8`.
- Horse.
- Stable/owner.
- Date/time.
- Track/location.
- Status.
- Result section when published:
  - Position.
  - Points.
  - Result status.
- Assignment timeline:
  - Enrolled
  - Contract Accepted
  - Committed
  - Race Day
  - Result Published

No edit actions from this drawer.

## Racing Passport

Route: `/jockey/profile`

The page title should be:

```text
Racing Passport
```

Do not use generic "Profile" as the visible page identity.

Sections:

- Rider Profile
- Career Record
- Current Championship Assignment
- Championship Archive

### Rider Profile

Editable fields:

- Display Name.
- Avatar.
- Height.
- Weight.
- Years Experience.
- Riding Style.
- Bio.
- Availability:
  - Available
  - Busy
  - Unavailable

### Career Record

Definition:

```text
Career Record = summary of official published race results for the current jockey.
```

It is race-based, not tournament-level ranking.

Metrics:

- Official Starts.
- Wins.
- Top 3 Finishes.
- Top 3 Rate.
- Championships Joined.
- Championships Won.

Top 3 Rate:

```text
Top 3 Finishes / Official Starts
```

If Official Starts is zero, show `0%`.

### Current Championship Assignment

Show when the jockey has an active committed championship.

Fields:

- Stable.
- Horse.
- Championship.
- Commitment Status.
- Committed since.

This assignment is championship-specific because a jockey can change stable or horse between championships.

### Championship Archive

Show the latest three completed championships as a compact record strip.

Fields:

- Championship name.
- Final rank.
- Total points.
- Horse.
- Stable.

Example:

```text
Summer Championship 2026
Rank #3 - 42 pts

Spring Cup 2026
Rank #1 - 58 pts

Autumn Cup 2025
Rank #4 - 31 pts
```

No separate archive page in this scope.

## Data And API Shape

Suggested frontend API module:

```text
jockeyApi.ts
```

Suggested functions:

- `getJockeyDashboard()`
- `getOpenJockeyChampionships()`
- `getJockeyChampionshipEnrollments()`
- `enrollJockeyChampionship(tournamentId)`
- `withdrawJockeyChampionshipEnrollment(enrollmentId)`
- `getJockeyContracts()`
- `acceptJockeyContract(contractId, payload?)`
- `rejectJockeyContract(contractId, payload?)`
- `getJockeySchedule(params?)`
- `getJockeyProfile()`
- `updateJockeyProfile(payload)`

Suggested backend additions:

```text
jockey_tournament_enrollments
- id
- tournament_id
- jockey_id
- status: ENROLLED / WITHDRAWN
- created_at
- updated_at
```

Extend `jockey_invitations` for championship contracts:

```text
tournament_id
terms_summary
agreement_url
agreement_file_name
agreement_uploaded_at
response_deadline
accepted_at
rejected_at
```

If keeping the existing `race_id` column temporarily, do not expose race-level invitation wording in the UI. The UI language should be championship assignment.

If an existing `jockey_invitations` table already exists, it can remain as persistence for the first implementation. The frontend-facing API and UI naming should still use `contracts`.

## Testing

Focused tests should cover:

- Dashboard renders current championship hero.
- Dashboard renders championship progress.
- Dashboard renders current standing.
- Championships page enrolls and withdraws.
- Contracts page renders tournament assignment contracts.
- Contract conflict disables accept.
- Accept contract changes status to committed.
- Reject contract submits response note.
- Schedule calendar renders round cards.
- Clicking a round opens race detail drawer.
- Schedule defaults to Championship Timeline.
- Schedule switches Timeline/Calendar/List/Completed.
- Racing Passport loads and saves rider profile.
- Career Record handles zero official starts.

## Non-Goals

Do not implement:

- Fee negotiation.
- Legal e-signature.
- Marketplace bidding.
- Public followers.
- Social profile.
- Jockey global ranking.
- Earnings.
- Heavy analytics charts.
- Drag/drop calendar.
- Public jockey page.
- Betting or odds.

## Implementation Notes

- Reuse existing React, Vite, Tailwind v4, and lucide stack.
- Do not add a calendar dependency unless native implementation becomes too costly.
- Prefer native month grid for the calendar MVP.
- Use real racing imagery with opacity, not gradient backgrounds.
- Prefer subtle track-map watermarks over decorative glow effects.
- Keep business wording consistent: Championship, Round, Tournament Assignment Contract, Committed Assignment, Racing Passport.

## Implementation Priority Order

Build the UI around the domain-specific championship experience in this order:

1. Current Championship Hero.
2. Current Standing.
3. Championship Timeline.
4. Contract Cards.
5. Race Detail Drawer.
6. Calendar.
7. Racing Passport.

Do not let the implementation collapse back into a generic layout of metric cards, tables, and forms. The first impression should be championship participation and progress, not CRUD management.
