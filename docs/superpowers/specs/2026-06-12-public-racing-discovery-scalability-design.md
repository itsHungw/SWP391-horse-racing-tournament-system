# Public Racing Discovery and Scalability Design

## Purpose

Redesign the public Championships and Races discovery experience so it remains
fast, understandable, and visually premium when the system grows from demo
data to hundreds of championships and thousands of races.

The approved direction is **Trackside Command Center**:

- Championships remains an editorial discovery page without a calendar.
- Races becomes an action-first hub centered on the next race to post.
- Upcoming races are the default; Results is a separate user intent.
- Agenda is the default view; Calendar is a secondary overview.
- Public list APIs gain server-side filtering and pagination in Phase 1.
- The existing dark emerald, gold, ivory, editorial typography, and restrained
  motion language remains intact.

This design supersedes the discovery/list-page portions of
`2026-06-11-paddock-club-v2-client-ux-design.md`. Existing Championship Detail,
Race Detail, Prediction Arena, and Leaderboard flows remain unless explicitly
extended below.

## Design Principles

1. **The next meaningful action appears first.** Users should reach the next
   race, prediction flow, or official result within seconds.
2. **Calendar is context, not the primary workflow.** It shows schedule density
   and supports date discovery, but never replaces the race agenda.
3. **Premium does not mean oversized.** Only In Focus and Next to Post receive
   large visual weight. Repeated items stay compact and highly scannable.
4. **Public wording hides technical lifecycle details.** Users see labels such
   as "Official Result" and "Awaiting Official Result", not internal statuses.
5. **URL state is the source of truth.** Filters, scope, view, month, and page
   survive refresh, browser navigation, and shared links.
6. **Frontend affordances never replace backend authorization.** Prediction and
   registration permissions are validated again by the relevant backend
   command endpoint.
7. **Server-side filtering is part of Phase 1.** The UI must not merely look
   scalable while downloading and filtering the complete dataset.

## Scope

### Phase 1

#### Championships

- Compact editorial hero.
- In Focus championship.
- Search, status, season/year, and sort controls.
- Hybrid editorial list cards.
- Server-side pagination.
- Role-aware navigation affordances.
- URL-driven state.

#### Races

- Next to Post or Latest Result hero.
- Upcoming and Results scopes.
- Agenda and Calendar views.
- Search, championship, and date controls.
- Desktop day side panel and mobile day bottom sheet.
- Server-side filtering and pagination.
- Public race results endpoint.
- URL-driven state.

#### Backend

- Page-based public race and tournament queries.
- Dedicated summary DTOs for discovery pages.
- A compact public racing summary for Home statistics.
- Stable sort enums instead of arbitrary UI sort expressions.
- Public result DTO restricted to official/public-safe information.
- Backward-compatible detail endpoints.

### Phase 2

- Results filters by horse and jockey.
- Calendar aggregate endpoint for exceptionally dense schedules.
- Replay/report links if the domain gains public media/report data.
- Server time metadata if countdown clock drift becomes operationally
  important.
- More advanced personalized prediction eligibility summaries.

### Out of Scope

- Calendar view for Championships.
- Admin, owner, jockey, or referee workspace redesign.
- Real-time websocket updates.
- Per-card photography where no real image source exists.
- Infinite scroll.
- Exposing referee notes or draft/submitted result details publicly.

## Domain Language

The public UI calls a tournament a **Championship**. Existing backend paths and
domain entities remain `/tournaments` and `Tournament` to avoid unnecessary
domain migration in this phase.

### Race Scopes

- `UPCOMING`: active or future races that are not completed or cancelled.
  Active statuses such as `CHECKING`, `READY`, and `ONGOING` appear before
  scheduled future races.
- `RESULTS`: races that have run or are in result processing. Public cards may
  say "Awaiting Official Result" until the result is official.

Phase 1 public clients only require `UPCOMING` and `RESULTS`.

### Public Result Language

- `RESULT_SUBMITTED`: **Awaiting Official Result**. No finish order is exposed.
- `RESULT_CONFIRMED`: **Official Result**. Finish order may be exposed.
- `PUBLISHED`: **Official Result**. Finish order may be exposed.

The public UI does not display raw technical statuses unless they are mapped to
an approved public label.

## Information Architecture

### Championships

```text
Compact Hero
In Focus Championship
Sticky Discovery Toolbar
Paginated Hybrid Championship List
Existing Participation CTA Band
```

### Races

```text
Compact Hero
Next to Post or Latest Result
Sticky Race Controls
Agenda (default) or Calendar
Day Panel / Bottom Sheet (calendar selection)
Existing Prediction CTA Band
```

## Championships Page

### Hero

The hero keeps the current editorial identity but uses less vertical space so
users reach discovery content sooner. It contains the page title, concise
description, and truthful summary counts from the paginated query metadata or a
small summary query if needed.

### In Focus

In Focus is a single high-emphasis championship card selected in this order:

1. Ongoing championship with the nearest next race.
2. Open-registration championship with the nearest registration close time.
3. Upcoming championship with the nearest start date.
4. Most recently completed championship.

It shows:

- Public status.
- Championship name.
- Date range and location.
- Race and participant counts when available.
- Next race summary when available.
- Primary CTA based on the most meaningful public action.

CTA rules:

- Ongoing with next race: `View Next Race`, plus `View Championship`.
- Open registration:
  - Horse owner: `Register Horse`.
  - Other/guest: `View Championship`.
- Completed: `View Results`.
- Otherwise: `View Championship`.

Role-aware CTA display is an affordance only. Registration submission remains
protected and validated by the owner workflow backend.

If no championship exists:

```text
No active championship right now
Explore completed championships or check back later.
```

### Discovery Toolbar

Desktop uses a visually light two-part toolbar:

```text
[Search championships...] [Status] [Season] [Sort]
```

Mobile shows:

```text
[Search championships...] [Filters]
```

`Filters` opens a bottom sheet containing status, season, sort, reset, and
apply actions.

Supported Phase 1 state:

- `search`
- `status`
- `year`
- `sortBy`
- `page`

Changing a filter resets `page` to `0`.

### Hybrid Championship List

The existing tall three-column grid is replaced by editorial horizontal cards.
The component remains visually rich through a status stripe, gold rules, track
motifs, typography, and subtle texture rather than repeated stock imagery.

Desktop structure:

```text
Status stripe | Championship identity and metadata | Next action and CTAs
```

Mobile cards stack vertically with full-width primary actions.

Each card may show:

- Status and code.
- Championship name.
- Date range and location.
- Race count and participant count.
- Next race or registration deadline.
- Primary and secondary CTA.

Use standard pagination rather than infinite scroll so users can return to a
known position and share a stable URL. Default page size: `12`.

### Championship URL Examples

```text
/championships?status=ONGOING&year=2026&page=0
/championships?search=belmont&sortBy=REGISTRATION_CLOSING_SOON&page=0
```

## Races Page

### Next to Post Hero

The main action block appears immediately after the compact hero.

Selection:

1. Active race: `ONGOING`, then `READY`, then `CHECKING`.
2. Nearest scheduled future race.
3. If no upcoming race exists, most recent official/latest result.

Upcoming presentation:

```text
NEXT TO POST · countdown
Belmont Sprint — Round 3
Belmont Summer Championship
Jun 15 · 14:00 · 1,200 m · 12 runners
[Make Prediction / Login to Predict] [View Race Card]
```

Active race presentation uses `LIVE NOW` instead of countdown.

Fallback presentation must be explicitly relabeled:

```text
LATEST RESULT
Belmont Sprint — Round 3
Official Result Published
[View Full Result]
```

Countdown uses `raceDateTime` in Phase 1. A future response may include
`serverNow` if clock drift becomes significant.

### Prediction CTA Rules

Race summary exposes `predictionOpen`, not `canPredict`.

- `predictionOpen = true`, authenticated spectator: `Make Prediction`.
- `predictionOpen = true`, guest: `Login to Predict`.
- Otherwise: no prediction CTA; retain `View Race Card`.

The frontend only decides which affordance to display. Prediction submission
always revalidates authentication, role, race status, duplicate prediction
rules, and point balance in the backend.

### Sticky Race Control Bar

Desktop has two visually light rows:

```text
[Upcoming] [Results]                    [Agenda] [Calendar]
[Search races...] [Championship] [Date] [Sort when relevant]
```

Mobile has:

```text
[Upcoming] [Results]
[Agenda] [Calendar]
[Search] [Filters]
```

The mobile filter bottom sheet contains:

- Championship.
- Date range or month.
- Sort.
- Reset filters.
- Apply.

Changing scope or filters resets page to `0`. Switching Agenda and Calendar
preserves scope, championship, and date state.

### Agenda View

Agenda is the default view because users primarily seek the next actionable
race.

Upcoming grouping:

1. Live Now.
2. Today.
3. Tomorrow.
4. This Week.
5. Later This Month.
6. Month and year for later races.

Results grouping uses month/year after a compact recent-results section.

Race row hierarchy:

```text
14:00       Belmont Sprint
            Summer Championship · 1,200 m · 12 runners
            Predictions Open · Scheduled
            [Predict] [Race Card]
```

- Time is the left visual anchor.
- Race name is the largest repeated text.
- Championship and race facts are secondary metadata.
- Status pills and CTAs remain compact.
- Results rows replace prediction actions with official-result information.

Use page-based loading. Default page size: `20`.

### Results Cards

Official result:

```text
Official Result
Belmont Sprint — Round 3
Winner: Emerald King
Final Time: 72.341s
[View Full Result]
```

Pending result:

```text
Awaiting Official Result
Belmont Sprint — Round 3
Results are being reviewed.
[View Race Card]
```

Only confirmed/published result data is visible publicly.

### Calendar View

Calendar is always secondary and never the default.

- Desktop: month grid and persistent right-side day panel.
- Mobile: month grid and day bottom sheet.
- The selected month and day are stored in the URL.
- Calendar requests only the visible month range.
- Calendar cells never contain action CTAs.

Each day cell shows:

- Date.
- At most two short race labels.
- `+N races` when more exist.
- Gold indicator when any race has predictions open.
- Emerald live indicator when a race is active.

Clicking a date opens its race list. When a selected day contains more than
eight races, the panel groups races into:

- Morning.
- Afternoon.
- Evening.

The panel contains compact race actions; the calendar cell does not.

Calendar Phase 1 uses the normal race list endpoint with the visible month
range and a bounded maximum size. If the response reports more records than the
calendar bound, the UI shows a light notice and links to the filtered Agenda
view rather than silently hiding races.

### Race URL Examples

```text
/races?scope=UPCOMING&view=agenda&page=0
/races?scope=UPCOMING&view=calendar&month=2026-06&tournamentId=12
/races?scope=RESULTS&view=agenda&page=2
```

## Backend API Design

### Public Race Discovery

```http
GET /api/v1/races
  ?scope=UPCOMING|RESULTS
  &from=2026-06-01
  &to=2026-06-30
  &tournamentId=12
  &search=sprint
  &sortBy=NEXT_RACE
  &page=0
  &size=20
```

Supported Phase 1 sort values:

- `NEXT_RACE`
- `LATEST_RESULT`

The endpoint returns:

```json
{
  "content": [],
  "totalElements": 240,
  "totalPages": 12,
  "number": 0,
  "size": 20
}
```

### Race Summary DTO

```json
{
  "id": 101,
  "name": "Round 3 - Belmont Sprint",
  "roundName": "Round 3",
  "code": "BEL-R3",
  "tournamentId": 12,
  "tournamentName": "Belmont Summer Championship",
  "raceDateTime": "2026-06-15T14:00:00",
  "location": "Belmont Park",
  "distanceMeters": 1200,
  "maxParticipants": 14,
  "participantCount": 12,
  "status": "SCHEDULED",
  "predictionOpen": true,
  "predictionCloseTime": "2026-06-15T14:00:00",
  "resultOfficial": false,
  "winner": null
}
```

`winner` is optional and only populated for official public results. It contains
only the compact information needed by a Results list item.

`predictionOpen` means the race currently accepts predictions at the system
level. It does not claim the current user is eligible to submit.

### Public Championship Discovery

```http
GET /api/v1/tournaments
  ?status=ONGOING
  &year=2026
  &search=summer
  &sortBy=ONGOING_FIRST
  &page=0
  &size=12
```

Supported Phase 1 sort values:

- `ONGOING_FIRST`
- `REGISTRATION_CLOSING_SOON`
- `LATEST`

### Championship Summary DTO

```json
{
  "id": 12,
  "name": "Belmont Summer Championship",
  "code": "BSC-2026",
  "description": "Summer championship programme.",
  "location": "Belmont Park",
  "status": "ONGOING",
  "seasonYear": 2026,
  "startDate": "2026-06-10",
  "endDate": "2026-07-20",
  "registrationStartAt": "2026-05-01T00:00:00",
  "registrationEndAt": "2026-06-01T23:59:59",
  "raceCount": 8,
  "participantCount": 32,
  "nextRace": {
    "id": 101,
    "name": "Round 3 - Belmont Sprint",
    "raceDateTime": "2026-06-15T14:00:00"
  }
}
```

`nextRace` is an object rather than separate nullable fields.

### Public Race Results

```http
GET /api/v1/races/{id}/results
```

Rules:

- `RESULT_SUBMITTED`: return a pending public result state without finish order.
- `RESULT_CONFIRMED` or `PUBLISHED`: return official finish order.
- Never expose internal referee notes, submitter identity, or draft/rejected
  result details.

Example official response:

```json
{
  "raceId": 101,
  "official": true,
  "publishedAt": "2026-06-15T16:00:00",
  "entries": [
    {
      "position": 1,
      "horseName": "Emerald King",
      "jockeyName": "Mina Tran",
      "finishTimeSeconds": 72.341,
      "penaltySeconds": 0,
      "points": 25,
      "resultStatus": "FINISHED"
    }
  ]
}
```

### Public Racing Summary

Home currently derives calendar totals and season finale information by
downloading complete race and tournament arrays. That becomes invalid once
public list endpoints are paginated.

Add a compact aggregate endpoint:

```http
GET /api/v1/racing-summary
```

```json
{
  "raceCount": 240,
  "raceDayCount": 48,
  "championshipCount": 12,
  "seasonFinale": "2026-11-15"
}
```

The Home Featured Race migrates to:

```http
GET /api/v1/races?scope=UPCOMING&sortBy=NEXT_RACE&page=0&size=1
```

If there is no upcoming race, Home may request the latest result as its
truthful fallback. Home must not download all races or tournaments after the
pagination migration.

### Compatibility and Migration

- `GET /api/v1/races/{id}` and `GET /api/v1/tournaments/{id}` remain unchanged.
- Public list clients migrate from array responses to page responses in the
  same implementation phase.
- Home migrates to `/api/v1/racing-summary` and bounded featured-race queries
  before the array list responses are removed.
- Owner tournament registration currently consumes the public tournament list.
  It must migrate to a paginated/searchable selector or a bounded eligible
  tournament query in the same phase.
- Internal services and owner flows that currently call public tournament lists
  must be audited before changing the response shape.
- If simultaneous migration is too risky, introduce versioned/page endpoints
  temporarily, then remove the compatibility path after all consumers migrate.
- Repository queries must perform filtering, sorting, counts, and pagination in
  the database rather than loading all entities and filtering in Java.

## State and Error Handling

### Loading

- Skeletons preserve the final component dimensions.
- Next to Post and In Focus load independently from list content where
  practical.
- URL controls remain usable while a new result page loads.

### Empty States

Championships:

```text
No active championship right now
Explore completed championships or check back later.
```

Filtered Championships:

```text
No championships match these filters.
[Reset filters]
```

Upcoming Races:

```text
No upcoming races on the card.
[View Results]
```

Results:

```text
No race results match these filters.
[Reset filters]
```

Calendar day:

```text
No races scheduled for this day.
```

### Errors

- A failed list request retains current filters and presents a retry action.
- A failed day-panel request keeps the calendar visible.
- A failed public result request leaves the Race Card usable and presents a
  result-specific error.
- Do not replace failed requests with fabricated counts or cards.

## Visual System

- Preserve the existing dark turf surfaces, controlled gold accents, ivory
  text, and display/editorial typography.
- Keep body and metadata typography highly readable and compact.
- Use thin borders, subtle glass panels, status stripes, track-lane motifs, and
  restrained texture.
- Do not use a white admin-dashboard visual language.
- Avoid repeated hero imagery inside list cards.
- Motion remains subtle and honors `prefers-reduced-motion`.
- Only In Focus and Next to Post use high visual weight.
- Sticky controls remain visually light and must not dominate content.

## Accessibility

- Tabs, view toggles, and filters expose selected state programmatically.
- Calendar supports keyboard date navigation and clear selected/today states.
- Day panel and mobile bottom sheet manage focus, expose a close action, and
  return focus to the selected day.
- Status never relies on color alone.
- Touch targets meet minimum size expectations.
- Reduced-motion users receive static transitions and countdown updates without
  decorative motion.

## Testing Strategy

### Backend

- Repository/service integration tests for race scope, date range, tournament,
  search, sorting, and pagination.
- Tournament filtering, year, sorting, and pagination tests.
- Summary DTO count and next-race correctness tests.
- Public result security tests proving draft/submitted details and internal
  notes are not exposed.
- Query-count checks for summary mapping to prevent N+1 regressions.

### Frontend

- URL state parsing and serialization tests.
- Championships In Focus selection and empty-state tests.
- Championship filters and pagination behavior.
- Next to Post active/upcoming/latest-result selection.
- Upcoming and Results scope behavior.
- Agenda grouping boundary tests for today, tomorrow, week, and month.
- Calendar month navigation, cell overflow label, selected-day panel, and
  morning/afternoon/evening grouping.
- Guest versus authenticated prediction CTA display.
- Public result pending versus official states.
- Accessibility tests for tabs, selected view, panel focus, and keyboard
  calendar navigation.

### Verification

- Backend test suite for affected race, tournament, result, and prediction
  domains.
- Frontend public-page test suite.
- TypeScript typecheck and production build.
- Desktop and mobile browser verification for:
  - Few records.
  - Dense day with more than eight races.
  - Multiple pages of results.
  - Empty, loading, and error states.
  - Reduced motion.

## Acceptance Criteria

1. `/championships` has no calendar and reaches discovery content faster than
   the current tall-hero/grid design.
2. In Focus follows the approved selection rules and has a truthful empty
   state.
3. Championship discovery supports server-side search, status, year, sort, and
   pagination with URL persistence.
4. `/races` opens with Upcoming Agenda and emphasizes Next to Post.
5. Upcoming and Results are separate scopes with distinct CTAs and wording.
6. Calendar is secondary, fetches only its visible range, and calendar cells
   never contain CTAs.
7. Selecting a calendar day opens a desktop side panel or mobile bottom sheet;
   dense days group races by time slot.
8. Public result details are exposed only when official and never leak internal
   referee notes.
9. Prediction CTA display is helpful, but backend submission remains the source
   of authorization truth.
10. Public list endpoints perform database-level filtering and pagination and
    no longer require clients to download the entire dataset.
11. The final UI remains recognizably premium and editorial rather than an
    admin-style dashboard.
12. Home statistics/featured race and owner registration selection continue to
    work without downloading complete race or tournament datasets.
