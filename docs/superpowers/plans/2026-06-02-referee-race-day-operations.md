# Referee Race-Day Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the API-ready frontend race-day operations slice from assigned-race timeline through pre-race verification, live simulator controls, incidents, and finished draft summary.

**Architecture:** Keep `/referee` as the assigned-race landing view and use `/referee/races/:id/officiate` as the state-driven master workspace. Reuse a timeline component inside the pre-race workspace, isolate simulator behavior in a pure reducer, and keep presentation components small so the existing oversized `RefereeOfficiatePage.tsx` can be replaced safely.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS 4, Vitest 3, Testing Library.

---

## Scope Notes

- Preserve the current uncommitted edits in `frontend/src/pages/referee/RefereeOverviewPage.tsx` and `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`. Modify them incrementally; do not reset or overwrite them blindly.
- Do not add WebSocket integration in this sprint.
- Do not add post-race adjudication, animated final sorting, photo-finish override, complaints, or publish-result logic.
- Keep the existing backend endpoints intact. This sprint adds a frontend mock adapter and local simulator state that can later be replaced by backend events.

## File Structure

Create:

- `frontend/src/pages/referee/race-day/refereeRaceDayModels.ts`
- `frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts`
- `frontend/src/pages/referee/race-day/refereeRaceDayState.ts`
- `frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts`
- `frontend/src/pages/referee/race-day/AssignedRaceTimeline.tsx`
- `frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx`
- `frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx`
- `frontend/src/pages/referee/race-day/PreRaceChecklist.tsx`
- `frontend/src/pages/referee/race-day/ReadyLineupPanel.tsx`
- `frontend/src/pages/referee/race-day/RaceSimulator.tsx`
- `frontend/src/pages/referee/race-day/LiveLeaderboard.tsx`
- `frontend/src/pages/referee/race-day/LiveIncidentLog.tsx`
- `frontend/src/pages/referee/race-day/LiveRaceWorkspace.tsx`
- `frontend/src/pages/referee/race-day/RaceSummary.tsx`
- `frontend/src/pages/referee/race-day/PreRaceChecklist.test.tsx`
- `frontend/src/pages/referee/race-day/LiveRaceWorkspace.test.tsx`

Modify:

- `frontend/src/api/refereeApi.ts`
- `frontend/src/pages/referee/RefereeOverviewPage.tsx`
- `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`
- `frontend/src/pages/referee/RefereeOfficiatePage.tsx`
- `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`
- `frontend/src/styles.css`

## Task 1: Add Race-Day Models, Config, and Pure State Logic

**Files:**

- Create: `frontend/src/pages/referee/race-day/refereeRaceDayModels.ts`
- Create: `frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts`
- Create: `frontend/src/pages/referee/race-day/refereeRaceDayState.ts`
- Create: `frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts`

- [ ] **Step 1: Write failing tests for guards, scratching, simulator flags, penalties, and snapshot creation**

Create `frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyLiveTick,
  applyPenalty,
  buildLiveRunners,
  canOpenPreRaceCheck,
  createFinishedSnapshot,
  setLiveFlag,
} from "./refereeRaceDayState";
import { LiveRaceState, PreRaceParticipant } from "./refereeRaceDayModels";

const participants: PreRaceParticipant[] = [
  {
    participantId: 7,
    horseName: "Golden Arrow",
    jockeyName: "Mina Park",
    equipmentOk: true,
    healthOk: true,
    status: "PASSED",
  },
  {
    participantId: 5,
    horseName: "Thunderstrike",
    jockeyName: "Julian Sterling",
    equipmentOk: true,
    healthOk: false,
    status: "SCRATCHED",
    scratchedReason: "Failed health check",
  },
];

const liveState: LiveRaceState = {
  mode: "RACING",
  elapsedMilliseconds: 8_000,
  runners: [
    { participantId: 7, horseName: "Golden Arrow", gateNumber: 1, progressPercent: 70, speedMultiplier: 1, status: "RUNNING" },
    { participantId: 3, horseName: "Night Bloom", gateNumber: 2, progressPercent: 60, speedMultiplier: 0.96, status: "RUNNING" },
  ],
  outOfRace: [],
  incidents: [],
};

describe("refereeRaceDayState", () => {
  it("enforces the 60-minute production guard and allows same-day demo bypass", () => {
    const scheduledAt = "2026-06-02T14:00:00+07:00";
    expect(canOpenPreRaceCheck(scheduledAt, new Date("2026-06-02T12:30:00+07:00"), false)).toBe(false);
    expect(canOpenPreRaceCheck(scheduledAt, new Date("2026-06-02T13:15:00+07:00"), false)).toBe(true);
    expect(canOpenPreRaceCheck(scheduledAt, new Date("2026-06-02T12:30:00+07:00"), true)).toBe(true);
    expect(canOpenPreRaceCheck(scheduledAt, new Date("2026-06-01T13:15:00+07:00"), true)).toBe(false);
  });

  it("excludes scratched horses from live runners", () => {
    expect(buildLiveRunners(participants).map((runner) => runner.participantId)).toEqual([7]);
  });

  it("keeps runners moving without overtaking during safety car", () => {
    const safetyCar = setLiveFlag(liveState, "SAFETY_CAR", "2026-06-02T14:08:00+07:00");
    const next = applyLiveTick(safetyCar, 1_000);
    expect(next.runners[0].progressPercent).toBeGreaterThan(70);
    expect(next.runners[1].progressPercent).toBeGreaterThan(60);
    expect(next.runners[0].progressPercent).toBeGreaterThan(next.runners[1].progressPercent);
  });

  it("freezes runner progress during a red flag", () => {
    const stopped = setLiveFlag(liveState, "RED_FLAGGED", "2026-06-02T14:09:00+07:00");
    expect(applyLiveTick(stopped, 1_000).runners).toEqual(stopped.runners);
  });

  it("records five-second penalties without changing physical order", () => {
    const next = applyPenalty(liveState, 3, "PENALTY_5S", "2026-06-02T14:10:00+07:00");
    expect(next.runners).toEqual(liveState.runners);
    expect(next.incidents[0]).toMatchObject({ participantId: 3, penaltySeconds: 5 });
  });

  it("moves disqualified runners to out of race with final telemetry", () => {
    const next = applyPenalty(liveState, 3, "DSQ", "2026-06-02T14:11:00+07:00");
    expect(next.runners.map((runner) => runner.participantId)).toEqual([7]);
    expect(next.outOfRace[0]).toMatchObject({ participantId: 3, progressPercent: 60, status: "DSQ" });
  });

  it("only creates a finished snapshot once the leader reaches ninety percent", () => {
    expect(createFinishedSnapshot(liveState)).toBeNull();
    const eligible = { ...liveState, runners: liveState.runners.map((runner, index) => index === 0 ? { ...runner, progressPercent: 92 } : runner) };
    expect(createFinishedSnapshot(eligible)).toMatchObject({ elapsedMilliseconds: 8_000 });
  });
});
```

- [ ] **Step 2: Run the state tests and confirm they fail**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/refereeRaceDayState.test.ts
```

Expected: FAIL because the race-day modules do not exist.

- [ ] **Step 3: Create models and configuration**

Create `frontend/src/pages/referee/race-day/refereeRaceDayModels.ts`:

```ts
export type WorkspaceStage = "PRE_CHECKING" | "READY" | "ONGOING" | "FINISHED_DRAFT" | "ABORTED";
export type LiveMode = "IDLE" | "RACING" | "SAFETY_CAR" | "RED_FLAGGED" | "ABORTED" | "FINISHED_DRAFT";
export type PenaltyAction = "WARNING" | "PENALTY_5S" | "DSQ";

export type AssignedRace = {
  id: number;
  code: string;
  name: string;
  scheduledAt: string;
  venue: string;
  distanceMeters: number;
  status: string;
};

export type PreRaceParticipant = {
  participantId: number;
  horseName: string;
  jockeyName: string;
  jockeyWeight?: number;
  equipmentOk: boolean;
  healthOk: boolean;
  status: "CHECK_HEALTH" | "PASSED" | "SCRATCHED";
  scratchedReason?: string;
};

export type LiveRunner = {
  participantId: number;
  horseName: string;
  gateNumber: number;
  progressPercent: number;
  speedMultiplier: number;
  status: "RUNNING" | "DNS" | "DNF" | "DSQ";
};

export type RaceIncident = {
  id: string;
  occurredAt: string;
  type: "FLAG" | "WARNING" | "PENALTY" | "DSQ";
  participantId?: number;
  message: string;
  penaltySeconds?: number;
};

export type RaceSnapshot = {
  raceId?: number;
  elapsedMilliseconds: number;
  leaderboard: LiveRunner[];
  outOfRace: LiveRunner[];
  incidents: RaceIncident[];
};

export type LiveRaceState = {
  mode: LiveMode;
  elapsedMilliseconds: number;
  runners: LiveRunner[];
  outOfRace: LiveRunner[];
  incidents: RaceIncident[];
};
```

Create `frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts`:

```ts
export const REFEREE_RACE_DAY_CONFIG = {
  preRaceUnlockMinutes: 60,
  chequeredFlagUnlockPercent: 90,
  normalProgressPerSecond: 1.4,
  safetyCarProgressPerSecond: 0.45,
  simulatorTickMilliseconds: 500,
} as const;
```

- [ ] **Step 4: Implement the pure state helpers**

Create `frontend/src/pages/referee/race-day/refereeRaceDayState.ts`:

```ts
import { REFEREE_RACE_DAY_CONFIG } from "./refereeRaceDayConfig";
import {
  LiveRaceState,
  LiveRunner,
  PenaltyAction,
  PreRaceParticipant,
  RaceIncident,
  RaceSnapshot,
} from "./refereeRaceDayModels";

const incident = (type: RaceIncident["type"], occurredAt: string, message: string, participantId?: number, penaltySeconds?: number): RaceIncident => ({
  id: `${occurredAt}-${type}-${participantId ?? "race"}`,
  occurredAt,
  type,
  message,
  participantId,
  penaltySeconds,
});

export function canOpenPreRaceCheck(scheduledAt: string, now: Date, demoMode: boolean) {
  const start = new Date(scheduledAt);
  const sameDay = start.toDateString() === now.toDateString();
  if (!sameDay) return false;
  if (demoMode) return true;
  const millisecondsUntilStart = start.getTime() - now.getTime();
  return millisecondsUntilStart >= 0 && millisecondsUntilStart <= REFEREE_RACE_DAY_CONFIG.preRaceUnlockMinutes * 60_000;
}

export function buildLiveRunners(participants: PreRaceParticipant[]): LiveRunner[] {
  return participants
    .filter((participant) => participant.status === "PASSED")
    .map((participant, index) => ({
      participantId: participant.participantId,
      horseName: participant.horseName,
      gateNumber: index + 1,
      progressPercent: 0,
      speedMultiplier: 1 - index * 0.025,
      status: "RUNNING",
    }));
}

export function setLiveFlag(state: LiveRaceState, mode: LiveRaceState["mode"], occurredAt: string): LiveRaceState {
  const messages: Record<LiveRaceState["mode"], string> = {
    IDLE: "Race controls reset",
    RACING: "Green Flag - race speed restored",
    SAFETY_CAR: "Yellow Flag - Safety Car deployed",
    RED_FLAGGED: "Red Flag - race movement frozen",
    ABORTED: "Race aborted by referee",
    FINISHED_DRAFT: "Chequered Flag - finished draft captured",
  };
  return { ...state, mode, incidents: [...state.incidents, incident("FLAG", occurredAt, messages[mode])] };
}

export function applyLiveTick(state: LiveRaceState, elapsedMilliseconds: number): LiveRaceState {
  if (state.mode !== "RACING" && state.mode !== "SAFETY_CAR") return state;
  const progressPerSecond = state.mode === "SAFETY_CAR"
    ? REFEREE_RACE_DAY_CONFIG.safetyCarProgressPerSecond
    : REFEREE_RACE_DAY_CONFIG.normalProgressPerSecond;
  const seconds = elapsedMilliseconds / 1_000;
  const runners = state.runners.map((runner) => ({
    ...runner,
    progressPercent: Math.min(100, runner.progressPercent + progressPerSecond * seconds * (state.mode === "SAFETY_CAR" ? 1 : runner.speedMultiplier)),
  }));
  return { ...state, elapsedMilliseconds: state.elapsedMilliseconds + elapsedMilliseconds, runners };
}

export function applyPenalty(state: LiveRaceState, participantId: number, action: PenaltyAction, occurredAt: string): LiveRaceState {
  const runner = state.runners.find((entry) => entry.participantId === participantId);
  if (!runner) return state;
  if (action === "DSQ") {
    return {
      ...state,
      runners: state.runners.filter((entry) => entry.participantId !== participantId),
      outOfRace: [...state.outOfRace, { ...runner, status: "DSQ" }],
      incidents: [...state.incidents, incident("DSQ", occurredAt, `Horse #${participantId} disqualified`, participantId)],
    };
  }
  const isFiveSecondPenalty = action === "PENALTY_5S";
  return {
    ...state,
    incidents: [
      ...state.incidents,
      incident(
        isFiveSecondPenalty ? "PENALTY" : "WARNING",
        occurredAt,
        isFiveSecondPenalty ? `Horse #${participantId} receives +5s draft penalty` : `Horse #${participantId} receives a warning`,
        participantId,
        isFiveSecondPenalty ? 5 : undefined,
      ),
    ],
  };
}

export function createFinishedSnapshot(state: LiveRaceState): RaceSnapshot | null {
  const leaderProgress = Math.max(0, ...state.runners.map((runner) => runner.progressPercent));
  if (leaderProgress < REFEREE_RACE_DAY_CONFIG.chequeredFlagUnlockPercent) return null;
  return {
    elapsedMilliseconds: state.elapsedMilliseconds,
    leaderboard: [...state.runners].sort((a, b) => b.progressPercent - a.progressPercent),
    outOfRace: [...state.outOfRace],
    incidents: [...state.incidents],
  };
}
```

- [ ] **Step 5: Run the state tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/refereeRaceDayState.test.ts
```

Expected: PASS with 7 tests.

- [ ] **Step 6: Commit the domain layer**

```powershell
git add frontend/src/pages/referee/race-day/refereeRaceDayModels.ts frontend/src/pages/referee/race-day/refereeRaceDayConfig.ts frontend/src/pages/referee/race-day/refereeRaceDayState.ts frontend/src/pages/referee/race-day/refereeRaceDayState.test.ts
git commit -m "feat: add referee race-day state model"
```

## Task 2: Extend the API Adapter for Assigned Race Scheduling

**Files:**

- Modify: `frontend/src/api/refereeApi.ts`
- Create: `frontend/src/pages/referee/race-day/refereeRaceDayAdapter.ts`
- Create: `frontend/src/pages/referee/race-day/refereeRaceDayAdapter.test.ts`

- [ ] **Step 1: Write a failing adapter test**

Create `frontend/src/pages/referee/race-day/refereeRaceDayAdapter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeAssignedRace, normalizeParticipant } from "./refereeRaceDayAdapter";

describe("refereeRaceDayAdapter", () => {
  it("adds deterministic demo schedule values when the backend summary has no scheduling fields", () => {
    expect(normalizeAssignedRace({ id: 1, code: "R-1", name: "Heat 1", distanceMeters: 1600, status: "ACTIVE" }, new Date("2026-06-02T09:00:00+07:00"))).toMatchObject({
      scheduledAt: "2026-06-02T14:00:00.000+07:00",
      venue: "Turf Tower C",
    });
  });

  it("maps failed verification to scratched with an audit reason", () => {
    expect(normalizeParticipant({ participantId: 5, horseName: "Thunderstrike", jockeyName: "Julian", jockeyWeight: 54, gearOk: true, healthOk: false, status: "FAILED" })).toMatchObject({
      status: "SCRATCHED",
      scratchedReason: "Failed health check",
    });
  });
});
```

- [ ] **Step 2: Run the adapter test and confirm failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/refereeRaceDayAdapter.test.ts
```

Expected: FAIL because `refereeRaceDayAdapter.ts` does not exist.

- [ ] **Step 3: Extend the API payload type without requiring backend changes**

Modify `frontend/src/api/refereeApi.ts`:

```ts
export type RaceSummary = {
  id: number;
  name: string;
  code: string;
  distanceMeters: number;
  status: string;
  scheduledAt?: string;
  venue?: string;
};
```

- [ ] **Step 4: Add a deterministic frontend adapter**

Create `frontend/src/pages/referee/race-day/refereeRaceDayAdapter.ts`:

```ts
import { ParticipantVerification, RaceSummary } from "../../../api/refereeApi";
import { AssignedRace, PreRaceParticipant } from "./refereeRaceDayModels";

function demoScheduledAt(now: Date, raceId: number) {
  const day = now.toISOString().slice(0, 10);
  const hour = 13 + raceId;
  return `${day}T${String(hour).padStart(2, "0")}:00:00.000+07:00`;
}

export function normalizeAssignedRace(race: RaceSummary, now = new Date()): AssignedRace {
  return {
    ...race,
    scheduledAt: race.scheduledAt ?? demoScheduledAt(now, race.id),
    venue: race.venue ?? "Turf Tower C",
  };
}

export function normalizeParticipant(participant: ParticipantVerification): PreRaceParticipant {
  const scratched = participant.status === "FAILED";
  return {
    participantId: participant.participantId,
    horseName: participant.horseName,
    jockeyName: participant.jockeyName,
    jockeyWeight: participant.jockeyWeight,
    equipmentOk: participant.gearOk,
    healthOk: participant.healthOk,
    status: scratched ? "SCRATCHED" : participant.status === "PASSED" ? "PASSED" : "CHECK_HEALTH",
    scratchedReason: scratched ? (participant.healthOk ? "Failed equipment check" : "Failed health check") : undefined,
  };
}
```

- [ ] **Step 5: Run adapter tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/refereeRaceDayAdapter.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit the adapter**

```powershell
git add frontend/src/api/refereeApi.ts frontend/src/pages/referee/race-day/refereeRaceDayAdapter.ts frontend/src/pages/referee/race-day/refereeRaceDayAdapter.test.ts
git commit -m "feat: normalize referee race-day API data"
```

## Task 3: Build Assigned Race Timeline, Calendar Toggle, Drawer, and Demo Mode

**Files:**

- Create: `frontend/src/pages/referee/race-day/AssignedRaceTimeline.tsx`
- Create: `frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx`
- Create: `frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx`
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.tsx`
- Modify: `frontend/src/pages/referee/RefereeOverviewPage.test.tsx`

- [ ] **Step 1: Write failing overview behavior tests**

Add to `frontend/src/pages/referee/RefereeOverviewPage.test.tsx` and replace the old card-link assertions with:

```ts
import { fireEvent, render, screen } from "@testing-library/react";

const mockRaces = [{
  id: 1,
  name: "Royal Ascot Gold Cup - Qualifiers A",
  code: "R-2026-001",
  distanceMeters: 1600,
  status: "SCHEDULED",
  scheduledAt: "2026-06-02T14:00:00+07:00",
  venue: "Turf Tower C",
}];

it("defaults to timeline view and toggles the month calendar", async () => {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
  render(<MemoryRouter><RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} /></MemoryRouter>);
  expect(await screen.findByRole("heading", { name: "Today's Race Timeline" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Month calendar" }));
  expect(screen.getByRole("heading", { name: "June 2026 Calendar" })).toBeInTheDocument();
});

it("opens the selected race drawer and bypasses only the time guard in demo mode", async () => {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);
  render(<MemoryRouter><RefereeOverviewPage now={new Date("2026-06-02T12:30:00+07:00")} /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: /Royal Ascot Gold Cup/i }));
  expect(screen.getByRole("heading", { name: "Race Details" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open Pre-Race Check" })).toHaveAttribute("aria-disabled", "true");
  fireEvent.click(screen.getByRole("switch", { name: "Demo mode" }));
  expect(screen.getByText("Demo Mode Active - Time Guard Bypassed")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open Pre-Race Check" })).not.toHaveAttribute("aria-disabled", "true");
});
```

- [ ] **Step 2: Run overview tests and confirm failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/RefereeOverviewPage.test.tsx
```

Expected: FAIL because timeline, calendar, drawer, and Demo Mode controls do not exist.

- [ ] **Step 3: Build the timeline and drawer components**

Create `frontend/src/pages/referee/race-day/AssignedRaceTimeline.tsx` with these public props:

```ts
import { AssignedRace } from "./refereeRaceDayModels";

type Props = {
  races: AssignedRace[];
  selectedRaceId?: number;
  onSelectRace: (race: AssignedRace) => void;
};

export function AssignedRaceTimeline({ races, selectedRaceId, onSelectRace }: Props) {
  return (
    <section aria-label="Assigned race timeline">
      <h3 className="text-2xl font-black text-slate-950">Today&apos;s Race Timeline</h3>
      <div aria-hidden="true" className="my-4 h-px bg-red-400">
        <span className="rounded-full bg-red-600 px-2 py-1 text-[10px] font-black text-white">CURRENT TIME</span>
      </div>
      <div className="space-y-3">
        {races.map((race) => (
          <button
            aria-pressed={selectedRaceId === race.id}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            key={race.id}
            onClick={() => onSelectRace(race)}
            type="button"
          >
            <span className="text-xs font-black text-[#007a68]">{new Date(race.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <strong className="ml-3 text-sm text-slate-950">{race.name}</strong>
            <span className="ml-3 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">{race.status}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

Create `frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx`:

```ts
import { Link } from "react-router-dom";
import { AssignedRace } from "./refereeRaceDayModels";
import { canOpenPreRaceCheck } from "./refereeRaceDayState";

export function RaceDetailDrawer({ race, now, demoMode }: { race: AssignedRace; now: Date; demoMode: boolean }) {
  const unlocked = canOpenPreRaceCheck(race.scheduledAt, now, demoMode);
  return (
    <aside aria-label="Race details" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-black text-slate-950">Race Details</h3>
      <p className="mt-3 text-sm font-black text-[#007a68]">{race.name}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Venue</dt><dd>{race.venue}</dd></div>
        <div className="flex justify-between"><dt>Distance</dt><dd>{race.distanceMeters}m</dd></div>
      </dl>
      <Link
        aria-disabled={!unlocked}
        className={`mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md px-4 text-sm font-black ${unlocked ? "bg-[#007a68] text-white" : "pointer-events-none bg-slate-200 text-slate-500"}`}
        tabIndex={unlocked ? 0 : -1}
        to={`/referee/races/${race.id}/officiate`}
      >
        Open Pre-Race Check
      </Link>
    </aside>
  );
}
```

Create `frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx`:

```tsx
import { AssignedRace } from "./refereeRaceDayModels";

export function MonthRaceCalendar({ races }: { races: AssignedRace[] }) {
  return (
    <section aria-label="Month calendar" className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-2xl font-black text-slate-950">June 2026 Calendar</h3>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {Array.from({ length: 30 }, (_, index) => {
          const day = index + 1;
          const dayRaces = races.filter((race) => new Date(race.scheduledAt).getDate() === day);
          return (
            <div className="min-h-20 rounded-lg border border-slate-200 p-2" key={day}>
              <span className="text-xs font-black text-slate-500">{day}</span>
              {dayRaces.map((race) => <p className="mt-2 text-[10px] font-bold text-[#007a68]" key={race.id}>{race.code}</p>)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Refactor the overview page**

In `frontend/src/pages/referee/RefereeOverviewPage.tsx`:

- Accept `now = new Date()` as an optional prop for deterministic tests.
- Normalize API races with `normalizeAssignedRace`.
- Add `view: "timeline" | "month"`, `selectedRace`, `demoMode`, and error state.
- Render a switch with `role="switch"` and visible text `Demo Mode Active - Time Guard Bypassed` when enabled.
- Render `AssignedRaceTimeline` by default.
- Render a simple `June 2026 Calendar` month grid when calendar view is active.
- Render `RaceDetailDrawer` only after selecting a race.
- Add a retry button when `getAssignedRaces()` fails.

Use this top-level shape:

```tsx
<div className="max-w-[1486px]">
  <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Assigned Race Desk</p>
      <h2 className="mt-3 text-4xl font-black text-slate-950">Race-Day Operations</h2>
    </div>
    <label className="flex items-center gap-3">
      <span>{demoMode ? "Demo Mode Active - Time Guard Bypassed" : "Production Mode"}</span>
      <button aria-checked={demoMode} aria-label="Demo mode" onClick={() => setDemoMode((value) => !value)} role="switch" type="button" />
    </label>
  </header>
  <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    {view === "timeline" ? <AssignedRaceTimeline races={races} selectedRaceId={selectedRace?.id} onSelectRace={setSelectedRace} /> : <MonthRaceCalendar races={races} />}
    {selectedRace ? <RaceDetailDrawer race={selectedRace} now={now} demoMode={demoMode} /> : <aside className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">Select a timeline card to inspect the assigned race.</aside>}
  </div>
</div>
```

- [ ] **Step 5: Run overview tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/RefereeOverviewPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the assigned race UI**

```powershell
git add frontend/src/pages/referee/RefereeOverviewPage.tsx frontend/src/pages/referee/RefereeOverviewPage.test.tsx frontend/src/pages/referee/race-day/AssignedRaceTimeline.tsx frontend/src/pages/referee/race-day/MonthRaceCalendar.tsx frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx
git commit -m "feat: add assigned race timeline and drawer"
```

## Task 4: Add Pre-Race Checklist and Ready Lineup

**Files:**

- Create: `frontend/src/pages/referee/race-day/PreRaceChecklist.tsx`
- Create: `frontend/src/pages/referee/race-day/ReadyLineupPanel.tsx`
- Create: `frontend/src/pages/referee/race-day/PreRaceChecklist.test.tsx`

- [ ] **Step 1: Write failing checklist tests**

Create `frontend/src/pages/referee/race-day/PreRaceChecklist.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PreRaceChecklist } from "./PreRaceChecklist";

const entries = [{
  participantId: 5,
  horseName: "Thunderstrike",
  jockeyName: "Julian Sterling",
  equipmentOk: true,
  healthOk: true,
  status: "PASSED" as const,
}];

it("marks a horse scratched when the referee fails health verification", () => {
  const onChange = vi.fn();
  render(<PreRaceChecklist participants={entries} onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "Fail health check for Thunderstrike" }));
  expect(onChange).toHaveBeenCalledWith([{ ...entries[0], healthOk: false, status: "SCRATCHED", scratchedReason: "Failed health check" }]);
});
```

- [ ] **Step 2: Run checklist tests and confirm failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/PreRaceChecklist.test.tsx
```

Expected: FAIL because `PreRaceChecklist` does not exist.

- [ ] **Step 3: Implement checklist status updates**

Create `frontend/src/pages/referee/race-day/PreRaceChecklist.tsx`:

```tsx
import { PreRaceParticipant } from "./refereeRaceDayModels";

export function PreRaceChecklist({ participants, onChange }: { participants: PreRaceParticipant[]; onChange: (participants: PreRaceParticipant[]) => void }) {
  const update = (participantId: number, patch: Partial<PreRaceParticipant>) => {
    onChange(participants.map((participant) => participant.participantId === participantId ? { ...participant, ...patch } : participant));
  };
  return (
    <section aria-labelledby="pre-race-checklist-title" className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 id="pre-race-checklist-title" className="text-xl font-black text-slate-950">Pre-Race Verification</h3>
      <div className="mt-4 space-y-3">
        {participants.map((participant) => (
          <article className="rounded-lg border border-slate-200 p-4" key={participant.participantId}>
            <div className="flex items-center justify-between gap-3">
              <strong>{participant.horseName}</strong>
              <span>{participant.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => update(participant.participantId, { equipmentOk: true })} type="button">Equipment Passed</button>
              <button onClick={() => update(participant.participantId, { healthOk: true, status: participant.equipmentOk ? "PASSED" : "CHECK_HEALTH", scratchedReason: undefined })} type="button">Health Passed</button>
              <button aria-label={`Fail health check for ${participant.horseName}`} onClick={() => update(participant.participantId, { healthOk: false, status: "SCRATCHED", scratchedReason: "Failed health check" })} type="button">Scratch - Health</button>
            </div>
            {participant.scratchedReason && <p className="mt-2 text-xs text-rose-700">{participant.scratchedReason}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
```

Create `frontend/src/pages/referee/race-day/ReadyLineupPanel.tsx`:

```tsx
import { PreRaceParticipant } from "./refereeRaceDayModels";

export function ReadyLineupPanel({ participants, onEnterLive }: { participants: PreRaceParticipant[]; onEnterLive: () => void }) {
  const eligible = participants.filter((participant) => participant.status === "PASSED");
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-xl font-black text-slate-950">Starting Lineup Ready</h3>
      <p className="mt-2 text-sm text-slate-600">{eligible.length} runners cleared for Live Control.</p>
      <ul className="mt-4 space-y-2">{eligible.map((participant) => <li key={participant.participantId}>{participant.horseName}</li>)}</ul>
      <button disabled={eligible.length === 0} onClick={onEnterLive} type="button">Confirm & Enter Live Control</button>
    </section>
  );
}
```

- [ ] **Step 4: Run checklist tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/PreRaceChecklist.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit pre-race components**

```powershell
git add frontend/src/pages/referee/race-day/PreRaceChecklist.tsx frontend/src/pages/referee/race-day/ReadyLineupPanel.tsx frontend/src/pages/referee/race-day/PreRaceChecklist.test.tsx
git commit -m "feat: add referee pre-race verification panels"
```

## Task 5: Add Live Simulator, Leaderboard, Incident Log, and Flag Controls

**Files:**

- Create: `frontend/src/pages/referee/race-day/RaceSimulator.tsx`
- Create: `frontend/src/pages/referee/race-day/LiveLeaderboard.tsx`
- Create: `frontend/src/pages/referee/race-day/LiveIncidentLog.tsx`
- Create: `frontend/src/pages/referee/race-day/LiveRaceWorkspace.tsx`
- Create: `frontend/src/pages/referee/race-day/LiveRaceWorkspace.test.tsx`

- [ ] **Step 1: Write failing live workspace tests**

Create `frontend/src/pages/referee/race-day/LiveRaceWorkspace.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LiveRaceState } from "./refereeRaceDayModels";
import { LiveRaceWorkspace } from "./LiveRaceWorkspace";

const state: LiveRaceState = {
  mode: "RACING",
  elapsedMilliseconds: 62_345,
  runners: [
    { participantId: 7, horseName: "Golden Arrow", gateNumber: 1, progressPercent: 92, speedMultiplier: 1, status: "RUNNING" },
    { participantId: 5, horseName: "Thunderstrike", gateNumber: 2, progressPercent: 80, speedMultiplier: 0.98, status: "RUNNING" },
  ],
  outOfRace: [],
  incidents: [],
};

it("reveals runner-specific penalty actions after selecting a live row", () => {
  render(<LiveRaceWorkspace state={state} onFlag={vi.fn()} onPenalty={vi.fn()} onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /P2 Thunderstrike/i }));
  expect(screen.getByRole("button", { name: "Warn Thunderstrike" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add five-second penalty to Thunderstrike" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Disqualify Thunderstrike" })).toBeInTheDocument();
});

it("shows resume and abort actions after a red flag", () => {
  render(<LiveRaceWorkspace state={{ ...state, mode: "RED_FLAGGED" }} onFlag={vi.fn()} onPenalty={vi.fn()} onFinish={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Resume race" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Abort race" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run live workspace tests and confirm failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/LiveRaceWorkspace.test.tsx
```

Expected: FAIL because the live workspace components do not exist.

- [ ] **Step 3: Implement the simulator and leaderboard**

Create `frontend/src/pages/referee/race-day/RaceSimulator.tsx`:

```tsx
import { LiveRaceState } from "./refereeRaceDayModels";

export function RaceSimulator({ state }: { state: LiveRaceState }) {
  return (
    <section aria-label="Live race monitor" className="rounded-xl bg-[#073f36] p-5 text-white">
      <h3 className="text-sm font-black uppercase tracking-widest">Live Monitor</h3>
      <div className="mt-4 space-y-3">
        {state.runners.map((runner) => (
          <div className="relative h-8 border-t border-dashed border-emerald-200/40" key={runner.participantId}>
            <span className="absolute top-1 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-black text-slate-950 transition-[left] duration-500" style={{ left: `${runner.progressPercent}%` }}>
              #{runner.participantId}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Create `frontend/src/pages/referee/race-day/LiveLeaderboard.tsx`:

```tsx
import { useState } from "react";
import { LiveRaceState, PenaltyAction } from "./refereeRaceDayModels";

export function LiveLeaderboard({ state, onPenalty }: { state: LiveRaceState; onPenalty: (participantId: number, action: PenaltyAction) => void }) {
  const [selectedId, setSelectedId] = useState<number>();
  const runners = [...state.runners].sort((a, b) => b.progressPercent - a.progressPercent);
  return (
    <section aria-label="Live leaderboard" className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-950">Live Leaderboard</h3>
      <div className="mt-3 space-y-2">
        {runners.map((runner, index) => (
          <div key={runner.participantId}>
            <button aria-label={`P${index + 1} ${runner.horseName}`} className="w-full rounded-lg border border-slate-200 p-3 text-left" onClick={() => setSelectedId(runner.participantId)} type="button">
              P{index + 1} {runner.horseName}
            </button>
            {selectedId === runner.participantId && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button aria-label={`Warn ${runner.horseName}`} onClick={() => onPenalty(runner.participantId, "WARNING")} type="button">Warning</button>
                <button aria-label={`Add five-second penalty to ${runner.horseName}`} onClick={() => onPenalty(runner.participantId, "PENALTY_5S")} type="button">+5s</button>
                <button aria-label={`Disqualify ${runner.horseName}`} onClick={() => onPenalty(runner.participantId, "DSQ")} type="button">DSQ</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <h4 className="mt-5 text-xs font-black uppercase text-rose-700">Out of Race</h4>
      {state.outOfRace.map((runner) => <p className="mt-2 text-sm text-rose-700" key={runner.participantId}>DSQ - {runner.horseName} at {runner.progressPercent.toFixed(1)}%</p>)}
    </section>
  );
}
```

- [ ] **Step 4: Implement incident log and workspace composition**

Create `frontend/src/pages/referee/race-day/LiveIncidentLog.tsx`:

```tsx
import { RaceIncident } from "./refereeRaceDayModels";

export function LiveIncidentLog({ incidents }: { incidents: RaceIncident[] }) {
  return (
    <section aria-label="Live incident log" className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-black uppercase tracking-widest">Live Incident Log</h3>
      {incidents.length === 0 ? <p className="mt-3 text-sm text-slate-500">No incidents recorded.</p> : incidents.map((entry) => <p className="mt-2 text-sm" key={entry.id}>{entry.message}</p>)}
    </section>
  );
}
```

Create `frontend/src/pages/referee/race-day/LiveRaceWorkspace.tsx`:

```tsx
import { LiveRaceState, PenaltyAction } from "./refereeRaceDayModels";
import { RaceSimulator } from "./RaceSimulator";
import { LiveIncidentLog } from "./LiveIncidentLog";
import { LiveLeaderboard } from "./LiveLeaderboard";

export function LiveRaceWorkspace({ state, onFlag, onPenalty, onFinish }: {
  state: LiveRaceState;
  onFlag: (mode: LiveRaceState["mode"]) => void;
  onPenalty: (participantId: number, action: PenaltyAction) => void;
  onFinish: () => void;
}) {
  const leaderProgress = Math.max(0, ...state.runners.map((runner) => runner.progressPercent));
  return (
    <section aria-label="Live race workspace" className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RaceSimulator state={state} />
        <LiveLeaderboard state={state} onPenalty={onPenalty} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <LiveIncidentLog incidents={state.incidents} />
        <div aria-label="Race flag controls" className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
          {state.mode === "RED_FLAGGED" ? (
            <>
              <button aria-label="Resume race" onClick={() => onFlag("RACING")} type="button">Resume Race</button>
              <button aria-label="Abort race" onClick={() => onFlag("ABORTED")} type="button">Abort Race</button>
            </>
          ) : (
            <>
              <button onClick={() => onFlag("RACING")} type="button">Green Flag</button>
              <button onClick={() => onFlag("SAFETY_CAR")} type="button">Yellow Flag / Safety Car</button>
              <button onClick={() => onFlag("RED_FLAGGED")} type="button">Red Flag</button>
              <button disabled={leaderProgress < 90} onClick={onFinish} type="button">Chequered Flag</button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run live workspace tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/race-day/LiveRaceWorkspace.test.tsx
```

Expected: PASS with 2 tests.

- [ ] **Step 6: Commit live components**

```powershell
git add frontend/src/pages/referee/race-day/RaceSimulator.tsx frontend/src/pages/referee/race-day/LiveLeaderboard.tsx frontend/src/pages/referee/race-day/LiveIncidentLog.tsx frontend/src/pages/referee/race-day/LiveRaceWorkspace.tsx frontend/src/pages/referee/race-day/LiveRaceWorkspace.test.tsx
git commit -m "feat: add referee live race control workspace"
```

## Task 6: Replace the Oversized Officiate Page with Master Workspace Orchestration

**Files:**

- Create: `frontend/src/pages/referee/race-day/RaceSummary.tsx`
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.tsx`
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`

- [ ] **Step 1: Replace the shallow officiate test with state-flow tests**

Update `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import * as refereeApi from "../../api/refereeApi";
import { RefereeOfficiatePage } from "./RefereeOfficiatePage";

vi.mock("../../api/refereeApi");

function renderPage() {
  vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue([{ id: 1, name: "Grand Derby", code: "R-1", distanceMeters: 1600, status: "SCHEDULED", scheduledAt: "2026-06-02T14:00:00+07:00" }]);
  vi.spyOn(refereeApi, "getRaceParticipants").mockResolvedValue([
    { participantId: 7, horseName: "Golden Arrow", jockeyName: "Mina Park", jockeyWeight: 52, gearOk: true, healthOk: true, status: "PASSED" },
    { participantId: 5, horseName: "Thunderstrike", jockeyName: "Julian Sterling", jockeyWeight: 54, gearOk: true, healthOk: false, status: "FAILED" },
  ]);
  vi.spyOn(refereeApi, "savePreRaceChecks").mockResolvedValue();
  render(<MemoryRouter initialEntries={["/referee/races/1/officiate"]}><Routes><Route path="/referee/races/:id/officiate" element={<RefereeOfficiatePage />} /></Routes></MemoryRouter>);
}

it("shows timeline and checklist during pre-race, then excludes scratched horses from live", async () => {
  renderPage();
  expect(await screen.findByRole("heading", { name: "Pre-Race Verification" })).toBeInTheDocument();
  expect(screen.getByText("SCRATCHED")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Confirm Pre-Race Checks" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
  expect(await screen.findByRole("region", { name: "Live race workspace" })).toBeInTheDocument();
  expect(screen.getAllByText("Golden Arrow").length).toBeGreaterThan(0);
  expect(screen.queryByText("Thunderstrike")).not.toBeInTheDocument();
});

it("moves a DSQ runner into Out of Race", async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Confirm Pre-Race Checks" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
  fireEvent.click(screen.getByRole("button", { name: /P1 Golden Arrow/i }));
  fireEvent.click(screen.getByRole("button", { name: "Disqualify Golden Arrow" }));
  expect(screen.getByText(/DSQ - Golden Arrow/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run officiate tests and confirm failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/RefereeOfficiatePage.test.tsx
```

Expected: FAIL because the current page does not expose the staged workspace flow.

- [ ] **Step 3: Add the finished draft summary**

Create `frontend/src/pages/referee/race-day/RaceSummary.tsx`:

```tsx
import { RaceSnapshot } from "./refereeRaceDayModels";

export function RaceSummary({ snapshot }: { snapshot: RaceSnapshot }) {
  const topThree = snapshot.leaderboard.slice(0, 3);
  return (
    <section aria-labelledby="draft-summary-title" className="rounded-xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-black uppercase tracking-widest text-[#007a68]">Finished Draft</p>
      <h2 id="draft-summary-title" className="mt-2 text-3xl font-black text-slate-950">Race Summary</h2>
      <p className="mt-2 text-sm text-slate-600">Elapsed: {(snapshot.elapsedMilliseconds / 1_000).toFixed(3)}s</p>
      <ol className="mt-5 space-y-2">{topThree.map((runner) => <li key={runner.participantId}>{runner.horseName}</li>)}</ol>
      <h3 className="mt-6 text-sm font-black uppercase tracking-widest">Incident History</h3>
      {snapshot.incidents.map((entry) => <p className="mt-2 text-sm" key={entry.id}>{entry.message}</p>)}
    </section>
  );
}
```

- [ ] **Step 4: Replace `RefereeOfficiatePage.tsx` with orchestration**

Replace the current oversized component with a focused route container. Keep styling compact during this step; Task 7 adds motion and polish. Use these handlers and stage branches:

```tsx
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAssignedRaces, getRaceParticipants, savePreRaceChecks } from "../../api/refereeApi";
import { AssignedRaceTimeline } from "./race-day/AssignedRaceTimeline";
import { LiveRaceWorkspace } from "./race-day/LiveRaceWorkspace";
import { normalizeAssignedRace, normalizeParticipant } from "./race-day/refereeRaceDayAdapter";
import { REFEREE_RACE_DAY_CONFIG } from "./race-day/refereeRaceDayConfig";
import { LiveRaceState, PenaltyAction, PreRaceParticipant, RaceSnapshot, WorkspaceStage } from "./race-day/refereeRaceDayModels";
import { applyLiveTick, applyPenalty, buildLiveRunners, createFinishedSnapshot, setLiveFlag } from "./race-day/refereeRaceDayState";
import { PreRaceChecklist } from "./race-day/PreRaceChecklist";
import { RaceSummary } from "./race-day/RaceSummary";
import { ReadyLineupPanel } from "./race-day/ReadyLineupPanel";

const EMPTY_LIVE_STATE: LiveRaceState = { mode: "IDLE", elapsedMilliseconds: 0, runners: [], outOfRace: [], incidents: [] };

export function RefereeOfficiatePage() {
  const raceId = Number(useParams<{ id: string }>().id);
  const [stage, setStage] = useState<WorkspaceStage>("PRE_CHECKING");
  const [races, setRaces] = useState<ReturnType<typeof normalizeAssignedRace>[]>([]);
  const [participants, setParticipants] = useState<PreRaceParticipant[]>([]);
  const [live, setLive] = useState<LiveRaceState>(EMPTY_LIVE_STATE);
  const [snapshot, setSnapshot] = useState<RaceSnapshot>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const [raceRows, participantRows] = await Promise.all([getAssignedRaces(), getRaceParticipants(raceId)]);
      setRaces(raceRows.map((race) => normalizeAssignedRace(race)));
      setParticipants(participantRows.map(normalizeParticipant));
    } catch {
      setError("Unable to load race-day operations.");
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (stage !== "ONGOING" || (live.mode !== "RACING" && live.mode !== "SAFETY_CAR")) return;
    const timer = window.setInterval(() => setLive((current) => applyLiveTick(current, REFEREE_RACE_DAY_CONFIG.simulatorTickMilliseconds)), REFEREE_RACE_DAY_CONFIG.simulatorTickMilliseconds);
    return () => window.clearInterval(timer);
  }, [live.mode, stage]);

  const confirmPreRace = async () => {
    if (participants.some((participant) => participant.status === "CHECK_HEALTH")) return;
    try {
      await savePreRaceChecks(raceId, participants.map((participant) => ({
        participantId: participant.participantId,
        horseName: participant.horseName,
        jockeyName: participant.jockeyName,
        jockeyWeight: participant.jockeyWeight ?? 0,
        gearOk: participant.equipmentOk,
        healthOk: participant.healthOk,
        status: participant.status === "SCRATCHED" ? "FAILED" as const : "PASSED" as const,
      })));
      setStage("READY");
    } catch {
      setError("Unable to save pre-race verification.");
    }
  };

  const enterLive = () => {
    const runners = buildLiveRunners(participants);
    if (runners.length === 0) return setError("At least one cleared runner is required.");
    setLive(setLiveFlag({ ...EMPTY_LIVE_STATE, runners }, "RACING", new Date().toISOString()));
    setStage("ONGOING");
  };

  const changeFlag = (mode: LiveRaceState["mode"]) => {
    if (mode === "ABORTED" && !window.confirm("Abort this race? This freezes the current race state.")) return;
    setLive((current) => setLiveFlag(current, mode, new Date().toISOString()));
    if (mode === "ABORTED") setStage("ABORTED");
  };

  const finish = () => {
    const flagged = setLiveFlag(live, "FINISHED_DRAFT", new Date().toISOString());
    const nextSnapshot = createFinishedSnapshot(flagged);
    if (!nextSnapshot || !window.confirm("Finish this race and store the current draft snapshot?")) return;
    setLive(flagged);
    setSnapshot(nextSnapshot);
    setStage("FINISHED_DRAFT");
  };

  if (loading) return <p>Loading race-day operations...</p>;
  if (error) return <div role="alert"><p>{error}</p><button onClick={() => void load()} type="button">Retry</button></div>;
  if (stage === "FINISHED_DRAFT" && snapshot) return <RaceSummary snapshot={snapshot} />;
  if (stage === "ABORTED") return <section><h2>Race Aborted</h2><p>The final live telemetry has been frozen for review.</p></section>;
  if (stage === "ONGOING") return <LiveRaceWorkspace state={live} onFinish={finish} onFlag={changeFlag} onPenalty={(participantId: number, action: PenaltyAction) => setLive((current) => applyPenalty(current, participantId, action, new Date().toISOString()))} />;
  if (stage === "READY") return <ReadyLineupPanel participants={participants} onEnterLive={enterLive} />;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
      <AssignedRaceTimeline races={races} selectedRaceId={raceId} onSelectRace={() => {}} />
      <div>
        <PreRaceChecklist participants={participants} onChange={setParticipants} />
        <button disabled={participants.some((participant) => participant.status === "CHECK_HEALTH")} onClick={() => void confirmPreRace()} type="button">Confirm Pre-Race Checks</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run officiate tests**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/RefereeOfficiatePage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the master workspace refactor**

```powershell
git add frontend/src/pages/referee/RefereeOfficiatePage.tsx frontend/src/pages/referee/RefereeOfficiatePage.test.tsx frontend/src/pages/referee/race-day/RaceSummary.tsx
git commit -m "feat: orchestrate referee race-day workspace"
```

## Task 7: Add Accessible Motion, Responsive Polish, and Confirmation Coverage

**Files:**

- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/pages/referee/race-day/RaceDetailDrawer.tsx`
- Modify: `frontend/src/pages/referee/race-day/LiveLeaderboard.tsx`
- Modify: `frontend/src/pages/referee/race-day/LiveRaceWorkspace.tsx`
- Modify: `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`

- [ ] **Step 1: Add failing accessibility and confirmation assertions**

Add to `frontend/src/pages/referee/RefereeOfficiatePage.test.tsx`:

```tsx
it("requires confirmation before aborting a red-flagged race", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(false);
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Confirm Pre-Race Checks" }));
  fireEvent.click(await screen.findByRole("button", { name: "Confirm & Enter Live Control" }));
  fireEvent.click(screen.getByRole("button", { name: "Red Flag" }));
  fireEvent.click(screen.getByRole("button", { name: "Abort race" }));
  expect(window.confirm).toHaveBeenCalledWith("Abort this race? This freezes the current race state.");
  expect(screen.getByRole("button", { name: "Resume race" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the specific confirmation test and confirm failure**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee/RefereeOfficiatePage.test.tsx -t "requires confirmation"
```

Expected: FAIL until abort confirmation is wired.

- [ ] **Step 3: Add shared motion classes and reduced-motion fallbacks**

Append to `frontend/src/styles.css`:

```css
.race-day-drawer-motion {
  animation: race-day-slide-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.race-day-row-motion {
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms ease,
    background-color 220ms ease;
}

@keyframes race-day-slide-in {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .race-day-drawer-motion,
  .race-day-row-motion {
    animation: none;
    transition: none;
  }
}
```

- [ ] **Step 4: Apply accessible labels and confirmations**

- Add `race-day-drawer-motion` to the drawer container.
- Add `race-day-row-motion` to leaderboard rows.
- Keep all icon-only controls paired with `aria-label`.
- Add `aria-live="polite"` to the incident log container.
- Use `window.confirm("Abort this race? This freezes the current race state.")` before applying `ABORTED`.
- Use `window.confirm("Finish this race and store the current draft snapshot?")` before applying `FINISHED_DRAFT`.

- [ ] **Step 5: Run focused tests and build**

Run:

```powershell
cd frontend
npm test -- --run src/pages/referee
npm run build
```

Expected: referee tests PASS and production build succeeds.

- [ ] **Step 6: Commit accessibility and polish**

```powershell
git add frontend/src/styles.css frontend/src/pages/referee frontend/src/api/refereeApi.ts
git commit -m "feat: polish referee race-day controls"
```

## Task 8: Verify the Full Frontend and Inspect the UI in Browser

**Files:**

- Verify only.

- [ ] **Step 1: Run all frontend tests**

Run:

```powershell
cd frontend
npm test -- --run
```

Expected: all Vitest suites PASS.

- [ ] **Step 2: Run production build**

Run:

```powershell
cd frontend
npm run build
```

Expected: TypeScript compilation and Vite production build succeed.

- [ ] **Step 3: Start the development server**

Run:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1
```

Expected: Vite reports a local URL, normally `http://127.0.0.1:5173`.

- [ ] **Step 4: Use the Browser plugin to inspect the race-day flow**

Open the local referee route and verify:

1. `/referee` loads the day timeline by default.
2. Selecting a race opens the drawer.
3. Production Mode shows a locked pre-race action outside the 60-minute window.
4. Demo Mode changes the warning badge and unlocks the same-day action.
5. Pre-race check displays the timeline and checklist side by side.
6. A scratched horse remains visible in pre-race audit data but disappears from Live.
7. Live workspace fills the available content region.
8. Selecting a leaderboard runner reveals Warning, `+5s`, and `DSQ`.
9. Yellow Flag keeps motion active at reduced speed.
10. Red Flag freezes motion and displays Resume and Abort actions.
11. `DSQ` moves a row into `Out of Race`.
12. Chequered Flag remains locked until the leader reaches `90%`.
13. Confirming Chequered Flag renders the draft summary.

- [ ] **Step 5: Record final git status**

Run:

```powershell
git status --short
```

Expected: no unexpected generated files are staged. `.superpowers/` remains ignored.

## Plan Self-Review

- Spec coverage: timeline, month toggle, current-time indicator, drawer, Demo Mode guard, pre-race checklist, `SCRATCHED`, ready lineup, full-screen live workspace, simulator, leaderboard, Safety Car, Red Flag, Green Flag, Chequered Flag, warnings, `+5s`, `DSQ`, `Out of Race`, incidents, and summary all map to tasks.
- Deferred scope: post-race adjudication and complaints remain excluded.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation step remains.
- Type consistency: the adapter, reducer, components, and route container share the same models from `refereeRaceDayModels.ts`.
