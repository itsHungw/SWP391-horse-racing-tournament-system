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

  it("uses horse-racing steward wording for green and caution flag logs", () => {
    const green = setLiveFlag(liveState, "RACING", "2026-06-02T14:07:00+07:00");
    const caution = setLiveFlag(green, "SAFETY_CAR", "2026-06-02T14:08:00+07:00");

    expect(green.incidents.at(-1)?.message).toBe("Track Cleared - Race Resumed");
    expect(caution.incidents.at(-1)?.message).toBe("Track Hazard - Caution Period Enabled");
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

  it("auto-captures finish times and freezes once all active runners finish", () => {
    const nearlyFinished: LiveRaceState = {
      ...liveState,
      runners: liveState.runners.map((runner) => ({ ...runner, progressPercent: 99, speedMultiplier: 1 })),
    };
    const next = applyLiveTick(nearlyFinished, 1_000);

    expect(next.mode).toBe("FINISHED_DRAFT");
    expect(next.runners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ participantId: 7, progressPercent: 100, finishMilliseconds: 9_000 }),
        expect.objectContaining({ participantId: 3, progressPercent: 100, finishMilliseconds: 9_000 }),
      ])
    );
  });

  it("ignores disqualified runners when deciding whether every active runner has finished", () => {
    const oneActiveOneDisqualified: LiveRaceState = {
      ...liveState,
      runners: [
        { ...liveState.runners[0], progressPercent: 99, speedMultiplier: 1 },
        { ...liveState.runners[1], progressPercent: 60, status: "DSQ" },
      ],
    };
    const next = applyLiveTick(oneActiveOneDisqualified, 1_000);

    expect(next.mode).toBe("FINISHED_DRAFT");
    expect(next.runners.find((runner) => runner.participantId === 7)).toMatchObject({
      finishMilliseconds: 9_000,
      progressPercent: 100,
    });
    expect(next.runners.find((runner) => runner.participantId === 3)).not.toHaveProperty("finishMilliseconds");
  });

  it("only creates a finished snapshot once all active runners have locked finish times", () => {
    expect(createFinishedSnapshot(liveState)).toBeNull();
    const eligible = {
      ...liveState,
      mode: "FINISHED_DRAFT" as const,
      runners: liveState.runners.map((runner, index) => ({
        ...runner,
        progressPercent: 100,
        finishMilliseconds: index === 0 ? 8_000 : 9_000,
      })),
    };

    expect(createFinishedSnapshot(eligible)).toMatchObject({ elapsedMilliseconds: 8_000 });
  });
});
