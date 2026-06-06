# Referee Workspace v2 Design

## Goal

Redesign the referee domain and workspace around real race-day operations after the referee workspace merge.

The main product decision is:

- Admin = Championship Director
- Referee = Race Day Official

Admin owns championship lifecycle, schedule publication, exception review, override controls, and standings governance. Referee owns assigned race operation from pre-race checks through the professional race result decision.

This spec does not redesign the UI first. It locks the domain, state machine, responsibility boundary, and API shape so the backend can move away from static in-memory referee data before UI polish.

## Current Context

The project already has a strong championship flow:

1. Admin creates championship and rounds.
2. Owner registers horses.
3. Jockey applies to championship pool.
4. Owner sends assignment contract.
5. Jockey accepts contract.
6. Admin locks participants.
7. Admin publishes schedule.
8. Race participants are generated per round.

The referee branch adds a premium race-day cockpit, but current `/api/v1/referee/**` still uses static in-memory maps inside `RefereeController`.

The database already contains the source-of-truth tables needed for referee v2:

- `races.referee_id`
- `race_participants`
- `pre_race_checks`
- `referee_reports`
- `race_results`

Therefore the next implementation should connect referee endpoints to the real database before further UI redesign.

## Core Domain Model

### Championship

The championship is the season-level container managed by Admin.

Admin responsibilities:

- Create and configure championship.
- Create draft rounds.
- Review horse registrations.
- Review jockey pool applications.
- Lock official participants.
- Publish official schedule.
- Assign referees to races.
- Review exception result packages.
- Reopen or override race results when needed.
- Publish standings or championship-level outputs when that feature is implemented.
- Complete championship and standings.

### Race / Round

The race is one round inside a championship.

UI copy may use `Round` for user-facing championship language, but backend/database can keep `Race`.

Race responsibilities:

- Holds schedule, venue, distance, race status, referee assignment, and per-round participants.
- Becomes visible to referee only after the championship schedule is published and the race is assigned to that referee.
- Must have an assigned referee before the championship schedule can be published.

### Referee

The referee is a race-day official, not a mini-admin.

Referee responsibilities:

- View assigned races.
- Open race control for an assigned race.
- Perform pre-race checks.
- Scratch/withdraw failed participants through checks.
- Mark race ready.
- Start and finish race operation.
- Record incidents.
- Submit result package.
- Confirm race result by default through submission unless admin review is required.
- Own race result decisions unless escalation is required.

Referee does not:

- Create championships.
- Lock participants.
- Publish schedule.
- Publish standings.
- Edit championship settings.

## Race State Machine

Use this race lifecycle:

```text
SCHEDULED
-> CHECKING
-> READY
-> ONGOING
-> FINISHED
-> RESULT_CONFIRMED
```

Exception path:

```text
FINISHED
-> RESULT_SUBMITTED
-> RESULT_CONFIRMED
```

`CANCELLED` remains an exceptional state.

`READY` stays in v1 because the current database/code already supports it and it gives the referee a clear hold state after all checks are complete but before the race starts. Do not add extra intermediate states such as `STARTING` or `CLEARED` in v1.

`RESULT_CONFIRMED` is the normal official race result state created when the referee submits a result package. `RESULT_SUBMITTED` is reserved for exception packages that require admin review because of dispute, serious incident, or referee-requested escalation.

`PUBLISHED` may remain in existing database/code for compatibility, but it is not a primary race-level action in Referee Workspace v2. In v1, `RESULT_CONFIRMED` is the official race result state that downstream UI can read. Publishing belongs at the championship/standings layer, not as a required per-race admin chore.

### Referee-Owned States

Referee may advance:

```text
SCHEDULED -> CHECKING
CHECKING -> READY
READY -> ONGOING
ONGOING -> FINISHED
FINISHED -> RESULT_CONFIRMED
FINISHED -> RESULT_SUBMITTED
```

`FINISHED -> RESULT_CONFIRMED` is the normal path. `FINISHED -> RESULT_SUBMITTED` is used only when the submitted package asks for admin review.

### Admin-Owned States

Admin may advance exception packages:

```text
RESULT_SUBMITTED -> RESULT_CONFIRMED
```

Admin may also reopen or override confirmed results through explicit admin actions. Those actions are exceptional controls, not routine race-day workflow.

### Visibility Rule

Referee assigned races are visible only when:

- `races.referee_id = current referee user`
- parent tournament/championship status is `SCHEDULE_PUBLISHED`, `ONGOING`, or `COMPLETED`

If a race exists in draft before schedule publication, it must not appear in the referee workspace.

## Referee Assignment Flow

Admin assigns referees at the race/round level before publishing the official championship schedule.

Source:

- `races.referee_id`

Rules:

- Every scheduled race must have a referee before schedule publication.
- `Publish Schedule` must be blocked if any race in the championship has no assigned referee.
- The blocking message should be explicit: `Cannot publish schedule. Some races do not have assigned referees.`
- Referee assignment belongs in Admin round/race setup, not in Referee Workspace.

Recommended Admin UI:

- Add an assigned referee dropdown or selector on each race/round card.
- Show missing referee as a warning state on the Rounds tab.
- Keep bulk assignment as a future enhancement, not required for v1.

## Data Source Rules

### Assigned Races

Source:

- `races`
- joined to `tournaments`
- filtered by `races.referee_id`

Referee sees only official assigned races after schedule publication.

### Race Participants

Source:

- `race_participants`
- joined to `horses`
- joined to jockey user

These rows are generated after Admin locks participants and publishes/syncs the race schedule.

### Pre-Race Checks

Source:

- `pre_race_checks`
- mirrored summary fields on `race_participants.check_status` and `race_participants.check_note`

UI wording:

- `NOT_CHECKED` -> Pending check
- `PASSED` -> Cleared
- `CONDITIONAL` -> Conditional
- `FAILED` -> Scratched

When a participant fails a required pre-race check:

- `race_participants.check_status = FAILED`
- `race_participants.status = WITHDRAWN`
- `pre_race_checks.result = FAILED`
- reason is stored in check note/report

### Result Package

Source:

- `race_results`
- `referee_reports`
- incidents/violations if present in the schema

Referee submission creates or updates result rows.

Normal submission:

- `requiresAdminReview = false`
- `race_results.status = CONFIRMED`
- `races.status = RESULT_CONFIRMED`
- standings are recalculated or marked for refresh

Exception submission:

- `requiresAdminReview = true`
- `race_results.status = SUBMITTED`
- `races.status = RESULT_SUBMITTED`
- `reviewReason` is stored with the package/report context
- Admin reviews later

## Backend API

Use `/api/v1/referee/**` as the referee facade.

### Referee APIs

#### `GET /api/v1/referee/races`

Returns assigned races visible to the current referee.

Rules:

- Requires `REFEREE`.
- Filter by `races.referee_id`.
- Include only races whose championship schedule is published or later.
- Include status, schedule, venue, distance, championship name, participant count, and next action.

#### `GET /api/v1/referee/races/{id}`

Returns race control center data.

Includes:

- Race metadata.
- Championship metadata.
- Current status.
- Participants and check state.
- Draft/submitted results if present.
- Existing incidents/report summary if present.
- Next allowed action.

Authorization:

- Current referee must match `races.referee_id`.

#### `POST /api/v1/referee/races/{id}/check`

Starts or saves pre-race checks.

Behavior:

- The UI exposes this through an explicit `Start Checks` action.
- If race is `SCHEDULED`, the first accepted check request moves it to `CHECKING`.
- Upsert pre-race check rows.
- Update participant check status.
- Withdraw failed participants.
- If every participant has a non-pending check, allow transition to `READY`.

The service must validate that no race moves to `READY` while checks are pending. `CONDITIONAL` checks require a note and may count as complete in v1.

#### `POST /api/v1/referee/races/{id}/start`

Starts race operation.

Rules:

- Requires race status `READY`.
- Requires at least one active participant.
- Sets `races.status = ONGOING`.

#### `POST /api/v1/referee/races/{id}/finish`

Finishes race operation.

Rules:

- Requires race status `ONGOING`.
- Sets `races.status = FINISHED`.
- Does not publish results.

#### `POST /api/v1/referee/races/{id}/results/submit`

Submits the referee result package.

Payload:

- `requiresAdminReview: boolean`
- `reviewReason: string | null`
- Participant result rows.
- Finish position/time.
- Result status: finished, disqualified, did not finish, withdrawn.
- Incident summary if relevant.
- Referee report summary.

Rules:

- Requires race status `FINISHED`.
- If `requiresAdminReview = false`, writes `race_results.status = CONFIRMED`.
- If `requiresAdminReview = false`, sets `races.status = RESULT_CONFIRMED`.
- If `requiresAdminReview = false`, standings are recalculated or marked for refresh.
- If `requiresAdminReview = true`, writes `race_results.status = SUBMITTED`.
- If `requiresAdminReview = true`, sets `races.status = RESULT_SUBMITTED`.
- If `requiresAdminReview = true`, `reviewReason` is required.
- Writes/updates `referee_reports`.

#### `POST /api/v1/referee/races/{id}/incidents`

Logs race-day incident.

Rules:

- Requires assigned referee.
- Allowed during `CHECKING`, `READY`, `ONGOING`, and `FINISHED`.
- Incidents are supporting evidence for the submitted result package.

### Admin Result APIs

Admin owns exception review, reopen, and override controls. Championship/standings publication is separate from this v1 race-level review flow.

#### `GET /api/v1/admin/result-packages?status=REVIEW_NEEDED`

Returns races with `RESULT_SUBMITTED` and their submitted referee package.

#### `POST /api/v1/admin/races/{id}/results/confirm`

Rules:

- Requires race status `RESULT_SUBMITTED`.
- Sets result rows to `CONFIRMED`.
- Sets race status to `RESULT_CONFIRMED`.

#### `POST /api/v1/admin/races/{id}/results/reopen`

Rules:

- Requires race status `RESULT_CONFIRMED` or `RESULT_SUBMITTED`.
- Moves the race back into a reviewable/editable result state.
- Requires an admin reason.
- Intended for mistakes, disputes, or official corrections.

#### `POST /api/v1/admin/races/{id}/results/override`

Rules:

- Requires admin role.
- Requires an admin reason.
- Updates confirmed result rows through an auditable override path.
- Keeps the race in `RESULT_CONFIRMED` after a valid override.

No primary per-race publish endpoint is required for v1. If existing code still exposes a race-level publish action, it should be treated as legacy/compatibility until the admin result review flow is consolidated.

## Referee Workspace IA

The referee workspace should be built around assigned race operation, not championships.

Sidebar:

- Dashboard
- Assigned Races
- Race Control
- Result Packages
- Incidents
- Profile

Do not add:

- Championships
- Participants
- Standings
- Schedule publishing controls
- Championship settings

Those belong to Admin.

## Referee Dashboard UX

The dashboard should answer in three seconds:

1. What is my next assigned race?
2. What state is it in?
3. What should I do next?

Primary hero:

- Next Assigned Race
- Championship name
- Round/race name
- Scheduled time
- Venue
- Distance
- Current race status
- Primary CTA: Open Race Control

Operational queue:

- Needs Checks
- Ready To Start
- Live / In Progress
- Results To Submit
- Submitted, Waiting Admin

Metrics should be secondary and operational:

- Assigned Today
- Checks Pending
- Result Packages Submitted
- Incidents Open

Avoid documentation cards that explain the whole system. If workflow help is needed, keep it contextual and collapsible.

## Assigned Races Page

Purpose:

Let the referee scan assigned work by time and urgency.

Recommended layout:

- Day timeline as default.
- Month calendar as secondary view.
- Race detail drawer on selection.
- CTA changes by race status:
  - `SCHEDULED`: Start Checks
  - `CHECKING`: Continue Checks
  - `READY`: Open Ready Lineup
  - `ONGOING`: Resume Live Control
  - `FINISHED`: Submit Results
  - `RESULT_SUBMITTED`: Waiting Admin Review
  - `RESULT_CONFIRMED`: View Final Result

## Race Control Center UX

Race Control is the main referee product surface.

Use progressive disclosure:

- Show current state and next action first.
- Show only the panel relevant to that state.
- Keep participant/race context visible.
- Do not show every possible action at once.

State-specific UI:

### Scheduled

Show:

- Race brief
- Participants count
- Check unlock status
- CTA: Start Pre-Race Checks

### Checking

Show:

- Participant checklist
- Horse identity
- Jockey identity
- Health/equipment decisions
- Scratch reason field when failed
- CTA: Mark Race Ready

Disable `Mark Race Ready` until all required checks are complete.

### Ready

Show:

- Cleared lineup
- Scratched participants summary
- Safety note
- CTA: Start Race

### Ongoing

Show:

- Live race operation surface
- Incident log
- Penalty/disqualification controls if kept in scope
- CTA: Finish Race

The live simulator can remain frontend-local for now. It is not the source of truth; only the submitted result package is persisted.

### Finished

Show:

- Draft finish order
- Result entry form
- Incident/report summary
- Admin review toggle with reason field:
  - `requiresAdminReview = false`: confirm result on submit
  - `requiresAdminReview = true`: send to Admin review
- CTA: Submit Result Package

### Result Submitted

Show:

- Submitted exception package read-only
- Status: Waiting Admin Review
- Review reason
- Link back to assigned races

### Result Confirmed

Show:

- Confirmed result package read-only
- Official finish order
- Incident/report summary
- Status: Official Result Confirmed

## Jockey Race Day Brief Alignment

Jockey schedule/detail should consume referee/admin race state with human wording.

Before checks:

- Race status: Scheduled
- Check status: Awaiting referee checks

During checks:

- Race status: Pre-race checks
- Check status: Pending / Cleared / Scratched

After ready:

- Race status: Ready
- Check status: Cleared

After race:

- Race status: Results submitted / Official result confirmed

Race Day Brief should focus on:

- Arrival time if available
- Race time
- Venue/track
- Horse
- Owner/stable
- Distance
- Referee check status
- Official note

Avoid showing database-like labels such as `Confirmation: Pending` without explaining what the participant should do.

## AI Race Report Assistant

The referee report can use AI assistance, but AI must never decide official race results.

Rule:

- Referee decides finish order, DSQ, DNF, withdrawn status, penalties, and incidents.
- AI only drafts the narrative race report from structured data and referee notes.
- Referee must be able to review and edit the generated report before submission.
- AI failure must not block result submission.

### V1 Scope

V1 should support text-based report generation:

```text
Structured race data
+ referee notes
+ incident list
+ result rows
-> AI generated summary
-> referee edits
-> final referee report
-> submit result package
```

Speech-to-text belongs to V2. It should not be required for the first implementation because audio capture, upload, transcription, and provider quotas add integration risk.

### API

#### `POST /api/v1/referee/races/{id}/reports/generate`

Generates a draft race report.

Payload:

```json
{
  "notes": "Track was wet. Horse 5 stumbled but recovered.",
  "incidents": [],
  "results": []
}
```

Response:

```json
{
  "generatedSummary": "Professional race report draft..."
}
```

Rules:

- Requires assigned referee.
- Reads race context from the database.
- Can accept extra notes/incidents/results from the current draft UI.
- Returns a draft only; it does not submit or confirm results.
- If the provider fails, return a template-based fallback summary or a clear recoverable error.

### Provider Adapter

Business code should depend on an interface, not directly on Gemini, FPT AI, or any single provider.

```java
public interface AiReportGenerator {
    String generateRaceReport(GenerateRaceReportCommand command);
}
```

Possible implementations:

- `MockReportGenerator`
- `TemplateReportGenerator`
- `GeminiReportGenerator`
- `FptAiReportGenerator`
- `OpenAiCompatibleReportGenerator`

Recommended provider order:

- Local development: `MockReportGenerator` or `TemplateReportGenerator`
- Demo development: Gemini or another low-friction provider
- Deployment/demo environment: provider configured by environment variables
- Fallback: template report generator

Configuration:

```properties
ai.provider=mock
ai.api-key=
ai.base-url=
ai.model=
```

The exact provider, model, quota, and base URL should be verified against the chosen provider documentation before implementation or deployment because these values can change.

### Storage

Use existing `referee_reports` first if it can hold the generated and final report content.

Preferred future columns if schema changes are acceptable:

- `transcript`
- `generated_summary`
- `final_summary`
- `ai_generated`
- `ai_provider`
- `ai_model`

V1 can keep storage simpler:

- save generated/editable report content into the existing report summary/content field;
- add dedicated AI columns later if needed for audit/demo clarity.

### UI

In the Finished race state, show:

- Official result table.
- Incident summary.
- Referee notes textarea.
- `Generate Race Report` action.
- Generated report editor.
- Submit result package action.

The generated report area should be editable and clearly labeled as a draft.

Do not show AI as an authority. Copy should say:

- `AI draft`
- `Generated report draft`
- `Review before submitting`

Avoid:

- `Official AI report`
- `AI verified`
- `AI confirmed`

## Admin UX Alignment

Admin Championship Detail should remove race-day operation controls from championship-level Controls.

Admin can show:

- Assigned referee
- Race status
- Exception result package when review is required
- Confirm exception result
- Reopen result
- Override result
- Link to championship standings when standings are available

Admin should not show primary controls for:

- Start checks
- Mark ready
- Start race
- Finish race
- Publish individual race result as a routine per-race chore

Those belong to Referee Race Control.

## Implementation Order

### Phase 1: Backend Source Of Truth

Replace static `RefereeController` maps with DB-backed service.

Deliver:

- `GET /api/v1/referee/races`
- `GET /api/v1/referee/races/{id}`
- assigned referee authorization
- schedule-published visibility rule

Also add or verify Admin schedule publication validation:

- race must have `referee_id`
- publish schedule fails with a clear message if any race lacks an assigned referee

### Phase 2: Pre-Race Checks

Deliver:

- `POST /api/v1/referee/races/{id}/check`
- persist `pre_race_checks`
- update `race_participants.check_status`
- withdraw failed participants
- transition to `CHECKING` / `READY`

### Phase 3: Race Operations

Deliver:

- `POST /api/v1/referee/races/{id}/start`
- `POST /api/v1/referee/races/{id}/finish`
- state validation
- no admin-owned transitions

### Phase 4: Result Package

Deliver:

- `POST /api/v1/referee/races/{id}/results/submit`
- `POST /api/v1/referee/races/{id}/incidents`
- optional `POST /api/v1/referee/races/{id}/reports/generate`
- write result rows and report rows
- normal submit sets race to `RESULT_CONFIRMED`
- exception submit sets race to `RESULT_SUBMITTED`

### Phase 5: Admin Review

Deliver:

- `GET /api/v1/admin/result-packages?status=REVIEW_NEEDED`
- `POST /api/v1/admin/races/{id}/results/confirm`
- `POST /api/v1/admin/races/{id}/results/reopen`
- `POST /api/v1/admin/races/{id}/results/override`
- no primary per-race publish endpoint in v1

### Phase 6: UI Polish

Only after DB-backed flow works:

- Referee dashboard redesign.
- Assigned Races timeline/calendar polish.
- Race Control progressive disclosure.
- Jockey Race Day Brief wording.
- Admin result package review UI.

## Testing

Backend tests:

- Non-referee cannot call referee APIs.
- Referee sees only assigned races.
- Referee does not see races before schedule publication.
- Referee cannot access another referee's race.
- Admin cannot publish schedule while any race has no assigned referee.
- Pre-race checks persist.
- Failed checks withdraw participant.
- Race cannot start before `READY`.
- Normal result submission sets `RESULT_CONFIRMED`.
- Exception result submission sets `RESULT_SUBMITTED`.
- Admin confirm transition only works from `RESULT_SUBMITTED`.
- Admin reopen/override requires a reason.

Frontend tests:

- Dashboard renders next assigned race from API.
- Assigned races page shows status-specific CTA.
- Race Control blocks ready state while checks are pending.
- Submitted package state is read-only.
- Jockey Race Day Brief shows clear human status copy.

Manual happy path:

1. Admin assigns referee to every race.
2. Admin publishes championship schedule.
3. Referee opens Assigned Races.
4. Referee starts checks.
5. Referee clears/scratches participants.
6. Referee starts race.
7. Referee finishes race.
8. Referee submits result package with `requiresAdminReview = false`.
9. Race becomes `RESULT_CONFIRMED`.
10. Jockey schedule reflects official confirmed result state.

## Non-Goals

- No websocket telemetry.
- No real-time photo finish.
- No betting or payout integration.
- No referee marketplace.
- No standings redesign in this spec.
- No full DB/entity rename from Race to Round.
- No changing existing championship DB naming.
- No frontend-only fake state for official race lifecycle.
- No primary per-race publish workflow in v1.
- No mandatory admin confirmation for every normal race result.
- No speech-to-text in v1.
- No AI decision-making for official result data.

## V1 Decisions

Use these decisions for the first implementation:

1. The UI has an explicit `Start Checks` action, backed by `POST /api/v1/referee/races/{id}/check`.
2. `CONDITIONAL` checks can allow `READY` only when a note is provided.
3. Incidents reuse existing incident/violation storage first. A separate incident table can be considered later only if reporting needs outgrow the current schema.
4. Keep `READY` as the only post-check pre-start hold state. Do not add `STARTING` or rename DB status to `CLEARED` in v1.
5. Treat `RESULT_CONFIRMED` as the official race result state for v1. Do not require Admin to publish every race individually.
6. Referee result submission confirms results by default. `RESULT_SUBMITTED` is only for exception packages that require admin review.
7. AI report generation is optional helper functionality. Provider adapters and fallback behavior are required if AI generation is implemented.

## Self-Review

- Placeholder scan: no TODO/TBD placeholders remain.
- Consistency check: Referee normally confirms race results by submission; Admin owns exception review, overrides, and championship/standings publication.
- Scope check: this spec focuses on referee domain, DB-backed APIs, and UI direction. Standings and full result recalculation stay outside this spec.
- Ambiguity check: `Race` remains backend/database wording; `Round` may be UI copy only. V1 decisions are explicitly listed above.
