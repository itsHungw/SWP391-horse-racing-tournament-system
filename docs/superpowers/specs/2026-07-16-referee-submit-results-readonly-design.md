# Referee Submit Results — Read-only After Submission

## Problem

`SubmitResultsPage.tsx` (route `/referee/races/:id/results`) has no awareness of the race's
current status. Once a referee has submitted a result package for a race (backend moves
`race.status` from `FINISHED` to `RESULT_SUBMITTED`, and later `RESULT_CONFIRMED` /
`PUBLISHED` as the organizer acts on it), the page still renders the full editable finish-order
form and an active "Confirm result package" button on every subsequent visit.

Per BR-16, a referee may submit results only once per race, while `race.status === FINISHED`.
Any later submission attempt is rejected by the backend with 400 `"Race must be finished before
results can be submitted"` ([RefereeRaceDayService.java:207-209](../../../backend/src/main/java/com/example/horseracingtournamentsystem/referee/service/RefereeRaceDayService.java)).
Referees hitting this button after the fact see a generic failure message and have no way to
tell whether their original submission actually reached the organizer, causing confusion
(the underlying case that prompted this fix: [fix/referee-confirm-result](../../../)).

## Goal

When a referee revisits the results page for a race that has already left `FINISHED` status
(`RESULT_SUBMITTED`, `RESULT_CONFIRMED`, `PUBLISHED`), the page must render as a read-only
summary of what was submitted, with no way to trigger another submission.

## Non-goals

- No backend changes. `RefereeRaceDayService.getResultEntries()` already returns the saved
  `RaceResult` rows once they exist, so the finish-order table already shows correct data —
  this is purely a frontend gating change.
- Not touching `RaceSummary.tsx` (the race-day "Official top 3" screen) — its `confirmed` state
  already locks the button within the same session, and it is out of scope here.
- Not building an "edit already-submitted results" flow. Per BR-16 the only way to edit already-
  submitted results is via organizer "reopen," which is unrelated to this page.

## Design

### Data fetch

Add `getAssignedRace(raceId)` to the existing `useEffect` load, run in parallel with
`getRaceResultEntries(raceId)` via `Promise.all`, matching the pattern already used in
`RefereeOfficiatePage.tsx`. Store the result in a new `race` state value (type `RaceSummary`
from `refereeApi.ts`, which already includes `status: string`).

### Read-only gate

```
const isReadOnly = race != null && race.status !== "FINISHED";
```

### Read-only rendering rules

When `isReadOnly` is true:

1. **Status banner** — a message block above the finish-order table, keyed off `race.status`:
   - `RESULT_SUBMITTED` → "Results submitted — awaiting organizer confirmation."
   - `RESULT_CONFIRMED` → "Results confirmed by the organizer."
   - `PUBLISHED` → "Results published."
   - any other non-`FINISHED` value (defensive fallback, e.g. `CANCELLED`) →
     "Results already submitted."
2. **Finish-order inputs disabled** — the Position input, Time seconds input, and Result status
   `<select>` for every row get the `disabled` attribute. Values still come from the entries
   already loaded (the submitted numbers), so the referee can see exactly what was recorded.
3. **Confirmation path panel hidden** — the entire right-hand aside ("Needs admin review"
   checkbox, review-reason textarea, desktop "Confirm result package" button) is not rendered.
4. **Mobile fixed action bar hidden** — the bottom-fixed submit button (mobile viewport) is not
   rendered either.

When `isReadOnly` is false (`race.status === "FINISHED"`), the page behaves exactly as it does
today — no change.

### Error handling

If `getAssignedRace` fails while `getRaceResultEntries` succeeds (or vice versa), fall back to
the existing error message path (`"Unable to load result entries."`) — do not add a second,
separate error state for this one extra fetch.

## Testing

Add a test to `SubmitResultsPage.test.tsx` for a race in `RESULT_SUBMITTED` status:
- Mocks `getAssignedRace` to return `status: "RESULT_SUBMITTED"`.
- Asserts the status banner text is present.
- Asserts the Position/Time/Status inputs are disabled.
- Asserts no "Confirm result package" or "Submit for review" button exists in the DOM.

Existing tests (race implicitly `FINISHED` via default mock, or no status mocked) must continue
to pass unchanged — the default/happy-path editable flow is not touched.
