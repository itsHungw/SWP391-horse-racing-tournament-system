# Referee Live Race Clock — Smooth and Precise Finish Times

## Problem

During a live race ([RefereeOfficiatePage.tsx](../../../frontend/src/pages/referee/RefereeOfficiatePage.tsx)),
the race clock advances in fixed 500ms steps
(`REFEREE_RACE_DAY_CONFIG.operationTickMilliseconds` in
[refereeRaceDayConfig.ts](../../../frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts)),
driven by a plain `window.setInterval` that adds a constant increment on every fire
([RefereeOfficiatePage.tsx:136-146](../../../frontend/src/pages/referee/RefereeOfficiatePage.tsx)).

This causes two problems:

1. **Visually choppy clock.** The displayed elapsed time jumps `0 → 0.5 → 1 → 1.5 …` instead of
   counting continuously.
2. **Imprecise finish times.** `markRunnerFinished()`
   ([refereeRaceDayState.ts:146-180](../../../frontend/src/pages/referee/race-day/refereeRaceDayState.ts))
   stamps a runner's `finishMilliseconds` from `state.elapsedMilliseconds` — a value that is only
   as fresh as the last tick that happened to fire. A referee clicking "Finish {horse}" between
   ticks gets a time rounded to the nearest tick boundary (up to ±500ms off today, ±100ms even
   after a naive interval-shrink), not the real moment of the click. Because `setInterval` is not
   guaranteed to fire exactly on schedule (JS event-loop delays, background-tab throttling), the
   fixed-increment model can also drift from real wall-clock time over a multi-minute race.

## Goal

- The displayed race clock updates smoothly, ~10 times per second (every 100ms).
- A runner's captured finish time reflects the real wall-clock instant the referee clicked
  "Finish {horse}", accurate to the millisecond, regardless of tick timing.
- Existing pause semantics are preserved exactly: time under `RED_FLAGGED` / `ABORTED` must not
  count toward elapsed or finish times, same as today.

## Non-goals

- Not touching `SAFETY_CAR`'s reduced progress-bar speed multiplier logic, or any other race
  rules — only how elapsed time is measured and captured.
- Not fixing the pre-existing limitation where reloading the page mid-`ONGOING` race rebuilds
  live state from `elapsedMilliseconds: 0` (loses true progress). Out of scope for this change.
- Not changing `LiveRaceState`'s shape, `applyLiveTick()`, or `markRunnerFinished()` — both stay
  exactly as they are today, including their existing unit tests.

## Design

### New pure helper: `advanceLiveClock`

Add to `refereeRaceDayState.ts`:

```ts
export function advanceLiveClock(state: LiveRaceState, lastFlushAtMs: number, nowMs: number): LiveRaceState {
  const delta = nowMs - lastFlushAtMs;
  return delta > 0 ? applyLiveTick(state, delta) : state;
}
```

This reuses `applyLiveTick` unchanged (`applyLiveTick` already no-ops when `state.mode` isn't
`RACING`/`SAFETY_CAR`, so pause semantics are inherited for free). The only new behavior is that
the *increment* passed to `applyLiveTick` is a measured real-time delta instead of a hardcoded
constant.

### Component wiring: `RefereeOfficiatePage.tsx`

- Add `const lastTickAtRef = useRef(Date.now());`.
- Add a `flushClock` helper:

  ```ts
  const flushClock = useCallback((current: LiveRaceState) => {
    const now = Date.now();
    const next = advanceLiveClock(current, lastTickAtRef.current, now);
    lastTickAtRef.current = now;
    return next;
  }, []);
  ```

- **Periodic tick** (existing `useEffect` with `window.setInterval`): replace the fixed-increment
  call with `setLive((current) => flushClock(current));`. Interval cadence changes from 500ms to
  100ms (`operationTickMilliseconds: 500 → 100` in `refereeRaceDayConfig.ts`).
- **Finish click** (`onRunnerFinish` prop passed to `LiveRaceWorkspace`): flush before marking
  finished, so the captured time reflects this exact instant:

  ```ts
  onRunnerFinish={(participantId: number) =>
    setLive((current) => markRunnerFinished(flushClock(current), participantId, new Date().toISOString()))
  }
  ```

- **Flag changes** (`changeFlag`, covers Safety Car / Red Flag / Abort): flush before applying the
  new flag, so no real time leaks across the pause boundary in either direction:

  ```ts
  setLive((current) => setLiveFlag(flushClock(current), mode, new Date().toISOString()));
  ```

- **Race start** (`enterLive()`) and the **mid-`ONGOING` reload branch** (inside `load()`, where
  `normalizedRace.status === "ONGOING"`): reset `lastTickAtRef.current = Date.now();` at the same
  point the live state is (re)initialized. Without this, the ref would still hold the
  component-mount timestamp, and the first flush after entering live would incorrectly fold the
  entire pre-race-check duration into the race clock.

### Why this is enough

- `advanceLiveClock` is pure and takes plain millisecond numbers — no fake timers needed to test
  it.
- `markRunnerFinished` and `applyLiveTick` are untouched, so their existing unit tests keep
  passing unmodified.
- Precision is achieved by *when* `flushClock` is called (right before the click is handled), not
  by shrinking the tick interval further — so it doesn't depend on tick granularity at all.

## Testing

1. **Unit test** for `advanceLiveClock` in `refereeRaceDayState.test.ts`: given a `RACING` state
   and `lastFlushAtMs`/`nowMs` that differ by a non-round number (e.g. 347ms), assert elapsed
   increases by exactly that delta — proving precision isn't rounded to any tick boundary.
2. **Component test** in `RefereeOfficiatePage.test.tsx`: `vi.spyOn(Date, "now")` returns a fixed
   constant through pre-race setup (so elapsed stays exactly 0, no drift from incidental calls),
   then is bumped by exactly `+350` immediately before firing the "Finish Golden Arrow" click.
   After completing the confirm flow, assert `submitRaceResultPackage` was called with
   `rawFinishTimeSeconds: 0.35` for that participant — proving the full pipeline (click → flush →
   `finishMilliseconds` → results package) carries the precise value through, not a
   tick-rounded one.
