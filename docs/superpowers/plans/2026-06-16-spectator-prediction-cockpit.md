# Spectator Prediction Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/spectator/predictions` into the approved Race Cockpit + Right Slip experience while preserving the existing route, public shell, API contracts, and submit/update flow.

**Architecture:** Keep data fetching and mutations inside `useSpectatorPredictions`; make `SpectatorPredictionsPage` the cockpit orchestrator; move UI into focused controlled components under `frontend/src/pages/spectator/predictions/components`. Put shared validation/formatting/filtering helpers in a small local utility file so the slip, runner table, and tests agree on behavior.

**Tech Stack:** React 19, React Router 7 search params, TypeScript, Tailwind CSS 4, framer-motion, lucide-react, Vitest, Testing Library.

---

## Important Execution Constraint

The user explicitly said: **do not touch git**. Do not run `git add`, `git commit`, `git reset`, `git checkout`, or any command that writes to `.git`.

## Files

- Create: `frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts`
- Create: `frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts`
- Create: `frontend/src/pages/spectator/predictions/components/RaceTimeline.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/RaceCockpitHeader.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/PredictionModeSelector.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/Top3OrderSelector.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/RunnerTable.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/MyPredictionsPanel.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`
- Keep available for reuse: `frontend/src/pages/spectator/predictions/components/CommunityChoices.tsx`
- Keep available for history/result rendering: `frontend/src/pages/spectator/predictions/components/PredictionResultCard.tsx`
- Do not modify unless required by tests: `frontend/src/pages/spectator/predictions/hooks/useSpectatorPredictions.ts`
- Do not modify unless required by tests: `frontend/src/pages/spectator/predictions/services/spectatorPredictionApi.ts`
- Do not modify unless required by tests: `frontend/src/pages/spectator/predictions/types/prediction.types.ts`

---

### Task 1: Cockpit Utility Functions

**Files:**
- Create: `frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts`
- Create: `frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts`

- [ ] **Step 1: Write utility tests**

Create `frontend/src/pages/spectator/predictions/predictionCockpitUtils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  EMPTY_PICKS,
  derivePredictionValidation,
  filterSlipPredictions,
  formatRunnerName,
  getEntryCost,
  getRewardLabel,
  getRaceTimelineStatus,
  pickRunnerForMode,
  type Picks,
} from "./predictionCockpitUtils";
import type { OpenRacePrediction, PredictionOptions, UserPrediction } from "./types/prediction.types";

const futureIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const soonIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const pastIso = new Date(Date.now() - 60 * 1000).toISOString();

const options: PredictionOptions = {
  raceId: 7,
  raceName: "Twilight Sprint",
  raceStatus: "SCHEDULED",
  predictionOpen: true,
  entryCost: { winner: 10, top3: 20 },
  rewardConfig: { winnerReward: 30, top3ExactReward: 90, top3AnyOrderReward: 45 },
  myPredictions: [],
  winnerDistributionVisible: false,
  top3DistributionVisible: false,
  options: [
    { raceParticipantId: 1, startNumber: 1, laneNumber: 2, horseName: "Thunder Bay", jockeyName: "J. Rider" },
    { raceParticipantId: 2, startNumber: 2, laneNumber: 5, horseName: "Silver Reef", jockeyName: "M. Swift" },
    { raceParticipantId: 3, startNumber: 3, laneNumber: 7, horseName: "Golden Arrow", jockeyName: "A. Cruz" },
  ],
};

function race(overrides: Partial<OpenRacePrediction> = {}): OpenRacePrediction {
  return {
    raceId: 7,
    raceName: "Twilight Sprint",
    roundName: "Round 1",
    tournamentId: 5,
    tournamentName: "Summer Gold Cup",
    raceAt: futureIso,
    status: "SCHEDULED",
    totalPredictions: 3,
    predictedByUser: { hasPredicted: false, types: [] },
    ...overrides,
  };
}

function prediction(overrides: Partial<UserPrediction>): UserPrediction {
  return {
    id: 1,
    raceId: 7,
    raceName: "Twilight Sprint",
    championshipName: "Summer Gold Cup",
    predictionType: "WINNER",
    predictedWinnerId: 1,
    predictedWinnerName: "Thunder Bay",
    entryCostPoints: 10,
    rewardPoints: 30,
    status: "PENDING",
    resultCategory: "PENDING",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("prediction cockpit utilities", () => {
  it("derives costs and reward labels from API values", () => {
    expect(getEntryCost(options, "WINNER")).toBe(10);
    expect(getEntryCost(options, "TOP3")).toBe(20);
    expect(getRewardLabel(options, "WINNER")).toBe("+30 reward points");
    expect(getRewardLabel(options, "TOP3")).toBe("+90 exact / +45 any order");
  });

  it("validates winner selections and point balance", () => {
    expect(derivePredictionValidation({ predType: "WINNER", picks: EMPTY_PICKS, options, pointBalance: 50, isUpdate: false })).toMatchObject({
      canConfirm: false,
      message: "Choose a runner for First.",
    });
    expect(derivePredictionValidation({ predType: "WINNER", picks: { ...EMPTY_PICKS, winnerId: 1 }, options, pointBalance: 5, isUpdate: false })).toMatchObject({
      canConfirm: false,
      message: "You need 5 more points.",
    });
    expect(derivePredictionValidation({ predType: "WINNER", picks: { ...EMPTY_PICKS, winnerId: 1 }, options, pointBalance: 5, isUpdate: true })).toMatchObject({
      canConfirm: true,
      message: "Ready to confirm.",
    });
  });

  it("validates top-3 missing and duplicate runners", () => {
    expect(derivePredictionValidation({ predType: "TOP3", picks: { winnerId: 1, secondId: null, thirdId: null }, options, pointBalance: 50, isUpdate: false }).message).toBe("Choose Second and Third to complete Top 3.");
    expect(derivePredictionValidation({ predType: "TOP3", picks: { winnerId: 1, secondId: 1, thirdId: 3 }, options, pointBalance: 50, isUpdate: false }).message).toBe("Choose three different runners.");
    expect(derivePredictionValidation({ predType: "TOP3", picks: { winnerId: 1, secondId: 2, thirdId: 3 }, options, pointBalance: 50, isUpdate: false }).canConfirm).toBe(true);
  });

  it("auto-fills top-3 slots and supports active slot replacement", () => {
    let picks: Picks = EMPTY_PICKS;
    picks = pickRunnerForMode({ picks, predType: "TOP3", participantId: 1, activeSlot: null });
    expect(picks).toEqual({ winnerId: 1, secondId: null, thirdId: null });
    picks = pickRunnerForMode({ picks, predType: "TOP3", participantId: 2, activeSlot: null });
    expect(picks).toEqual({ winnerId: 1, secondId: 2, thirdId: null });
    picks = pickRunnerForMode({ picks, predType: "TOP3", participantId: 3, activeSlot: "secondId" });
    expect(picks).toEqual({ winnerId: 1, secondId: 3, thirdId: null });
  });

  it("formats runner labels from existing API fields", () => {
    expect(formatRunnerName(options, 1)).toBe("#1 Thunder Bay");
    expect(formatRunnerName(options, null)).toBe("-");
  });

  it("derives race timeline status from raceAt and predictionOpen", () => {
    expect(getRaceTimelineStatus(race({ raceAt: futureIso }), true).label).toBe("Open");
    expect(getRaceTimelineStatus(race({ raceAt: soonIso }), true).label).toBe("Closing Soon");
    expect(getRaceTimelineStatus(race({ raceAt: futureIso }), false).label).toBe("Locked");
    expect(getRaceTimelineStatus(race({ raceAt: pastIso }), false).label).toBe("Finished");
  });

  it("prioritizes selected-race predictions, then tournament predictions, then recent fallback", () => {
    const selected = race({ raceId: 7, tournamentName: "Summer Gold Cup" });
    const items = [
      prediction({ id: 1, raceId: 99, raceName: "Other", championshipName: "Other Cup", createdAt: "2026-06-01T00:00:00Z" }),
      prediction({ id: 2, raceId: 8, raceName: "Stablemate", championshipName: "Summer Gold Cup", createdAt: "2026-06-02T00:00:00Z" }),
      prediction({ id: 3, raceId: 7, raceName: "Twilight Sprint", championshipName: "Summer Gold Cup", createdAt: "2026-06-03T00:00:00Z" }),
    ];
    expect(filterSlipPredictions(items, selected).map((p) => p.id)).toEqual([3]);
    expect(filterSlipPredictions(items.filter((p) => p.raceId !== 7), selected).map((p) => p.id)).toEqual([2]);
    expect(filterSlipPredictions(items.filter((p) => p.championshipName !== "Summer Gold Cup"), selected).map((p) => p.id)).toEqual([1]);
  });
});
```

- [ ] **Step 2: Run utility tests and verify they fail**

Run:

```bash
cd frontend
npm test -- predictionCockpitUtils
```

Expected: FAIL because `predictionCockpitUtils.ts` does not exist.

- [ ] **Step 3: Implement utility module**

Create `frontend/src/pages/spectator/predictions/predictionCockpitUtils.ts`:

```ts
import type {
  OpenRacePrediction,
  PredictionOptions,
  PredictionType,
  UserPrediction,
} from "./types/prediction.types";

export type PickSlot = "winnerId" | "secondId" | "thirdId";

export type Picks = {
  winnerId: number | null;
  secondId: number | null;
  thirdId: number | null;
};

export const EMPTY_PICKS: Picks = { winnerId: null, secondId: null, thirdId: null };

export type PredictionValidation = {
  canConfirm: boolean;
  message: string;
};

export type RaceTimelineStatus = {
  label: "Open" | "Closing Soon" | "Locked" | "Finished";
  tone: "emerald" | "gold" | "muted";
};

export function getEntryCost(options: PredictionOptions | null, predType: PredictionType) {
  if (!options) return 0;
  return predType === "WINNER" ? options.entryCost.winner : options.entryCost.top3;
}

export function getRewardLabel(options: PredictionOptions | null, predType: PredictionType) {
  if (!options) return "-";
  if (predType === "WINNER") return `+${options.rewardConfig.winnerReward} reward points`;
  return `+${options.rewardConfig.top3ExactReward} exact / +${options.rewardConfig.top3AnyOrderReward} any order`;
}

export function formatRunnerName(options: PredictionOptions | null, participantId: number | null) {
  if (!options || participantId == null) return "-";
  const runner = options.options.find((item) => item.raceParticipantId === participantId);
  if (!runner) return "-";
  return `#${runner.startNumber ?? runner.laneNumber ?? "-"} ${runner.horseName}`;
}

export function getPickedSlot(picks: Picks, participantId: number): PickSlot | null {
  if (picks.winnerId === participantId) return "winnerId";
  if (picks.secondId === participantId) return "secondId";
  if (picks.thirdId === participantId) return "thirdId";
  return null;
}

export function setPickSlot(picks: Picks, slot: PickSlot, participantId: number | null): Picks {
  return { ...picks, [slot]: participantId };
}

function nextEmptyTop3Slot(picks: Picks): PickSlot | null {
  if (picks.winnerId == null) return "winnerId";
  if (picks.secondId == null) return "secondId";
  if (picks.thirdId == null) return "thirdId";
  return null;
}

export function pickRunnerForMode({
  picks,
  predType,
  participantId,
  activeSlot,
}: {
  picks: Picks;
  predType: PredictionType;
  participantId: number;
  activeSlot: PickSlot | null;
}): Picks {
  const alreadyPicked = getPickedSlot(picks, participantId);
  if (alreadyPicked && !activeSlot) return setPickSlot(picks, alreadyPicked, null);
  if (predType === "WINNER") return { ...EMPTY_PICKS, winnerId: participantId };
  const targetSlot = activeSlot ?? nextEmptyTop3Slot(picks);
  if (!targetSlot) return picks;
  return setPickSlot(picks, targetSlot, participantId);
}

export function derivePredictionValidation({
  predType,
  picks,
  options,
  pointBalance,
  isUpdate,
}: {
  predType: PredictionType;
  picks: Picks;
  options: PredictionOptions | null;
  pointBalance: number;
  isUpdate: boolean;
}): PredictionValidation {
  if (!options) return { canConfirm: false, message: "Race options are still loading." };
  if (!options.predictionOpen) return { canConfirm: false, message: "Predictions are locked for this race." };
  if (!picks.winnerId) return { canConfirm: false, message: "Choose a runner for First." };

  if (predType === "TOP3") {
    if (!picks.secondId && !picks.thirdId) return { canConfirm: false, message: "Choose Second and Third to complete Top 3." };
    if (!picks.secondId) return { canConfirm: false, message: "Choose Second to complete Top 3." };
    if (!picks.thirdId) return { canConfirm: false, message: "Choose Third to complete Top 3." };
    const ids = [picks.winnerId, picks.secondId, picks.thirdId];
    if (new Set(ids).size !== 3) return { canConfirm: false, message: "Choose three different runners." };
  }

  const entryCost = getEntryCost(options, predType);
  if (!isUpdate && pointBalance < entryCost) {
    return { canConfirm: false, message: `You need ${entryCost - pointBalance} more points.` };
  }

  return { canConfirm: true, message: "Ready to confirm." };
}

export function getRaceTimelineStatus(race: OpenRacePrediction, predictionOpenForSelectedRace?: boolean): RaceTimelineStatus {
  const targetMs = new Date(race.raceAt).getTime();
  const diff = targetMs - Date.now();
  if (diff <= 0) return { label: "Finished", tone: "muted" };
  if (predictionOpenForSelectedRace === false) return { label: "Locked", tone: "muted" };
  if (diff <= 15 * 60 * 1000) return { label: "Closing Soon", tone: "gold" };
  return { label: "Open", tone: "emerald" };
}

export function filterSlipPredictions(predictions: UserPrediction[], selectedRace: OpenRacePrediction | null) {
  const sorted = [...predictions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (!selectedRace) return sorted.slice(0, 3);

  const selectedRacePredictions = sorted.filter((prediction) => prediction.raceId === selectedRace.raceId);
  if (selectedRacePredictions.length > 0) return selectedRacePredictions;

  const selectedTournamentName = selectedRace.tournamentName?.toLowerCase();
  if (selectedTournamentName) {
    const tournamentPredictions = sorted.filter((prediction) => prediction.championshipName?.toLowerCase() === selectedTournamentName);
    if (tournamentPredictions.length > 0) return tournamentPredictions.slice(0, 3);
  }

  return sorted.slice(0, 3);
}
```

- [ ] **Step 4: Run utility tests and verify they pass**

Run:

```bash
cd frontend
npm test -- predictionCockpitUtils
```

Expected: PASS for `predictionCockpitUtils.test.ts`.

---

### Task 2: Race Timeline, Header, and Mode Controls

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/RaceTimeline.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/RaceCockpitHeader.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/PredictionModeSelector.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/Top3OrderSelector.tsx`

- [ ] **Step 1: Create `RaceTimeline.tsx`**

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OpenRacePrediction } from "../types/prediction.types";
import { getRaceTimelineStatus } from "../predictionCockpitUtils";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function RaceTimeline({
  races,
  selectedRace,
  selectedPredictionOpen,
  onSelectRace,
}: {
  races: OpenRacePrediction[];
  selectedRace: OpenRacePrediction | null;
  selectedPredictionOpen?: boolean;
  onSelectRace: (race: OpenRacePrediction) => void;
}) {
  if (races.length === 0) {
    return (
      <section className="rounded-2xl border border-white/8 bg-turf-900 p-8 text-center text-sm font-semibold text-ivory-dim">
        There are currently no races open for prediction.
      </section>
    );
  }

  const sortedRaces = [...races].sort((a, b) => new Date(a.raceAt).getTime() - new Date(b.raceAt).getTime());

  return (
    <section aria-labelledby="race-timeline-title" className="rounded-2xl border border-white/8 bg-turf-900/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="race-timeline-title" className="eyebrow text-emerald-soft">Race Timeline</h2>
        <div className="hidden items-center gap-2 text-ivory-faint md:flex" aria-hidden="true">
          <ChevronLeft size={15} />
          <ChevronRight size={15} />
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" role="list" aria-label="Open races">
        {sortedRaces.map((race, index) => {
          const active = selectedRace?.raceId === race.raceId;
          const status = getRaceTimelineStatus(race, active ? selectedPredictionOpen : undefined);
          return (
            <button
              key={race.raceId}
              type="button"
              onClick={() => onSelectRace(race)}
              aria-current={active ? "true" : undefined}
              className={`min-h-24 min-w-[150px] rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                active
                  ? "border-gold-400/70 bg-gold-400/10 text-ivory shadow-[0_18px_50px_-28px_rgba(212,175,55,0.75)]"
                  : "border-white/10 bg-turf-950 text-ivory-dim hover:border-white/25 hover:text-ivory"
              }`}
            >
              <span className="font-data text-[10px] uppercase tracking-[0.18em] text-ivory-faint">
                Race {index + 1}
              </span>
              <span className="mt-1 block truncate text-sm font-bold">{race.raceName}</span>
              <span className="mt-2 flex items-center justify-between gap-3">
                <span className="font-data text-xs text-gold-300">{formatTime(race.raceAt)}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-data text-[9px] uppercase tracking-[0.12em] ${
                    status.tone === "emerald"
                      ? "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-soft"
                      : status.tone === "gold"
                        ? "border-gold-400/40 bg-gold-400/10 text-gold-300"
                        : "border-white/10 bg-white/5 text-ivory-faint"
                  }`}
                >
                  {status.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `RaceCockpitHeader.tsx`**

```tsx
import { CalendarClock, ShieldCheck, Users } from "lucide-react";
import type { OpenRacePrediction, PredictionOptions } from "../types/prediction.types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RaceCockpitHeader({
  race,
  options,
}: {
  race: OpenRacePrediction;
  options: PredictionOptions | null;
}) {
  const open = options?.predictionOpen ?? false;
  return (
    <section className="rounded-2xl border border-white/8 bg-gradient-to-br from-turf-900 to-turf-950 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="eyebrow text-gold-300">{race.tournamentName || "Championship"}</p>
          <h1 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight text-ivory">
            {race.raceName}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ivory-dim">
            <span className="inline-flex items-center gap-2">
              <CalendarClock size={15} className="text-gold-400" />
              {formatDateTime(race.raceAt)}
            </span>
            <span>{race.roundName}</span>
            <span className="inline-flex items-center gap-2">
              <Users size={15} className="text-gold-400" />
              {race.totalPredictions} predictions
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 font-data text-[10px] uppercase tracking-[0.14em] ${
            open ? "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-soft" : "border-white/10 bg-white/5 text-ivory-faint"
          }`}>
            {open ? "Predictions Open" : "Predictions Locked"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/25 bg-gold-400/5 px-3 py-1 font-data text-[10px] uppercase tracking-[0.14em] text-gold-300">
            <ShieldCheck size={13} />
            Virtual points only
          </span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `PredictionModeSelector.tsx`**

```tsx
import { Trophy, UsersRound } from "lucide-react";
import type { PredictionOptions, PredictionType } from "../types/prediction.types";
import { getEntryCost, getRewardLabel } from "../predictionCockpitUtils";

export function PredictionModeSelector({
  options,
  predType,
  onChange,
}: {
  options: PredictionOptions | null;
  predType: PredictionType;
  onChange: (value: PredictionType) => void;
}) {
  const modes = [
    { key: "WINNER" as const, label: "Winner", Icon: Trophy },
    { key: "TOP3" as const, label: "Top 3", Icon: UsersRound },
  ];

  return (
    <div className="rounded-2xl border border-white/8 bg-turf-900 p-4">
      <h2 className="eyebrow text-emerald-soft">Prediction Type</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {modes.map(({ key, label, Icon }) => {
          const active = predType === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(key)}
              className={`flex min-h-24 items-center gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                active ? "border-gold-400/70 bg-gold-400/10 text-ivory" : "border-white/10 bg-turf-950 text-ivory-dim hover:border-white/25"
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-lg border ${active ? "border-gold-400 bg-gold-400 text-turf-950" : "border-white/10 text-gold-300"}`}>
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-display text-xl font-medium">{label}</span>
                <span className="mt-1 block text-xs font-semibold">
                  {getEntryCost(options, key)} entry points · {getRewardLabel(options, key)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `Top3OrderSelector.tsx`**

```tsx
import { X } from "lucide-react";
import type { PickSlot, Picks } from "../predictionCockpitUtils";
import { formatRunnerName } from "../predictionCockpitUtils";
import type { PredictionOptions } from "../types/prediction.types";

const slots: Array<{ key: PickSlot; label: string }> = [
  { key: "winnerId", label: "First" },
  { key: "secondId", label: "Second" },
  { key: "thirdId", label: "Third" },
];

export function Top3OrderSelector({
  options,
  picks,
  activeSlot,
  onActiveSlot,
  onClearSlot,
}: {
  options: PredictionOptions | null;
  picks: Picks;
  activeSlot: PickSlot | null;
  onActiveSlot: (slot: PickSlot) => void;
  onClearSlot: (slot: PickSlot) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {slots.map((slot) => {
        const runnerId = picks[slot.key];
        const active = activeSlot === slot.key;
        return (
          <div
            key={slot.key}
            className={`rounded-xl border p-3 ${active ? "border-gold-400 bg-gold-400/10" : runnerId ? "border-emerald-glow/40 bg-emerald-glow/10" : "border-dashed border-white/15 bg-turf-950"}`}
          >
            <button type="button" onClick={() => onActiveSlot(slot.key)} className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400">
              <span className="font-data text-[10px] uppercase tracking-[0.18em] text-gold-300">{slot.label}</span>
              <span className="mt-1 block truncate text-sm font-bold text-ivory">{formatRunnerName(options, runnerId)}</span>
            </button>
            {runnerId ? (
              <button type="button" onClick={() => onClearSlot(slot.key)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ivory-faint hover:text-rose-300">
                <X size={12} />
                Clear
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Run TypeScript check for new components**

Run:

```bash
cd frontend
npm run build
```

Expected at this point: it may fail because the new components are not wired yet, but it must not fail for syntax errors in the files created in this task.

---

### Task 3: Runner Table and Right Slip

**Files:**
- Create: `frontend/src/pages/spectator/predictions/components/RunnerTable.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/PredictionSlip.tsx`
- Create: `frontend/src/pages/spectator/predictions/components/MyPredictionsPanel.tsx`

- [ ] **Step 1: Create `RunnerTable.tsx`**

```tsx
import { Check, Circle } from "lucide-react";
import type { PickSlot, Picks } from "../predictionCockpitUtils";
import { getPickedSlot } from "../predictionCockpitUtils";
import type { PredictionOptions, PredictionType } from "../types/prediction.types";

const slotLabel: Record<PickSlot, string> = {
  winnerId: "First",
  secondId: "Second",
  thirdId: "Third",
};

function communityRate(options: PredictionOptions, predType: PredictionType, runnerId: number) {
  const runner = options.options.find((item) => item.raceParticipantId === runnerId);
  const rate = predType === "WINNER" ? runner?.communityWinnerRate : runner?.communityTop3Rate;
  return rate == null ? "-" : `${Math.round(rate * 100)}%`;
}

export function RunnerTable({
  options,
  predType,
  picks,
  disabled,
  onSelectRunner,
}: {
  options: PredictionOptions;
  predType: PredictionType;
  picks: Picks;
  disabled: boolean;
  onSelectRunner: (participantId: number) => void;
}) {
  if (options.options.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-turf-900 p-8 text-center text-sm font-semibold text-ivory-dim">
        The runner field is not available for this race yet.
      </div>
    );
  }

  const showCommunity = predType === "WINNER" ? options.winnerDistributionVisible : options.top3DistributionVisible;

  return (
    <section aria-labelledby="runner-table-title" className="overflow-hidden rounded-2xl border border-white/8 bg-turf-900">
      <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
        <h2 id="runner-table-title" className="eyebrow text-emerald-soft">Runner Field</h2>
        <p className="font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint">
          {predType === "WINNER" ? "Choose one runner" : "Auto-fills First, Second, Third"}
        </p>
      </div>

      <div className="hidden md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-turf-950 text-left font-data text-[10px] uppercase tracking-[0.16em] text-ivory-faint">
            <tr>
              <th className="px-5 py-3">Bib</th>
              <th className="px-5 py-3">Horse</th>
              <th className="px-5 py-3">Jockey</th>
              <th className="px-5 py-3">Owner / Stable</th>
              <th className="px-5 py-3">Community Picks</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Select</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {options.options.map((runner) => {
              const pickedSlot = getPickedSlot(picks, runner.raceParticipantId);
              const picked = pickedSlot != null;
              return (
                <tr key={runner.raceParticipantId} className={picked ? "bg-gold-400/10" : "bg-transparent"}>
                  <td className="px-5 py-4">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg border font-data font-semibold ${picked ? "border-gold-400 bg-gold-400 text-turf-950" : "border-gold-400/30 bg-gold-400/5 text-gold-200"}`}>
                      {runner.startNumber ?? runner.laneNumber ?? "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-display text-lg font-medium text-ivory">{runner.horseName}</td>
                  <td className="px-5 py-4 text-ivory-dim">{runner.jockeyName}</td>
                  <td className="px-5 py-4 text-ivory-faint">-</td>
                  <td className="px-5 py-4 font-data text-gold-300">{showCommunity ? communityRate(options, predType, runner.raceParticipantId) : "-"}</td>
                  <td className="px-5 py-4 text-emerald-soft">Eligible</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={picked}
                      onClick={() => onSelectRunner(runner.raceParticipantId)}
                      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        picked ? "border-gold-400 bg-gold-400 text-turf-950" : "border-gold-400/40 text-gold-300 hover:bg-gold-400/10"
                      }`}
                    >
                      {picked ? <Check size={14} /> : <Circle size={12} />}
                      {pickedSlot ? slotLabel[pickedSlot] : "Choose"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {options.options.map((runner) => {
          const pickedSlot = getPickedSlot(picks, runner.raceParticipantId);
          const picked = pickedSlot != null;
          return (
            <button
              key={runner.raceParticipantId}
              type="button"
              disabled={disabled}
              aria-pressed={picked}
              onClick={() => onSelectRunner(runner.raceParticipantId)}
              className={`min-h-24 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                picked ? "border-gold-400 bg-gold-400/10" : "border-white/10 bg-turf-950"
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="font-data text-[11px] uppercase tracking-[0.16em] text-gold-300">
                    #{runner.startNumber ?? runner.laneNumber ?? "-"}
                  </span>
                  <span className="mt-1 block font-display text-xl font-medium text-ivory">{runner.horseName}</span>
                  <span className="mt-1 block text-sm text-ivory-dim">{runner.jockeyName}</span>
                </span>
                {pickedSlot ? (
                  <span className="rounded-full border border-gold-400/40 px-2 py-1 font-data text-[10px] uppercase tracking-[0.12em] text-gold-300">
                    {slotLabel[pickedSlot]}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `MyPredictionsPanel.tsx`**

```tsx
import { Edit3 } from "lucide-react";
import { filterSlipPredictions } from "../predictionCockpitUtils";
import type { OpenRacePrediction, UserPrediction } from "../types/prediction.types";
import { predictionStatusLabel } from "../types/prediction.types";
import { PredictionResultCard } from "./PredictionResultCard";

export function MyPredictionsPanel({
  predictions,
  selectedRace,
  onEditPrediction,
}: {
  predictions: UserPrediction[];
  selectedRace: OpenRacePrediction | null;
  onEditPrediction: (prediction: UserPrediction) => void;
}) {
  const visiblePredictions = filterSlipPredictions(predictions, selectedRace);

  return (
    <section className="rounded-2xl border border-white/8 bg-turf-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="eyebrow text-emerald-soft">My Predictions</h2>
        <span className="rounded-full bg-white/5 px-2.5 py-1 font-data text-[10px] text-ivory-faint">
          {visiblePredictions.length}
        </span>
      </div>

      {visiblePredictions.length === 0 ? (
        <p className="mt-4 text-sm text-ivory-dim">No predictions for this race yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {visiblePredictions.map((prediction) => (
            <article key={prediction.id} className="rounded-xl border border-white/8 bg-turf-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-medium text-ivory">{prediction.raceName || selectedRace?.raceName || "Race"}</p>
                  <p className="mt-1 font-data text-[10px] uppercase tracking-[0.16em] text-gold-300">
                    {prediction.predictionType}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2 py-0.5 font-data text-[9px] uppercase tracking-[0.12em] text-ivory-faint">
                  {predictionStatusLabel[prediction.status] || prediction.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs font-semibold text-ivory-dim">
                <p><span className="text-gold-300">First</span> {prediction.predictedWinnerName || `ID #${prediction.predictedWinnerId}`}</p>
                {prediction.predictionType === "TOP3" ? (
                  <>
                    <p><span className="text-gold-300">Second</span> {prediction.predictedSecondName || `ID #${prediction.predictedSecondId}`}</p>
                    <p><span className="text-gold-300">Third</span> {prediction.predictedThirdName || `ID #${prediction.predictedThirdId}`}</p>
                  </>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-ivory-dim">
                <span>{prediction.entryCostPoints} entry points</span>
                {prediction.status === "PENDING" ? (
                  <button type="button" onClick={() => onEditPrediction(prediction)} className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.12em] text-emerald-soft hover:text-emerald-glow">
                    <Edit3 size={13} />
                    Edit
                  </button>
                ) : null}
              </div>

              {["CORRECT", "CORRECT_EXACT", "CORRECT_ANY_ORDER", "INCORRECT", "REFUNDED", "CANCELLED"].includes(prediction.status) ? (
                <div className="mt-3">
                  <PredictionResultCard
                    status={prediction.status}
                    resultCategory={prediction.resultCategory}
                    rewardPoints={prediction.rewardPoints}
                    entryCost={prediction.entryCostPoints}
                  />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create `PredictionSlip.tsx`**

```tsx
import { useState } from "react";
import { RotateCcw, Send, X } from "lucide-react";
import { Countdown } from "../../../../components/client/Countdown";
import type { OpenRacePrediction, PredictionOptions, PredictionType, UserPrediction } from "../types/prediction.types";
import type { Picks } from "../predictionCockpitUtils";
import {
  derivePredictionValidation,
  formatRunnerName,
  getEntryCost,
  getRewardLabel,
} from "../predictionCockpitUtils";
import { MyPredictionsPanel } from "./MyPredictionsPanel";

export function PredictionSlip({
  race,
  options,
  predType,
  picks,
  pointBalance,
  isUpdate,
  myPredictions,
  onClear,
  onConfirm,
  onEditPrediction,
}: {
  race: OpenRacePrediction | null;
  options: PredictionOptions | null;
  predType: PredictionType;
  picks: Picks;
  pointBalance: number;
  isUpdate: boolean;
  myPredictions: UserPrediction[];
  onClear: () => void;
  onConfirm: () => Promise<void>;
  onEditPrediction: (prediction: UserPrediction) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const validation = derivePredictionValidation({ predType, picks, options, pointBalance, isUpdate });
  const entryCost = getEntryCost(options, predType);
  const balanceAfter = isUpdate ? pointBalance : pointBalance - entryCost;

  const handleConfirm = async () => {
    if (!validation.canConfirm) return;
    setSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      await onConfirm();
      setSuccess(isUpdate ? "Your prediction has been updated." : "Your prediction is confirmed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <section className="rounded-2xl border border-gold-600/25 bg-turf-900 p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-medium text-ivory">Prediction Slip</h2>
            <p className="mt-1 text-xs text-ivory-faint">{race?.raceName || "Select a race"}</p>
          </div>
          <button type="button" onClick={onClear} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-ivory-faint hover:border-gold-400/50 hover:text-gold-300" aria-label="Clear selections">
            <X size={16} />
          </button>
        </div>

        {race ? (
          <div className="mt-5 rounded-xl border border-white/8 bg-turf-950 p-4">
            <p className="eyebrow text-gold-300">Countdown to lock</p>
            <div className="mt-4">
              <Countdown target={race.raceAt} doneLabel="Locked" />
            </div>
          </div>
        ) : null}

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/8 pb-3">
            <dt className="text-ivory-faint">Type</dt>
            <dd className="font-data text-gold-300">{predType}</dd>
          </div>
          <div className="border-b border-white/8 pb-3">
            <dt className="text-ivory-faint">Selection</dt>
            <dd className="mt-2 space-y-1 font-semibold text-ivory">
              <p><span className="font-data text-gold-300">First</span> {formatRunnerName(options, picks.winnerId)}</p>
              {predType === "TOP3" ? (
                <>
                  <p><span className="font-data text-gold-300">Second</span> {formatRunnerName(options, picks.secondId)}</p>
                  <p><span className="font-data text-gold-300">Third</span> {formatRunnerName(options, picks.thirdId)}</p>
                </>
              ) : null}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ivory-faint">Entry Points</dt>
            <dd className="font-data text-ivory">{isUpdate ? "0 editing" : entryCost}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ivory-faint">Reward Points</dt>
            <dd className="text-right font-data text-gold-300">{getRewardLabel(options, predType)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ivory-faint">Balance</dt>
            <dd className="font-data text-ivory">{pointBalance}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ivory-faint">After Confirm</dt>
            <dd className={`font-data ${balanceAfter < 0 ? "text-rose-300" : "text-emerald-soft"}`}>{balanceAfter}</dd>
          </div>
        </dl>

        <p className={`mt-5 rounded-xl border px-4 py-3 text-xs font-semibold ${
          validation.canConfirm ? "border-emerald-glow/30 bg-emerald-glow/10 text-emerald-soft" : "border-gold-600/30 bg-gold-400/5 text-gold-200"
        }`} role={validation.canConfirm ? "status" : "alert"}>
          {validation.message}
        </p>

        {success ? <p className="mt-4 rounded-xl border border-emerald-glow/40 bg-emerald-glow/10 px-4 py-3 text-sm font-semibold text-emerald-soft" role="status">{success}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-nyraRed/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300" role="alert">{error}</p> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr] lg:grid-cols-1 xl:grid-cols-[auto_1fr]">
          <button type="button" onClick={onClear} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.14em] text-ivory-dim hover:border-white/25 hover:text-ivory">
            <RotateCcw size={14} />
            Clear
          </button>
          <button
            type="button"
            disabled={!validation.canConfirm || submitting}
            onClick={handleConfirm}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gold-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={14} />
            {submitting ? "Confirming..." : isUpdate ? "Confirm Update" : "Confirm Prediction"}
          </button>
        </div>
      </section>

      <MyPredictionsPanel predictions={myPredictions} selectedRace={race} onEditPrediction={onEditPrediction} />
    </aside>
  );
}
```

- [ ] **Step 4: Run TypeScript check for component syntax**

Run:

```bash
cd frontend
npm run build
```

Expected at this point: it may still fail because the page has not been refactored to use the new components, but the new component files should not have syntax/type errors.

---

### Task 4: Refactor `SpectatorPredictionsPage` Into Cockpit

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.tsx`

- [ ] **Step 1: Replace wizard orchestration with cockpit orchestration**

Modify `SpectatorPredictionsPage.tsx` to:

- remove `activeTab`, `step`, `StepRail`, `ActiveRacesList`, `HorsePickPanel`, `TicketReview`, and `MyPredictionsList` imports;
- use `useSearchParams` as `[searchParams, setSearchParams]`;
- import new cockpit components and helpers;
- keep `PredictionArenaHeader`, `CommunityChoices`, `ClientHeader`, and `ClientFooter`.

The important replacement imports are:

```tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { ClientHeader } from "../../../components/client/ClientHeader";
import { ClientFooter } from "../../../components/client/ClientFooter";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { useSpectatorPredictions } from "./hooks/useSpectatorPredictions";
import { PredictionArenaHeader } from "./components/PredictionArenaHeader";
import { CommunityChoices } from "./components/CommunityChoices";
import { RaceTimeline } from "./components/RaceTimeline";
import { RaceCockpitHeader } from "./components/RaceCockpitHeader";
import { PredictionModeSelector } from "./components/PredictionModeSelector";
import { Top3OrderSelector } from "./components/Top3OrderSelector";
import { RunnerTable } from "./components/RunnerTable";
import { PredictionSlip } from "./components/PredictionSlip";
import {
  EMPTY_PICKS,
  pickRunnerForMode,
  setPickSlot,
  type PickSlot,
  type Picks,
} from "./predictionCockpitUtils";
import type { PredictionType, UserPrediction } from "./types/prediction.types";
```

- [ ] **Step 2: Add cockpit state and URL sync**

Use this state shape inside the component:

```tsx
const [predType, setPredType] = useState<PredictionType>("WINNER");
const [picks, setPicks] = useState<Picks>(EMPTY_PICKS);
const [activeTop3Slot, setActiveTop3Slot] = useState<PickSlot | null>(null);
const [booted, setBooted] = useState(false);
const [searchParams, setSearchParams] = useSearchParams();
const deepLinkApplied = useRef(false);
```

Update race selection:

```tsx
const handleSelectRace = (race: (typeof openRaces)[number]) => {
  selectRace(race);
  setActiveTop3Slot(null);
  setSearchParams({ raceId: String(race.raceId) }, { replace: true });
};
```

Keep deep-link selection but remove `setStep`:

```tsx
useEffect(() => {
  if (deepLinkApplied.current || loading) return;
  const raw = searchParams.get("raceId");
  if (!raw) {
    deepLinkApplied.current = true;
    return;
  }
  deepLinkApplied.current = true;
  const target = openRaces.find((race) => race.raceId === Number(raw));
  if (target) selectRace(target);
}, [loading, openRaces, searchParams, selectRace]);
```

If `selectRace` identity causes an effect-loop lint issue, keep the existing local lint suppression pattern used by the page today.

- [ ] **Step 3: Preserve prefill and edit behavior**

Keep the existing prediction prefill logic with `EMPTY_PICKS` from the utility module:

```tsx
const existingPred = predictionOptions?.myPredictions?.find((prediction) => prediction.predictionType === predType);
const pointBalance = pointAccount?.pointBalance ?? 0;

useEffect(() => {
  if (existingPred) {
    setPicks({
      winnerId: existingPred.predictedWinnerId,
      secondId: existingPred.predictedSecondId ?? null,
      thirdId: existingPred.predictedThirdId ?? null,
    });
  } else {
    setPicks(EMPTY_PICKS);
  }
  setActiveTop3Slot(null);
}, [existingPred?.id, predType, predictionOptions?.raceId]);
```

Update edit behavior to sync the URL:

```tsx
const handleEdit = (prediction: UserPrediction) => {
  const matchingRace = openRaces.find((race) => race.raceId === prediction.raceId);
  if (!matchingRace) return;
  setPredType(prediction.predictionType);
  selectRace(matchingRace);
  setSearchParams({ raceId: String(matchingRace.raceId) }, { replace: true });
  setActiveTop3Slot(null);
};
```

- [ ] **Step 4: Add runner and submit handlers**

```tsx
const handleModeChange = (nextType: PredictionType) => {
  setPredType(nextType);
  setActiveTop3Slot(null);
};

const handleSelectRunner = (participantId: number) => {
  setPicks((current) =>
    pickRunnerForMode({
      picks: current,
      predType,
      participantId,
      activeSlot: predType === "TOP3" ? activeTop3Slot : null,
    }),
  );
  if (predType === "TOP3") setActiveTop3Slot(null);
};

const handleClearSlot = (slot: PickSlot) => {
  setPicks((current) => setPickSlot(current, slot, null));
  setActiveTop3Slot(slot);
};

const handleClearSelections = () => {
  setPicks(EMPTY_PICKS);
  setActiveTop3Slot(null);
};

const handleConfirm = async () => {
  if (!selectedRace || !picks.winnerId) return;
  const payload = {
    raceId: selectedRace.raceId,
    predictionType: predType,
    predictedWinnerId: picks.winnerId,
    predictedSecondId: predType === "TOP3" ? picks.secondId : null,
    predictedThirdId: predType === "TOP3" ? picks.thirdId : null,
  };
  if (existingPred) await updatePrediction(existingPred.id, payload);
  else await submitPrediction(payload);
};
```

- [ ] **Step 5: Replace JSX body with cockpit layout**

The body after loading/error should render:

```tsx
{booted ? (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
    className="mt-8 space-y-6"
  >
    <RaceTimeline
      races={openRaces}
      selectedRace={selectedRace}
      selectedPredictionOpen={predictionOptions?.predictionOpen}
      onSelectRace={handleSelectRace}
    />

    {selectedRace ? (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <RaceCockpitHeader race={selectedRace} options={predictionOptions} />
          <PredictionModeSelector options={predictionOptions} predType={predType} onChange={handleModeChange} />
          {predType === "TOP3" ? (
            <Top3OrderSelector
              options={predictionOptions}
              picks={picks}
              activeSlot={activeTop3Slot}
              onActiveSlot={setActiveTop3Slot}
              onClearSlot={handleClearSlot}
            />
          ) : null}
          {!predictionOptions || loading ? (
            <div className="h-72 animate-pulse rounded-2xl border border-white/8 bg-turf-900" aria-label="Loading race options" />
          ) : (
            <>
              <RunnerTable
                options={predictionOptions}
                predType={predType}
                picks={picks}
                disabled={!predictionOptions.predictionOpen}
                onSelectRunner={handleSelectRunner}
              />
              {showCommunity ? (
                <div className="rounded-2xl border border-white/8 bg-turf-900 p-5">
                  <CommunityChoices options={predictionOptions.options} predictionType={predType} />
                </div>
              ) : null}
            </>
          )}
        </div>

        <PredictionSlip
          race={selectedRace}
          options={predictionOptions}
          predType={predType}
          picks={picks}
          pointBalance={pointBalance}
          isUpdate={Boolean(existingPred)}
          myPredictions={myPredictions}
          onClear={handleClearSelections}
          onConfirm={handleConfirm}
          onEditPrediction={handleEdit}
        />
      </div>
    ) : null}
  </motion.div>
) : null}
```

- [ ] **Step 6: Run focused page test and record failures for updates**

Run:

```bash
cd frontend
npm test -- SpectatorPredictionsPage
```

Expected: FAIL because tests still look for wizard labels such as `review ticket` and `prediction ticket`.

---

### Task 5: Update Page Tests for Cockpit Behavior

**Files:**
- Modify: `frontend/src/pages/spectator/predictions/SpectatorPredictionsPage.test.tsx`

- [ ] **Step 1: Expand mock data to support TOP3**

Change the `options.options` mock to include a third runner:

```ts
options: [
  { raceParticipantId: 1, startNumber: 1, laneNumber: 2, horseName: "Thunder Bay", jockeyName: "J. Rider" },
  { raceParticipantId: 2, startNumber: 2, laneNumber: 5, horseName: "Silver Reef", jockeyName: "M. Swift" },
  { raceParticipantId: 3, startNumber: 3, laneNumber: 7, horseName: "Golden Arrow", jockeyName: "A. Cruz" },
],
```

- [ ] **Step 2: Replace winner submit test**

Use this test:

```tsx
it("selects a race, mirrors the winner pick in the right slip, and submits the prediction", async () => {
  renderArena();

  fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
  fireEvent.click(await screen.findByRole("button", { name: /thunder bay/i }));

  expect(screen.getByText(/prediction slip/i)).toBeInTheDocument();
  expect(screen.getByText(/#1 thunder bay/i)).toBeInTheDocument();
  expect(screen.getByText(/ready to confirm/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /confirm prediction/i }));

  expect(await screen.findByRole("status")).toHaveTextContent(/prediction is confirmed/i);
  expect(spectatorPredictionApi.submitPrediction).toHaveBeenCalledWith({
    raceId: 7,
    predictionType: "WINNER",
    predictedWinnerId: 1,
    predictedSecondId: null,
    predictedThirdId: null,
  });
});
```

- [ ] **Step 3: Replace TOP3 validation test**

Use this test:

```tsx
it("keeps confirm disabled until Top 3 has three distinct runners", async () => {
  renderArena();

  fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
  fireEvent.click(await screen.findByRole("button", { name: /top 3/i }));
  fireEvent.click(await screen.findByRole("button", { name: /thunder bay/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(/choose second and third/i);
  expect(screen.getByRole("button", { name: /confirm prediction/i })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: /silver reef/i }));
  expect(screen.getByRole("alert")).toHaveTextContent(/choose third/i);

  fireEvent.click(screen.getByRole("button", { name: /golden arrow/i }));
  expect(screen.getByText(/ready to confirm/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /confirm prediction/i })).not.toBeDisabled();
});
```

- [ ] **Step 4: Add insufficient-points test**

```tsx
it("disables confirmation when a new prediction needs more points", async () => {
  vi.mocked(spectatorPredictionApi.getPointAccount).mockResolvedValue({ userId: 1, pointBalance: 5 });

  renderArena();

  fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
  fireEvent.click(await screen.findByRole("button", { name: /thunder bay/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(/you need 5 more points/i);
  expect(screen.getByRole("button", { name: /confirm prediction/i })).toBeDisabled();
  expect(spectatorPredictionApi.submitPrediction).not.toHaveBeenCalled();
});
```

- [ ] **Step 5: Add locked race test**

```tsx
it("shows locked state and prevents confirmation when predictionOpen is false", async () => {
  vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue({
    ...options,
    predictionOpen: false,
  });

  renderArena();

  fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));

  expect(await screen.findByText(/predictions locked/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /confirm prediction/i })).toBeDisabled();
});
```

- [ ] **Step 6: Run page tests**

Run:

```bash
cd frontend
npm test -- SpectatorPredictionsPage
```

Expected: PASS for the updated prediction page tests.

---

### Task 6: Final Verification and Cleanup

**Files:**
- Review all files modified in Tasks 1-5.

- [ ] **Step 1: Search for forbidden vocabulary in prediction UI**

Run:

```bash
rg -n "Bet|Betting|Wager|Odds|Stake|Gambling" frontend/src/pages/spectator/predictions
```

Expected: no matches in UI copy except the required compliance disclaimer text if present.

- [ ] **Step 2: Run all prediction-related tests**

Run:

```bash
cd frontend
npm test -- SpectatorPredictionsPage predictionCockpitUtils
```

Expected: PASS.

- [ ] **Step 3: Run frontend production build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS with Vite production build output.

- [ ] **Step 4: Report API limitations**

In the final implementation summary, mention:

- Owner/stable is shown as `-` because the existing `ParticipantOption` API type does not provide owner/stable fields.
- Eligibility is shown as `Eligible` for listed runners because the existing prediction options endpoint only returns selectable participant options and does not provide per-runner eligibility reasons.
- Countdown uses `OpenRacePrediction.raceAt` as the prediction-lock source because no separate `predictionCloseTime` field exists in current types.

- [ ] **Step 5: Do not run git commands**

No staging or commit step is allowed for this task because the user explicitly requested that git not be touched.

---

## Self-Review Checklist

- Spec keeps `/spectator/predictions`, `ClientHeader`, and `ClientFooter`: covered in Task 4.
- Race timeline with URL sync: covered in Task 2 and Task 4.
- Runner table with selectable rows/cards: covered in Task 3.
- `WINNER` and `TOP3` controls: covered in Task 2, Task 3, and Task 4.
- `TOP3` auto-fill plus slot replacement: covered in Task 1, Task 2, and Task 4.
- Right Slip is stateful and validates disabled state: covered in Task 1, Task 3, and Task 5.
- My Predictions scope priority: covered in Task 1 and Task 3.
- Countdown source is `raceAt`: covered in Task 3 and final API limitation report.
- Responsive layout: covered by Task 3 table/cards and Task 4 grid collapse.
- Tests and build verification: covered in Task 5 and Task 6.
- Git avoidance: covered in execution constraint and Task 6.
