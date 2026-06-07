# Admin Championship Progressive Disclosure UX Design

## Design Read

This is an admin-facing championship operations workspace for a horse racing tournament system. The audience is tournament administrators who need to operate a championship season without being forced to learn every module first. The UI should feel like a professional operations cockpit: state-first, action-first, and strongly tied to the current championship context.

The core product direction is:

- Championship-centric admin UX
- Command Center first
- Progressive disclosure
- Action before navigation

Design dials:

- DESIGN_VARIANCE: 4
- MOTION_INTENSITY: 2
- VISUAL_DENSITY: 7

## Goal

Turn admin tournament management into a Championship Operations Platform where a first-time admin can open a championship and understand within 3 seconds:

1. Which championship they are operating.
2. Which phase the championship is in.
3. Which round is current.
4. What needs attention.
5. Which button continues the workflow.

The admin should not need to remember which tab contains the next task. The interface should surface the next required action first, then expose deeper navigation only after the current state is understood.

## Core UX Principle

Use progressive disclosure:

- Do not hide important functionality.
- Do not dump every function onto the first screen.
- Lead with current context and next action.
- Use tabs as secondary navigation, not as the primary way to teach the workflow.
- Keep the first viewport disciplined. If everything asks for attention, nothing is actually important.

The preferred product pattern is closer to GitHub Repository, Linear Project, and Figma File context than to a generic CRUD admin dashboard.

## Mental Model

Admin works inside a championship context.

Example:

```txt
Spring Cup 2026
Racing Phase
Round 4 of 8
Next Action: Publish Results
```

Admin is not primarily managing global tables. Admin is operating one championship season, then drilling into applications, participants, rounds, standings, and controls within that season.

## Information Architecture

### Admin Sidebar

Sidebar should contain system-level modules only.

Recommended sidebar:

- Dashboard
- Championships
- Users
- Role Requests
- Horse Approvals
- Predictions
- Blog
- Settings

Remove from primary sidebar when the championship workspace is implemented:

- Registrations / Applications
- Participants
- Standings

Reason: these are championship-scoped workspaces. Keeping them both in sidebar and inside championship detail creates duplicate navigation and makes the product feel split between two mental models.

### Championship Workspace

Route can keep backend naming if needed:

- `/admin/tournaments/:id`

UI copy should say Championship.

Workspace structure:

- Sticky Context Header
- Conditional Alert Strip
- Secondary Navigation

Primary surface:

- Overview

Secondary navigation:

- Applications
- Participants
- Rounds
- Standings
- Controls

Overview should not look like just another equal tab. It is the default command surface. Applications, Participants, Rounds, Standings, and Controls are secondary workspaces for deeper review.

## First Viewport Priority

The first viewport should have only three layers:

1. Orientation
2. Conditional alert
3. Navigation

This is the target composition:

```txt
Spring Cup 2026
Racing Phase
Round 4 of 8

Next Action
Publish Results

[ Continue Operations ]

3 Registrations Pending
2 Jockey Pool Applications Pending
1 Result Waiting

Overview | Applications | Participants | Rounds | Standings | Controls
```

If there are no issues, the alert strip should not render. Do not replace it with a decorative success card.

Overview should read as the primary command surface, either by being visually integrated with the header or by receiving stronger treatment than the secondary navigation items. The other sections should feel like secondary destinations, not peers competing with the current action.

The first viewport should not include:

- five metric cards
- separate health panels
- long explanatory paragraphs
- full data tables
- duplicate quick context blocks
- decorative dashboard widgets

## Sticky Context Header

The championship header should remain visible or easily reachable across all championship tabs.

Required content:

- Championship selector or title: `Spring Cup 2026`
- Status badge: `Ongoing`, `Open Registration`, `Completed`, `Postponed`
- Current phase: `Registration`, `Pool Formation`, `Assignment`, `Racing`, `Completed`
- Current round: `Round 4 of 8`
- Next action: `Publish Results`
- Primary CTA: `Continue Operations`

The header is not decoration. It is the main orientation device.

Expected behavior:

- `Continue Operations` routes or scrolls to the correct workflow surface.
- If current action is race-level, it opens the current round control center.
- If current action is application-level, it opens the scoped Applications workspace.
- If current action is participant-level, it opens participant readiness or lock flow.
- If current action is setup-level, it opens the relevant setup form.

## Continue Operations Logic

`Continue Operations` should be smart. It should not always go to the same tab.

Recommended routing:

| Championship state | Example next action | Continue Operations target |
| --- | --- | --- |
| No rounds | Create Round | Rounds tab and Create Round modal |
| Registration phase | Review horse registrations | Applications tab, Horse Registrations section |
| Registration phase | Review jockey pool applications | Applications tab, Jockey Pool section |
| Registration closing | Close registration | Controls tab or confirmation modal |
| Pool formation | Lock participants | Participants tab or lock participant flow |
| Racing phase | Start operational checks | Current Round Control Center |
| Race finished | Enter results | Current Round Control Center result entry |
| Result pending | Publish results | Publish result flow or current Round Control Center |
| Completed | Review standings | Standings tab |

The button label can remain `Continue Operations`, but the supporting next-action text must be specific:

- `Review Horse Registrations`
- `Review Jockey Pool`
- `Lock Participants`
- `Start Operational Checks`
- `Publish Results`

This keeps the primary CTA stable while making the workflow understandable.

## Conditional Alert Strip

The alert strip appears only when something needs admin attention.

Examples:

- `3 horse registrations pending review`
- `2 jockey pool applications pending review`
- `1 result waiting for publish`
- `Participants not locked`
- `No rounds created yet`

Each alert should include a direct action:

- `Review Horse Registrations`
- `Review Jockey Pool`
- `Publish Results`
- `Lock Participants`
- `Create Round`

Avoid always-on alert surfaces. If there is no issue, the interface should become quieter.

## Overview Command Center

Overview is the default landing page for a championship. It is not a metrics dashboard and not a duplicate of every tab.

Priority order:

1. Current championship state
2. Current round
3. Next action
4. Conditional alert
5. Secondary navigation

Required sections:

### Current State

Show:

- Phase
- Current round
- Registration state
- Result or publish readiness

Keep this compact. Current state should orient, not compete with the next action CTA.

### Next Action

This is the most important element on the page.

Examples:

- `Review Horse Registrations`
- `Lock Participants`
- `Start Operational Checks`
- `Enter Results`
- `Publish Results`
- `Complete Championship`

The CTA should be visually primary and written as a command:

- `Review Horse Registrations`
- `Continue Operations`
- `Open Control Center`
- `Publish Results`

Avoid generic buttons:

- `Manage`
- `View`
- `Details`

### Minimal Overview Content

Overview can include a small, quiet summary below the main CTA:

- Current Round
- Upcoming Round
- Latest Standing Update

Do not add a large health dashboard unless a real operational problem needs it.

The goal is not to summarize the whole championship. The goal is to help admin continue the workflow.

## Primary And Secondary Navigation

Overview is the primary surface. The other sections are secondary navigation.

The UI should avoid rendering all six labels as equal-weight tabs if that makes the command center feel like just one tab among many.

Recommended visual hierarchy:

```txt
[Overview command surface]

Applications  Participants  Rounds  Standings  Controls
```

or:

```txt
Overview
---------
Applications | Participants | Rounds | Standings | Controls
```

The exact component can follow existing Tailwind patterns, but the hierarchy should be clear.

### Overview

Command center and workflow guidance.

Do not place long tables here.

### Applications

Championship-scoped entry review. This section contains both sides of the entry flow:

```txt
Applications
├─ Horse Registrations
└─ Jockey Pool Applications
```

It should be visually clear that these are not official participants yet.

#### Horse Registrations

Content:

- Search and status filter
- Pending registrations
- Approved registrations
- Rejected registrations
- Review actions
- Rejection reason display

Primary user question:

Which horse registrations still need admin review for this championship?

#### Jockey Pool Applications

Content:

- Search and status filter
- Pending jockey applications
- Approved pool members
- Rejected applications
- Jockey profile summary
- Experience / weight / height if available
- Review actions
- Rejection reason display

Primary user question:

Which jockeys are allowed to appear in the owner-facing pool for this championship?

### Participants

Championship-scoped participant formation.

Content:

- Horse
- Jockey
- Owner or stable
- Contract or assignment status
- Readiness status
- Points summary if already racing

Primary user question:

Which horse and jockey pairs are competing in this championship?

Important rule:

```txt
Approved horse registration + approved jockey pool application + accepted assignment contract
does not become official until participants are locked.
```

### Rounds

The heart of the championship season.

Content:

- Season timeline
- Registration Closed
- Pool Approved
- Participants Locked
- Round 1
- Round 2
- Current round
- Upcoming rounds

Round setup actions belong here:

- Create Round
- Edit Draft or Scheduled Round
- Delete Draft Round

When championship is ongoing, primary round action is:

- `Open Control Center`

### Standings

Championship-scoped points table.

Content:

- Rank
- Horse
- Jockey
- Stable
- Points
- Wins
- Top 3 finishes
- Rounds completed
- Last published result

Primary user question:

What is the current season table after published results?

### Controls

Championship-level lifecycle actions only.

Allowed examples:

- Open Registration
- Close Registration
- Lock Participants
- Postpone Championship
- Complete Championship
- Reopen Registration

Do not put race or round operations here.

Race operations belong in Round Control Center.

## Round Control Center

Round Control Center opens from:

- Sticky header `Continue Operations`
- Overview next action
- Rounds tab `Open Control Center`

It should not be a permanent block inside Controls.

Flow:

```txt
Start Checks
→ Mark Ready
→ Start Race
→ Enter Results
→ Publish Results
→ Standings Updated
```

The control center should show:

- Round name
- Round status
- Race date and time
- Distance
- Max participants
- Result readiness
- Next round-level action

## Create Round UX

Create Round belongs in the Rounds tab.

Minimum fields:

- Round Name
- Round Code
- Race Date And Time
- Distance
- Max Participants

Behavior:

- Validate required fields inline.
- Use backend race payload names as needed.
- After create, close modal, refresh Rounds timeline, and keep admin in the Rounds tab.

The button label should be `Create Round`, not `Create Race`, because UI mental model is championship season.

## Navigation Behavior

The UI should support two modes:

### First-Time Admin

They should use:

- Header context
- Next Action
- Conditional Alert Strip when there is an issue
- Continue Operations

They should not need to understand all tabs.

### Experienced Admin

They should use:

- Secondary tabs
- Filters
- Search
- Direct table scanning
- Round timeline

The same screen should work for both without adding tutorial text.

## Copy Rules

Use Championship in UI copy.

Allowed backend names:

- `tournamentId`
- `/admin/tournaments/:id`
- `/admin/races`
- `RaceRequest`

UI copy:

- Championship
- Round
- Season
- Control Center
- Standings

Avoid visible UI copy:

- Tournament Settings
- Race Operations inside Controls
- Generic CRUD labels like `Manage Data`
- `Open Workspace` when the action is really `Continue Operations`

## Visual Direction

This is an admin product surface, not a marketing page.

Use:

- Light neutral background
- White work surfaces
- Deep rose existing admin accent
- Restrained status colors
- Compact typography
- Clear hierarchy
- Strong active states
- Sticky or persistent context

Avoid:

- Oversized hero sections
- Decorative gradients
- Too many equal cards
- Dense tables on Overview
- Teaching paragraphs that explain how to use the app

## States

The implementation should cover:

- Loading current championship
- Loading rounds
- No rounds created
- No pending registrations
- No participants locked yet
- No standings published yet
- API error while loading tab data
- Saving / creating state for setup actions
- Disabled submit while creating round

Empty states should include next action when relevant.

Examples:

- No rounds: `Create Round`
- No participants: `Review applications, confirm accepted contracts, and lock participants`
- No jockey pool members: `Review jockey pool applications`
- No standings: `Publish a round result to generate standings`

## Testing And Verification

Focused tests should assert:

- Sidebar no longer duplicates championship-scoped modules once implementation switches to championship-centric IA.
- Championship detail exposes `Overview`, `Applications`, `Participants`, `Rounds`, `Standings`, and `Controls`.
- Applications exposes `Horse Registrations` and `Jockey Pool Applications` as distinct review surfaces.
- Header shows current phase, current round, next action, and `Continue Operations`.
- `Continue Operations` opens the correct workflow.
- Round Control Center is not rendered inside Controls.
- Create Round submits the expected backend race payload.
- Overview renders actionable alert items only when issues exist.

Verification commands:

- `npm test`
- `npm run build`

Manual browser checks:

- First load of a championship detail page
- Switching between tabs without losing championship context
- Continue Operations from each major phase
- Rounds empty state and create round modal
- Desktop and mobile widths

## Non-Goals

- No new backend endpoint unless a required scoped query does not exist.
- No new dependency.
- No drag and drop scheduling.
- No analytics charts.
- No tutorial overlay.
- No public-facing championship page.
- No role or permission redesign.
- No route slug rename unless the team explicitly chooses to migrate from tournament to championship URLs.

## Final Decision

Use Championship-centric admin UX with Progressive Disclosure.

The product should not choose between hiding everything in separate modules or stuffing everything into one huge page. It should keep all championship work inside the championship context while making the next action visually dominant.

The admin should learn by recognition:

```txt
I am in Spring Cup 2026.
It is in Racing phase.
Round 4 is current.
The next action is Publish Results.
The button is Continue Operations.
```

That is the success condition.
