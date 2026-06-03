# Referee Profile Dashboard + Calendar Navigation Design

Date: 2026-06-03

## Goal

Add a `Profile` tab as the main dashboard for the referee workspace, move the month calendar from `Assigned Races` into this new profile dashboard, and let referees click a race on the monthly calendar to jump directly into the `Assigned Races` workflow with that race selected.

This keeps `Assigned Races` focused on operational execution while `Profile` becomes the overview/home dashboard.

## Decision

Use Option A from the brainstorming mockup:

- `Profile` becomes the default referee dashboard route.
- `Assigned Races` remains the focused race-day operations route.
- `Result History` remains the read-only published archive route.
- The month calendar moves out of `Assigned Races` and into `Profile`.
- Clicking a race inside the month calendar navigates to `Assigned Races` and preselects that race.

## Navigation

Update the referee sidebar order:

1. `Profile`
2. `Assigned Races`
3. `Result History`

Recommended routes:

- `/referee` -> `RefereeProfileDashboardPage`
- `/referee/assigned-races` -> `RefereeOverviewPage`
- `/referee/result-history` -> `RefereeResultHistoryPage`

Compatibility:

- Existing links to `/referee` currently open assigned races. This spec intentionally changes `/referee` to the new profile dashboard.
- If backwards compatibility is needed, old links can redirect from `/referee/races` or `/referee/assigned-races` explicitly. The implementation should update all internal links that mean “Assigned Races” to `/referee/assigned-races`.

Sidebar active state:

- When the URL is `/referee`, highlight `Profile`.
- When the URL is `/referee/assigned-races` or `/referee/assigned-races?raceId={id}`, highlight `Assigned Races`.
- When the URL is `/referee/result-history`, highlight `Result History`.
- Query params must not prevent the correct `NavLink` active state.

## Profile Dashboard Content

The Profile dashboard should be the referee's at-a-glance home screen.

Suggested content:

- Referee identity card:
  - full name;
  - role badge;
  - email if available;
  - operational label such as `Race Operations`.
- KPI cards:
  - races assigned today;
  - races ready for pre-race;
  - live/ongoing races;
  - published results count.
- Month calendar:
  - shows assigned races in the current month;
  - each race chip shows race code and status styling;
  - clicking a race chip navigates to the Assigned Races tab with that race selected.

The dashboard can use the existing `getAssignedRaces()` API for now. Published count can be derived from assigned race statuses until the real result-history API exists.

## Assigned Races Changes

`Assigned Races` should remove the month calendar toggle and keep only the operational timeline/list flow.

Current behavior:

- `RefereeOverviewPage` has local `view: "timeline" | "month"`.
- It renders `MonthRaceCalendar` when month view is selected.

Target behavior:

- `RefereeOverviewPage` always renders the day timeline/list.
- `MonthRaceCalendar` is no longer rendered inside `Assigned Races`.
- `RaceDetailDrawer` still opens when a race is selected.
- If route query params include `raceId`, the page auto-selects that race after loading assigned races.
- If the drawer was opened from `?raceId={id}` and the referee closes it, clear the `raceId` query param with history replacement.

Recommended URL:

```text
/referee/assigned-races?raceId=123
```

Why query param:

- It is simple and readable.
- It does not require a new nested route.
- It supports direct linking from the calendar.
- It keeps the selected race state recoverable on refresh.

Drawer close behavior:

```ts
setSelectedRace(undefined);
setSearchParams({}, { replace: true });
```

Use `replace: true` so closing the drawer does not add another browser history entry. This prevents stale `raceId` params from reopening the drawer when the referee switches tabs or returns to the page.

## Month Calendar Changes

Extend `MonthRaceCalendar` from static display into navigable race chips.

New props:

```ts
type MonthRaceCalendarProps = {
  races: AssignedRace[];
  referenceDate: Date;
  onRaceSelect?: (race: AssignedRace) => void;
};
```

Behavior:

- If `onRaceSelect` is provided, each race chip renders as a button.
- Clicking the chip calls `onRaceSelect(race)`.
- In Profile Dashboard, `onRaceSelect` should navigate to:

```ts
navigate(`/referee/assigned-races?raceId=${race.id}`);
```

Accessibility:

- race chips must be keyboard-accessible buttons or links;
- accessible name should include race code and race name, e.g. `Open R-2026-001 Royal Ascot Gold Cup`;
- current day can be visually highlighted, but the selected race should be controlled by Assigned Races after navigation.
- race chips need enough touch area for tablet/mobile field use. Use practical padding and a minimum height around `24px` or larger, plus vertical gap between chips when multiple races share one day cell.

## Data Flow

Profile Dashboard:

1. Load assigned races with `getAssignedRaces()`.
2. Normalize races with existing `normalizeAssignedRace()`.
3. Render KPI cards and `MonthRaceCalendar`.
4. On calendar race click, navigate to `/referee/assigned-races?raceId={id}`.

Assigned Races:

1. Load assigned races with `getAssignedRaces()`.
2. Normalize races.
3. Read `raceId` from `useSearchParams()`.
4. If matching race exists, set it as `selectedRace`.
5. Render timeline and matching `RaceDetailDrawer`.

If `raceId` does not match a race:

- render the normal Assigned Races page;
- do not show an error unless a clear user-facing message is wanted later.

## UI States

Profile Dashboard loading:

- use a light skeleton card layout similar to `RefereeOverviewPage`.

Profile Dashboard error:

- show retry button and error message.

Profile Dashboard empty calendar:

- show the month grid;
- days without races remain blank;
- show a small empty-state message above/below the calendar if there are no assigned races.

Assigned Races deep-link loading:

- page loads normally;
- selected drawer appears once data is available.

## Tests

Add focused frontend tests:

1. `RefereeLayout.test.tsx`
   - sidebar renders `Profile`, `Assigned Races`, and `Result History`;
   - removed tabs stay absent: `Pre-Race Checks`, `Submit Results`, `Reports & Violations`.

2. `RefereeProfileDashboardPage.test.tsx`
   - renders referee dashboard identity/KPI cards;
   - renders month calendar;
   - clicking a calendar race navigates to `/referee/assigned-races?raceId={id}`.

3. `RefereeOverviewPage.test.tsx`
   - no month calendar toggle appears in Assigned Races;
   - timeline still renders;
   - when route contains `?raceId={id}`, matching `RaceDetailDrawer` is shown.
   - closing the drawer clears `raceId` from the URL with replace behavior.
   - `/referee/assigned-races?raceId={id}` keeps `Assigned Races` active in the sidebar.

4. `MonthRaceCalendar.test.tsx`
   - race chips are buttons/links when selectable;
   - clicking a chip calls `onRaceSelect`.
   - selectable race chips have usable touch-target classes/min-height.

## Out Of Scope

- Editing referee profile details.
- Uploading avatar/certification documents.
- Backend profile endpoint.
- Persisting calendar preferences.
- Week/day calendar navigation beyond current month behavior.
- Replacing the timeline with a full scheduler component.

## Risks

- Changing `/referee` from Assigned Races to Profile may break old assumptions in tests and links. Update internal links intentionally.
- If `MonthRaceCalendar` renders buttons inside a dense grid, touch targets must remain usable.
- `raceId` query param selection must wait until async race loading completes.
- Stale `raceId` query params can reopen drawers unexpectedly if close behavior does not clear them.
- The same race data is loaded by both Profile and Assigned Races. This is acceptable for now; shared data caching can be added later if needed.
