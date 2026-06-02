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
    {
      participantId: 7,
      horseName: "Golden Arrow",
      gateNumber: 1,
      progressPercent: 70,
      speedMultiplier: 1,
      status: "RUNNING",
    },
    {
      participantId: 3,
      horseName: "Night Bloom",
      gateNumber: 2,
      progressPercent: 60,
      speedMultiplier: 1.6,
      status: "RUNNING",
    },
  ],
  outOfRace: [],
  incidents: [],
};

describe("refereeRaceDayState", () => {
  it("enforces the production window and allows only same-day demo bypass", () => {
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
    const next = applyLiveTick(safetyCar, 10_000);

    expect(next.runners[0].progressPercent).toBeGreaterThan(70);
    expect(next.runners[1].progressPercent).toBeGreaterThan(60);
    expect(next.runners[0].progressPercent).toBeGreaterThan(next.runners[1].progressPercent);
  });

  it("freezes runner progress during a red flag", () => {
    const stopped = setLiveFlag(liveState, "RED_FLAGGED", "2026-06-02T14:09:00+07:00");

    expect(applyLiveTick(stopped, 1_000).runners).toEqual(stopped.runners);
  });

  it("remembers safety car mode while movement is frozen by a red flag", () => {
    const safetyCar = setLiveFlag(liveState, "SAFETY_CAR", "2026-06-02T14:08:00+07:00");
    const stopped = setLiveFlag(safetyCar, "RED_FLAGGED", "2026-06-02T14:09:00+07:00");

    expect(stopped.resumeMode).toBe("SAFETY_CAR");
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
    const eligible = {
      ...liveState,
      runners: liveState.runners.map((runner, index) =>
        index === 0 ? { ...runner, progressPercent: 92 } : runner
      ),
    };

    expect(createFinishedSnapshot(eligible)).toMatchObject({ elapsedMilliseconds: 8_000 });
  });
});
