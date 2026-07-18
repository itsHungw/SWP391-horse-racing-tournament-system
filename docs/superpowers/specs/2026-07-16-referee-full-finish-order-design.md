# Referee Race Summary — Show Full Finish Order

## Problem

[RaceSummary.tsx](../../../frontend/src/pages/referee/race-day/RaceSummary.tsx) — the "Official
finish order" screen shown after a race finishes — only ever renders the top 3 finishers
(`rows.slice(0, 3)`, lines 195-245). Any 4th-and-lower finisher is invisible in the UI even
though it is still correctly included in the submitted result package (`finishedEntries` maps
over the full `rows` array, not the slice — [RaceSummary.tsx:81-91](../../../frontend/src/pages/referee/race-day/RaceSummary.tsx)).
Runners who never finished (scratched pre-race, or disqualified during the race —
`snapshot.outOfRace`) are not shown anywhere in this screen at all, even though they are also
part of the submitted package (`removedEntries`, lines 93-103).

## Goal

Referees reviewing the race before confirming should see every participant, not just the top 3:

- Top 3 finishers, as today.
- Remaining finishers (4th place and lower), with the same time-editing capability as the top 3.
- Runners who did not finish (scratched — labeled "DNF") or were disqualished ("DSQ"), shown
  read-only — no time to edit since they never crossed the line.

## Non-goals

- No change to `confirmResultPackage()`, the `finishedEntries`/`removedEntries` mapping, or any
  API call — the full participant set was already being submitted correctly; this is a
  display-only change.
- No change to how a runner becomes DNS/DSQ, or to the appeals board / incident history / report
  draft sections of this screen.

## Design

### New local component: `ResultRow`

Extract the existing top-3 row markup (badge, horse name, "Total time override" input, "Update
Time" button, "Saved" indicator, and the `actual + penalty = total` line) into a small local
component defined in the same file, above `RaceSummary`:

```tsx
type ResultRowData = {
  runner: LiveRunner;
  physicalPosition: number;
  actualSeconds: number;
  penaltySeconds: number;
  hasManualOverride: boolean;
  totalSeconds: number;
};

function ResultRow({
  row,
  position,
  confirmed,
  timeDraft,
  savedIndicatorVisible,
  onDraftChange,
  onSave,
}: {
  row: ResultRowData;
  position: number;
  confirmed: boolean;
  timeDraft: string;
  savedIndicatorVisible: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  // same JSX as today's inline row, using `position` for the "P{position}" badges
  // instead of the slice-local `index + 1`
}
```

`ResultRowData` mirrors the shape already produced by the `rows` `useMemo` in `RaceSummary`
(unchanged). `ResultRow` stays in `RaceSummary.tsx` rather than a new file — it's small, has no
purpose outside this screen, and is tightly coupled to `RaceSummary`'s local state
(`confirmed`, `timeDrafts`, `savedRunnerIds`), which it receives via props rather than owning.

### Three display sections, in order

Inside the existing `<section>` that currently only renders "Official top 3":

1. **"Official top 3"** — unchanged behavior: `rows.slice(0, 3)`, rendered via `<ResultRow position={index + 1} .../>`.
2. **"Remaining finish order"** — new, rendered only when `rows.length > 3`: `rows.slice(3)`,
   rendered via `<ResultRow position={index + 4} .../>` (same `ResultRow`, same editing
   capability, just continuing the position numbering).
3. **"Did not finish / disqualified"** — new, rendered only when `snapshot.outOfRace.length > 0`:
   a plain read-only list — horse name plus a badge reading `"DSQ"` when `runner.status ===
   "DSQ"`, otherwise `"DNF"` (covers the `"DNS"` status used for pre-race scratches, matching the
   `"DID_NOT_FINISH"` label already used when these runners are submitted in `removedEntries`).
   No input, no button — these runners never have a finish time to edit.

All three sections live above the existing "Appeals Board" block, which is unaffected.

### Why no submission-logic changes are needed

`confirmResultPackage()` already builds `finishedEntries` from the full `rows` array (not a
slice) and `removedEntries` from the full `snapshot.outOfRace` array. The UI was simply hiding
data it was already sending. This spec only changes what's rendered.

## Testing

Add to `RefereeOfficiatePage.test.tsx` (which already exercises `RaceSummary` directly with a
`snapshot` prop):

1. A snapshot with 4 leaderboard runners: assert the "Remaining finish order" heading appears,
   the 4th runner's horse name is present, and its "Override total time for {horse}" input is
   present and enabled (editable) — proving the "rest" section reuses the same editable row.
2. A snapshot with 3 or fewer leaderboard runners: assert the "Remaining finish order" heading is
   absent (`queryByRole`/`queryByText`) — proving the section doesn't render when there's nothing
   to show.
3. A snapshot with one `outOfRace` runner with `status: "DSQ"` and one with `status: "DNS"`:
   assert the "Did not finish / disqualified" heading appears, both horse names are present, the
   DSQ one shows a "DSQ" badge and the DNS one shows a "DNF" badge, and neither has an "Override
   total time for {horse}" input in the document — proving these rows are read-only.
