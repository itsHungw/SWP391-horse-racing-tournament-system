# Referee Submit Results — Match RaceSummary's Grouped Layout

## Problem

There are two referee-facing screens for entering/reviewing race results:

- [RaceSummary.tsx](../../../frontend/src/pages/referee/race-day/RaceSummary.tsx) ("Official
  finish order") — shown right after the live race workspace finishes, in the same session.
  Splits runners into "Official top 3", "Remaining finish order", and "Did not finish /
  disqualified" (read-only) sections, with `P{n}` badges.
- [SubmitResultsPage.tsx](../../../frontend/src/pages/referee/SubmitResultsPage.tsx) ("Submit
  race results") — the durable, always-reachable form at `/referee/races/:id/results`, used
  whenever the referee reopens results editing (e.g. after the organizer sends results back).
  Currently renders every participant as one flat list, in whatever order the backend returns
  them, with no grouping or position badges.

The referee wants `SubmitResultsPage.tsx` to visually match `RaceSummary.tsx`'s grouped
presentation, so the two screens feel like the same workflow.

## Goal

`SubmitResultsPage.tsx` groups its rows into the same three visual sections as `RaceSummary.tsx`
("Official top 3" / "Remaining finish order" / "Did not finish / disqualified"), styled the same
way (card shape, `P{n}` badges).

## Non-goals

- No change to how positions/times are entered. `SubmitResultsPage.tsx` keeps its existing model:
  the referee manually types `Position`, edits `Time seconds` directly (no draft-then-"Update
  Time" staging step like `RaceSummary.tsx` has), and picks `Result status` from a dropdown.
- No change to `handleSave`, duplicate-position validation, or any API call.
- No shared component between `RaceSummary.tsx`'s `ResultRow` and `SubmitResultsPage.tsx` — the
  two pages have different field models (`RaceSummary` computes position from sorted time and
  edits a total-time override; `SubmitResultsPage` edits position/time/status directly) and
  different data sources (in-memory session snapshot vs. a fresh API fetch), so forcing a shared
  row component would be an awkward fit. Only the CSS/layout patterns are mirrored.
- Read-only mode (added in the prior fix) is unaffected — when `isReadOnly` is true, the same
  grouped layout renders, just with all inputs disabled as today.

## Design

### Grouping logic

Inside `SubmitResultsPage`, derive three arrays from `entries` on every render (no memoization
needed — the list is small):

```ts
const finishedEntries = entries
  .map((entry, index) => ({ entry, index }))
  .filter(({ entry }) => entry.status === "FINISHED")
  .sort((a, b) => {
    const positionA = typeof a.entry.position === "number" ? a.entry.position : Number.POSITIVE_INFINITY;
    const positionB = typeof b.entry.position === "number" ? b.entry.position : Number.POSITIVE_INFINITY;
    return positionA - positionB || a.index - b.index;
  });

const otherEntries = entries
  .map((entry, index) => ({ entry, index }))
  .filter(({ entry }) => entry.status !== "FINISHED");
```

Each wrapped item keeps `index` — the original position in the `entries` array — so
`handleNumberChange(index, ...)` / `handleStatusChange(index, ...)` (which operate on `entries`
by index) keep working unchanged regardless of which visual group a row is currently in.

`finishedEntries.slice(0, 3)` renders under "Official top 3" (badges `P1`/`P2`/`P3`).
`finishedEntries.slice(3)` renders under "Remaining finish order" (badges `P4`, `P5`, ... —
`index + 4` within that slice), only shown when `finishedEntries.length > 3`.
`otherEntries` renders under "Did not finish / disqualified", only shown when
`otherEntries.length > 0` — no position badge, since these runners have no finish position.

Because sorting is recomputed on every render from live `entries` state (no draft/save staging
in this page), the Top 3 / Remaining grouping reorders immediately as the referee types a new
Position value — this is an accepted, intentional trade-off of keeping the existing direct-edit
input model instead of adding a staging step.

### Row rendering

Reuse the exact same three inputs (Position, Time seconds, Result status) and their existing
`disabled`/`onChange` wiring — unchanged from the current implementation, including the
already-shipped `disabled={isReadOnly || entry.status !== "FINISHED"}` rule on Position/Time.
Restyle the row wrapper to match `RaceSummary.tsx`'s card:
`rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4` (currently
`rounded-lg border border-slate-200 bg-slate-50 p-4`), and add a `P{n}` badge
(`rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white`) for rows in the
Top 3 / Remaining groups. Rows in "Did not finish / disqualified" render without a badge.

### Section headers

Add `<h3>` headers above each group, matching `RaceSummary.tsx`'s heading style
(`text-sm font-black uppercase tracking-widest text-slate-700`): "Official top 3", "Remaining
finish order" (conditional), "Did not finish / disqualified" (conditional).

## Testing

Add to `SubmitResultsPage.test.tsx`:

1. Four entries with distinct `position` values and `status: "FINISHED"`: assert "Remaining
   finish order" heading appears, and the entry with `position: 4` renders under it with a `P4`
   badge.
2. Two `FINISHED` entries and one `DID_NOT_FINISH` entry: assert "Did not finish / disqualified"
   heading appears, the DNF entry's `Result status` `<select>` is enabled (not disabled) while
   its Position/Time inputs stay disabled (already covered by the existing per-status disable
   test, this test only needs to confirm the DNF entry renders in the new section without a
   position badge).
3. Two `FINISHED` entries with positions `2` and `1` (out of natural array order): assert the
   entry with `position: 1` renders before the entry with `position: 2` in the DOM (grouping
   reorders by typed position, not array order).
