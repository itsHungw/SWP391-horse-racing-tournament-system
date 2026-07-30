# Race Pulse Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the public `/races` page so the first view serves race-watchers with an adaptive Live → Latest Result/Highlight → Next Race feature, while prediction remains contextual.

**Architecture:** Keep the current public API and page-level data fetching. Add one pure selector that chooses the Race Pulse state from the existing upcoming/results collections, then render one compact hero and a calmer programme toolbar/list below it. Use the native `details` element for progressive filter disclosure and a neutral secondary segmented-control treatment for Agenda/Calendar.

**Tech Stack:** React 19, TypeScript, React Router, Tailwind CSS v4, Framer Motion, Vitest, Testing Library.

---

## File map

- Modify `frontend/src/pages/public/racingDiscovery.ts`: add the pure Race Pulse selection type and deterministic state selector.
- Modify `frontend/src/pages/public/racingDiscovery.test.ts`: cover live, latest official result, next-race, and empty-state precedence.
- Modify `frontend/src/pages/public/RacesPage.tsx`: replace the competing hero/replay blocks with one adaptive Race Pulse, use native filter disclosure, and reduce toolbar/list density.
- Modify `frontend/src/pages/public/components/SegmentedControl.tsx`: add a neutral active treatment for the Agenda/Calendar representation toggle without changing the gold scope selector.
- Modify `frontend/src/pages/public/components/RaceAgenda.tsx`: make the row action state-specific and keep prediction secondary.
- Modify `frontend/src/pages/public/RacesPage.test.tsx`: assert the new hero labels, action hierarchy, filter disclosure, and view toggle behavior.

No backend files or new dependencies are required. Do not revert the existing public-page work.

## Task 1: Add deterministic Race Pulse selection

**Files:**
- Modify: `frontend/src/pages/public/racingDiscovery.ts` near `rankRacesToPost`.
- Test: `frontend/src/pages/public/racingDiscovery.test.ts`.

- [ ] **Step 1: Add failing precedence tests**

Append these cases to the existing `public racing discovery helpers` suite:

```ts
it("selects a live race before any latest result", () => {
  const selected = selectRacePulse(
    [race(1, "2026-07-29T14:00:00", "ONGOING")],
    [race(2, "2026-07-28T14:00:00", "PUBLISHED")],
    new Date("2026-07-29T12:00:00"),
  );

  expect(selected).toMatchObject({ mode: "LIVE", race: { id: 1 } });
});

it("selects the latest official result when no race is live", () => {
  const selected = selectRacePulse(
    [],
    [
      race(1, "2026-07-27T14:00:00", "RESULT_CONFIRMED"),
      race(2, "2026-07-28T14:00:00", "PUBLISHED"),
    ],
    new Date("2026-07-29T12:00:00"),
  );

  expect(selected).toMatchObject({ mode: "LATEST_RESULT", race: { id: 2 } });
});

it("falls back to the nearest future race when no official result exists", () => {
  const selected = selectRacePulse(
    [race(1, "2026-07-28T14:00:00"), race(2, "2026-08-01T14:00:00")],
    [],
    new Date("2026-07-29T12:00:00"),
  );

  expect(selected).toMatchObject({ mode: "NEXT_RACE", race: { id: 2 } });
});

it("returns null when there is no live, official, or future race", () => {
  expect(selectRacePulse([], [], new Date("2026-07-29T12:00:00"))).toBeNull();
});
```

- [ ] **Step 2: Run the focused discovery test and verify it fails**

Run from `frontend`:

```powershell
npm test -- --run src/pages/public/racingDiscovery.test.ts
```

Expected: FAIL because `selectRacePulse` is not defined yet.

- [ ] **Step 3: Implement the minimal selector**

Add these types and function without changing `selectNextToPost` callers:

```ts
export type RacePulseMode = "LIVE" | "LATEST_RESULT" | "NEXT_RACE";
export type RacePulseSelection = { mode: RacePulseMode; race: RaceSummary };

export function selectRacePulse(upcoming: RaceSummary[], results: RaceSummary[], now = new Date()): RacePulseSelection | null {
  const byPostTime = (a: RaceSummary, b: RaceSummary) => timestamp(a.raceDateTime) - timestamp(b.raceDateTime);
  const live = upcoming
    .filter((race) => LIVE_RACES.has(race.status.toUpperCase()))
    .sort(byPostTime)[0];
  if (live) return { mode: "LIVE", race: live };

  const latestResult = results
    .filter((race) => OFFICIAL_RESULTS.has(race.status.toUpperCase()) || race.resultOfficial)
    .sort((a, b) => timestamp(b.raceDateTime, 0) - timestamp(a.raceDateTime, 0))[0];
  if (latestResult) return { mode: "LATEST_RESULT", race: latestResult };

  const nextRace = upcoming
    .filter((race) => !LIVE_RACES.has(race.status.toUpperCase()) && timestamp(race.raceDateTime) >= now.getTime())
    .sort(byPostTime)[0];
  return nextRace ? { mode: "NEXT_RACE", race: nextRace } : null;
}
```

- [ ] **Step 4: Re-run the focused discovery test**

Run the same command. Expected: all discovery tests pass, including the existing stale-scheduled-race and grouping coverage.

## Task 2: Replace the hero with the adaptive Race Pulse

**Files:**
- Modify: `frontend/src/pages/public/RacesPage.tsx`.
- Modify: `frontend/src/pages/public/RacesPage.test.tsx`.

- [ ] **Step 1: Update the page test fixtures and mocks**

Keep the existing `upcoming` fixture and add a published `latestResult` fixture with a winner and highlight response. Mock `getPublicRaceLiveStream` only if the implementation uses the existing live-media endpoint; otherwise keep live mode media-free and assert the live state label plus race-card action. Do not add a new API mock or endpoint.

- [ ] **Step 2: Replace `NextToPost` with a single Race Pulse renderer**

Use `selectRacePulse(heroUpcoming, heroResults)` and pass the selected mode to a component with this shape:

```tsx
type RacePulseProps = {
  selection: RacePulseSelection | null;
  latestHighlight: RaceMediaPublicResponse | null;
  nextRace: RaceSummary | null;
  authenticated: boolean;
};
```

Render labels and action hierarchy as follows:

- `LIVE`: eyebrow `Live now`; primary `Watch live` when published live media exists, otherwise `View race card`.
- `LATEST_RESULT`: eyebrow `Latest official result`; primary `Watch highlight` when media exists, otherwise `View full result`.
- `NEXT_RACE`: eyebrow `Next on the programme`; primary `View race card`; prediction is a secondary link only when `predictionOpen` is true.

Always show race identity, date/time, distance, field size, and winner only for an official result. Keep the supporting next-race module compact and do not render a second equal-weight replay card beside the hero.

- [ ] **Step 3: Make media/loading/error fallbacks stable**

Reserve the media panel dimensions while the highlight request is pending. If media returns `null` or errors, keep the result/race content and use the result/card action instead of a broken player. Preserve the existing retry behavior for page-level query errors.

- [ ] **Step 4: Update focused component assertions**

Change the existing expectations from `Next To Post`/`Latest replay` to the new labels. Add assertions that:

```ts
expect(await screen.findByText("Latest official result")).toBeInTheDocument();
expect(screen.getByRole("button", { name: /play.*highlight/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /view full result/i })).toBeInTheDocument();
expect(screen.queryByRole("link", { name: /^make prediction$/i })).not.toBeInTheDocument();
```

For the no-result fixture, assert `Next on the programme` and `View race card`; do not require a prediction button to be the primary action.

## Task 3: Separate scope, view, and filters visually

**Files:**
- Modify: `frontend/src/pages/public/RacesPage.tsx`.
- Modify: `frontend/src/pages/public/components/SegmentedControl.tsx`.
- Modify: `frontend/src/pages/public/components/RaceAgenda.tsx`.
- Test: `frontend/src/pages/public/RacesPage.test.tsx`.

- [ ] **Step 1: Add the neutral segmented-control accent**

Extend `SegmentedControl` from `accent: "gold" | "emerald"` to `accent: "gold" | "emerald" | "neutral"`. Keep gold and emerald behavior unchanged. For neutral, use a quiet translucent active surface and ivory text so the representation toggle cannot compete with the gold Upcoming/Results scope.

Use this selection logic:

```tsx
const activeSurface =
  accent === "emerald" ? "bg-emerald-glow" :
  accent === "neutral" ? "bg-white/[0.08]" :
  "bg-gold-400";
const activeText = accent === "neutral" ? "text-ivory" : "text-turf-950";
```

- [ ] **Step 2: Recompose the toolbar**

Keep the gold scope selector first. Place the neutral Agenda/Calendar toggle beside the programme heading or at the far edge of the toolbar. Replace the always-visible search/championship/date form with native `details/summary` disclosure labelled `Filters`; keep all existing URL updates and input labels unchanged inside the form. Show an active-filter count when `search`, `tournamentId`, `from`, or `to` is present.

Do not introduce a custom drawer component for desktop. Use the native element first and keep mobile behavior simple.

- [ ] **Step 3: Align agenda row actions with race state**

In `RaceAgenda`, keep race/time/runner metadata as the dominant scan. Render one bordered primary link based on `results` and race media availability already known by the page; render prediction as a low-emphasis text link only for an upcoming race with `predictionOpen`. Do not render two equal filled actions in every row.

- [ ] **Step 4: Update component assertions**

Preserve existing accessibility assertions for both radiogroups. Add checks that the view group receives the neutral treatment, the filter controls are inside the `Filters` disclosure, and the agenda row exposes `View race card` before any prediction link.

## Task 4: Focused validation and visual review

**Files:**
- No new production files.

- [ ] **Step 1: Run focused tests**

From `frontend`:

```powershell
npm test -- --run src/pages/public/racingDiscovery.test.ts src/pages/public/RacesPage.test.tsx
```

Expected: all discovery and race-page tests pass.

- [ ] **Step 2: Run the production build**

```powershell
npm run build
```

Expected: TypeScript and Vite build complete without errors.

- [ ] **Step 3: Perform browser review at three viewports**

Use the existing local frontend server and inspect `/races` at approximately 1440×900, 1024×900, and 390×844. Verify that the hero, first list row, and primary action are visible in a coherent scan; verify filter disclosure, focus rings, keyboard radio navigation, and reduced-motion behavior.

- [ ] **Step 4: Review the final diff**

Run:

```powershell
git diff --check
git diff --stat -- frontend/src/pages/public/RacesPage.tsx frontend/src/pages/public/racingDiscovery.ts frontend/src/pages/public/components/SegmentedControl.tsx frontend/src/pages/public/components/RaceAgenda.tsx frontend/src/pages/public/RacesPage.test.tsx frontend/src/pages/public/racingDiscovery.test.ts
```

Do not run unrelated backend/frontend suites unless the focused checks expose a shared regression. Do not create a commit automatically.

## Plan self-review

- Spec coverage: adaptive state precedence is covered by Task 1; hero hierarchy and fallbacks by Task 2; scope/view/filter separation and row actions by Task 3; responsive/accessibility/build checks by Task 4.
- Placeholder scan: all steps contain concrete paths, commands, and expected outcomes.
- Type consistency: `RacePulseSelection` is defined in Task 1 and consumed by the Task 2 component; the existing `RaceSummary` and `RaceMediaPublicResponse` types remain the data boundary.
