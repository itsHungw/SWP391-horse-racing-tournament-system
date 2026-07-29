# Referee Live Race Clock Precision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live race clock in `RefereeOfficiatePage.tsx` tick smoothly (~10x/second) and capture each runner's finish time to the exact millisecond of the referee's click, instead of rounding to the last periodic tick.

**Architecture:** Add a pure `advanceLiveClock(state, lastFlushAtMs, nowMs)` helper that measures a real wall-clock delta and feeds it to the existing `applyLiveTick`. `RefereeOfficiatePage.tsx` tracks the wall-clock time of the last flush in a `useRef` and calls a `flushClock` wrapper before every periodic tick, every runner-finish click, and every flag change (Safety Car / Red Flag / Abort) — so no real time is ever lost or double-counted across pauses, and a finish click always reads a freshly-flushed, millisecond-accurate elapsed time.

**Tech Stack:** React + TypeScript, Vitest + `@testing-library/react`.

## Global Constraints

- Do not change `LiveRaceState`'s shape, `applyLiveTick()`, or `markRunnerFinished()` — their existing unit tests in `refereeRaceDayState.test.ts` must keep passing unmodified.
- Pause semantics (no elapsed time during `RED_FLAGGED`/`ABORTED`) must be preserved exactly.
- Follow TDD: write each failing test before the corresponding implementation.

---

### Task 1: `advanceLiveClock` pure helper

**Files:**
- Modify: `frontend/src/pages/referee/race-day/refereeRaceDayState.ts`
- Modify: `frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts`

**Interfaces:**
- Consumes: `LiveRaceState` (from `./refereeRaceDayModels`), `applyLiveTick(state: LiveRaceState, elapsedMilliseconds: number): LiveRaceState` (already exported from the same file, unchanged).
- Produces: `advanceLiveClock(state: LiveRaceState, lastFlushAtMs: number, nowMs: number): LiveRaceState` — new export from `refereeRaceDayState.ts`, consumed by Task 2.

- [ ] **Step 1: Write the failing tests**

Add these two tests to `frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts`, inside the existing `describe("refereeRaceDayState", ...)` block, right after the `"excludes scratched horses from live runners"` test:

```ts
  it("advances the live clock by the real elapsed delta, not a fixed tick size", () => {
    const next = advanceLiveClock(liveState, 1_000, 1_347);

    expect(next.elapsedMilliseconds).toBe(liveState.elapsedMilliseconds + 347);
  });

  it("does not advance the live clock when no time has passed", () => {
    const next = advanceLiveClock(liveState, 1_000, 1_000);

    expect(next).toBe(liveState);
  });
```

Also update the import at the top of the file to include `advanceLiveClock`:

```ts
import {
  advanceLiveClock,
  applyLiveTick,
  applyPenalty,
  buildLiveRunners,
  canOpenPreRaceCheck,
  createFinishedSnapshot,
  markRunnerFinished,
  setLiveFlag,
} from "./refereeRaceDayState";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx vitest run src/pages/referee/race-day/refereeRaceDayState.test.ts -t "advances the live clock"`

Expected: FAIL — `advanceLiveClock` is not exported yet (TypeScript/module error, or `undefined is not a function`).

- [ ] **Step 3: Implement `advanceLiveClock`**

In `frontend/src/pages/referee/race-day/refereeRaceDayState.ts`, add this new exported function directly after the closing brace of `applyLiveTick` (i.e. after line 157, before `export function markRunnerFinished`):

```ts
export function advanceLiveClock(state: LiveRaceState, lastFlushAtMs: number, nowMs: number): LiveRaceState {
  const delta = nowMs - lastFlushAtMs;
  return delta > 0 ? applyLiveTick(state, delta) : state;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/pages/referee/race-day/refereeRaceDayState.test.ts`

Expected: all tests in the file PASS (the 2 new ones plus all pre-existing ones, unmodified).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/referee/race-day/refereeRaceDayState.ts frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts
git commit -m "feat: add wall-clock-accurate live race clock helper"
```

---

### Task 2: Wire the precise clock into RefereeOfficiatePage

**Files:**
- Modify: `frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts`
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.tsx`
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`

**Interfaces:**
- Consumes: `advanceLiveClock(state: LiveRaceState, lastFlushAtMs: number, nowMs: number): LiveRaceState` from Task 1 (`./race-day/refereeRaceDayState`).
- Produces: no new exports — internal behavior change to `RefereeOfficiatePage`.

- [ ] **Step 1: Write the failing test**

Add this test to `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`, inside the existing `describe("RefereeOfficiatePage", ...)` block, right after the `"includes a scratched runner in the submitted result package"` test:

```tsx
  it("captures a precise finish time between ticks instead of rounding to the tick size", async () => {
    const baseNow = 1_800_000_000_000;
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(baseNow);

    try {
      renderPage();

      fireEvent.click(await screen.findByRole("button", { name: "Mark race ready" }));
      fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
      expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();

      dateNowSpy.mockReturnValue(baseNow + 350);
      fireEvent.click(screen.getByRole("button", { name: "Finish Golden Arrow" }));
      fireEvent.click(screen.getByRole("button", { name: "PROCEED TO POST-RACE" }));

      fireEvent.click(await screen.findByRole("button", { name: "Update finish order" }));
      fireEvent.click(screen.getByRole("button", { name: "Confirm official result" }));

      const submitSpy = vi.mocked(refereeApi.submitRaceResultPackage);
      expect(submitSpy).toHaveBeenCalled();
      const payload = submitSpy.mock.calls[0][1];
      const goldenArrowEntry = payload.results.find((entry) => entry.participantId === 7);
      expect(goldenArrowEntry?.rawFinishTimeSeconds).toBe(0.35);
    } finally {
      dateNowSpy.mockRestore();
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/pages/referee/RefereeOfficiatePage.test.tsx -t "captures a precise finish time"`

Expected: FAIL — with the current fixed-tick model, `markRunnerFinished` reads `state.elapsedMilliseconds`, which is still `0` (no tick has fired synchronously), so `rawFinishTimeSeconds` will be `0`, not `0.35`.

- [ ] **Step 3: Shrink the tick interval**

In `frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts`, change:

```ts
  operationTickMilliseconds: 500,
```

to:

```ts
  operationTickMilliseconds: 100,
```

- [ ] **Step 4: Wire `flushClock` into RefereeOfficiatePage.tsx**

In `frontend/src/pages/referee/RefereeOfficiatePage.tsx`:

Change the React import (line 1) from:

```tsx
import { useCallback, useEffect, useMemo, useState } from "react";
```

to:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
```

Change the `refereeRaceDayState` import (lines 26-34) from:

```tsx
import {
  applyLiveTick,
  applyPenalty,
  buildLiveRunners,
  buildScratchedRunners,
  createFinishedSnapshot,
  markRunnerFinished,
  setLiveFlag,
} from "./race-day/refereeRaceDayState";
```

to:

```tsx
import {
  advanceLiveClock,
  applyPenalty,
  buildLiveRunners,
  buildScratchedRunners,
  createFinishedSnapshot,
  markRunnerFinished,
  setLiveFlag,
} from "./race-day/refereeRaceDayState";
```

(`applyLiveTick` is dropped from the import — it's only called from inside `advanceLiveClock` now, no longer directly from this file.)

Add the ref and `flushClock` helper right after the `error` state declaration (after `const [error, setError] = useState<string>();`, before `const load = useCallback(...)`):

```tsx
  const [error, setError] = useState<string>();
  const lastTickAtRef = useRef(Date.now());

  const flushClock = useCallback((current: LiveRaceState) => {
    const now = Date.now();
    const next = advanceLiveClock(current, lastTickAtRef.current, now);
    lastTickAtRef.current = now;
    return next;
  }, []);
```

In `load()`, the `ONGOING` branch — change:

```tsx
      if (normalizedRace.status === "ONGOING") {
        setLive(
          setLiveFlag(
            {
              ...EMPTY_LIVE_STATE,
              runners: buildLiveRunners(normalizedParticipants),
              outOfRace: buildScratchedRunners(normalizedParticipants),
            },
            "RACING",
            new Date().toISOString()
          )
        );
      }
```

to:

```tsx
      if (normalizedRace.status === "ONGOING") {
        lastTickAtRef.current = Date.now();
        setLive(
          setLiveFlag(
            {
              ...EMPTY_LIVE_STATE,
              runners: buildLiveRunners(normalizedParticipants),
              outOfRace: buildScratchedRunners(normalizedParticipants),
            },
            "RACING",
            new Date().toISOString()
          )
        );
      }
```

The periodic-tick `useEffect` — change:

```tsx
  useEffect(() => {
    if (stage !== "ONGOING" || (live.mode !== "RACING" && live.mode !== "SAFETY_CAR")) {
      return;
    }

    const timer = window.setInterval(() => {
      setLive((current) => applyLiveTick(current, REFEREE_RACE_DAY_CONFIG.operationTickMilliseconds));
    }, REFEREE_RACE_DAY_CONFIG.operationTickMilliseconds);

    return () => window.clearInterval(timer);
  }, [live.mode, stage]);
```

to:

```tsx
  useEffect(() => {
    if (stage !== "ONGOING" || (live.mode !== "RACING" && live.mode !== "SAFETY_CAR")) {
      return;
    }

    const timer = window.setInterval(() => {
      setLive((current) => flushClock(current));
    }, REFEREE_RACE_DAY_CONFIG.operationTickMilliseconds);

    return () => window.clearInterval(timer);
  }, [live.mode, stage, flushClock]);
```

`enterLive()` — change:

```tsx
      await startRace(raceId);
      setLive(
        setLiveFlag(
          { ...EMPTY_LIVE_STATE, runners, outOfRace: buildScratchedRunners(participants) },
          "RACING",
          new Date().toISOString()
        )
      );
```

to:

```tsx
      await startRace(raceId);
      lastTickAtRef.current = Date.now();
      setLive(
        setLiveFlag(
          { ...EMPTY_LIVE_STATE, runners, outOfRace: buildScratchedRunners(participants) },
          "RACING",
          new Date().toISOString()
        )
      );
```

`changeFlag` — change:

```tsx
    setLive((current) => setLiveFlag(current, mode, new Date().toISOString()));
```

to:

```tsx
    setLive((current) => setLiveFlag(flushClock(current), mode, new Date().toISOString()));
```

The `onRunnerFinish` prop passed to `LiveRaceWorkspace` — change:

```tsx
          onRunnerFinish={(participantId: number) =>
            setLive((current) => markRunnerFinished(current, participantId, new Date().toISOString()))
          }
```

to:

```tsx
          onRunnerFinish={(participantId: number) =>
            setLive((current) => markRunnerFinished(flushClock(current), participantId, new Date().toISOString()))
          }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/pages/referee/RefereeOfficiatePage.test.tsx`

Expected: all tests in the file PASS, including the new precision test.

- [ ] **Step 6: Run the wider referee test suite to check for regressions**

Run: `cd frontend && npx vitest run src/pages/referee`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts frontend/src/pages/referee/RefereeOfficiatePage.tsx frontend/src/pages/referee/RefereeOfficiatePage.test.tsx
git commit -m "feat: smooth and precisely-timed live race clock"
```
