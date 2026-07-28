import { REFEREE_RACE_DAY_CONFIG } from "./refereeRaceDayConfig";
import {
  LiveRaceState,
  LiveRunner,
  PenaltyAction,
  PreRaceParticipant,
  RaceIncident,
  RaceSnapshot,
} from "./refereeRaceDayModels";

function createIncident(
  type: RaceIncident["type"],
  occurredAt: string,
  message: string,
  participantId?: number,
  penaltySeconds?: number
): RaceIncident {
  return {
    id: `${occurredAt}-${type}-${participantId ?? "race"}`,
    occurredAt,
    type,
    message,
    participantId,
    penaltySeconds,
  };
}

function raceCompletionElapsed(state: LiveRaceState) {
  const finishTimes = state.runners
    .map((runner) => runner.finishMilliseconds)
    .filter((value): value is number => value !== undefined);

  return finishTimes.length === 0 ? state.elapsedMilliseconds : Math.max(...finishTimes);
}

function completeRaceIfFieldSettled(state: LiveRaceState): LiveRaceState {
  const activeRunners = state.runners.filter((runner) => runner.status !== "DSQ");
  const fieldSettled =
    activeRunners.length === 0 ||
    activeRunners.every((runner) => runner.finishMilliseconds !== undefined);

  if (!fieldSettled) {
    return state;
  }

  return {
    ...state,
    mode: "FINISHED_DRAFT",
    elapsedMilliseconds: raceCompletionElapsed(state),
  };
}

export function canOpenPreRaceCheck(scheduledAt: string, now: Date, demoMode: boolean) {
  const start = new Date(scheduledAt);
  const sameDay = start.toDateString() === now.toDateString();

  if (!sameDay) {
    return false;
  }

  if (demoMode) {
    return true;
  }

  const millisecondsUntilStart = start.getTime() - now.getTime();
  return (
    millisecondsUntilStart >= 0 &&
    millisecondsUntilStart <= REFEREE_RACE_DAY_CONFIG.preRaceUnlockMinutes * 60_000
  );
}

export function buildLiveRunners(participants: PreRaceParticipant[]): LiveRunner[] {
  return participants
    .filter((participant) => participant.status === "PASSED")
    .map((participant, index) => ({
      participantId: participant.participantId,
      horseName: participant.horseName,
      jockeyName: participant.jockeyName,
      gateNumber: index + 1,
      progressPercent: 0,
      speedMultiplier: 1 - index * 0.025,
      status: "RUNNING",
    }));
}

export function buildScratchedRunners(participants: PreRaceParticipant[]): LiveRunner[] {
  return participants
    .filter((participant) => participant.status === "SCRATCHED")
    .map((participant, index) => ({
      participantId: participant.participantId,
      horseName: participant.horseName,
      jockeyName: participant.jockeyName,
      gateNumber: index + 1,
      progressPercent: 0,
      speedMultiplier: 1,
      status: "DNS",
    }));
}

export function setLiveFlag(
  state: LiveRaceState,
  mode: LiveRaceState["mode"],
  occurredAt: string
): LiveRaceState {
  const messages: Record<LiveRaceState["mode"], string> = {
    IDLE: "Race controls reset",
    RACING: "Track Cleared - Race Resumed",
    SAFETY_CAR: "Track Hazard - Caution Period Enabled",
    RED_FLAGGED: "Red Flag - race movement frozen",
    ABORTED: "Race aborted by referee",
    FINISHED_DRAFT: "Chequered Flag - finished draft captured",
  };
  const resumeMode =
    mode === "RED_FLAGGED" && (state.mode === "RACING" || state.mode === "SAFETY_CAR")
      ? state.mode
      : mode === "RED_FLAGGED"
        ? state.resumeMode
        : undefined;

  return {
    ...state,
    mode,
    resumeMode,
    incidents: [...state.incidents, createIncident("FLAG", occurredAt, messages[mode])],
  };
}

export function applyLiveTick(state: LiveRaceState, elapsedMilliseconds: number): LiveRaceState {
  if (state.mode !== "RACING" && state.mode !== "SAFETY_CAR") {
    return state;
  }

  const nextElapsedMilliseconds = state.elapsedMilliseconds + elapsedMilliseconds;
  const progressPerSecond =
    state.mode === "SAFETY_CAR"
      ? REFEREE_RACE_DAY_CONFIG.safetyCarProgressPerSecond
      : REFEREE_RACE_DAY_CONFIG.normalProgressPerSecond;
  const seconds = elapsedMilliseconds / 1_000;
  const runners = state.runners.map((runner) => {
    if (runner.status === "DSQ" || runner.finishMilliseconds !== undefined) {
      return runner;
    }

    return {
      ...runner,
      progressPercent: Math.min(
        100,
        runner.progressPercent +
          progressPerSecond * seconds * (state.mode === "SAFETY_CAR" ? 1 : runner.speedMultiplier)
      ),
    };
  });

  return {
    ...state,
    elapsedMilliseconds: nextElapsedMilliseconds,
    runners,
  };
}

export function advanceLiveClock(state: LiveRaceState, lastFlushAtMs: number, nowMs: number): LiveRaceState {
  const delta = nowMs - lastFlushAtMs;
  return delta > 0 ? applyLiveTick(state, delta) : state;
}

export function markRunnerFinished(
  state: LiveRaceState,
  participantId: number,
  occurredAt: string
): LiveRaceState {
  const runner = state.runners.find((entry) => entry.participantId === participantId);

  if (!runner || runner.status !== "RUNNING" || runner.finishMilliseconds !== undefined) {
    return state;
  }

  const nextState: LiveRaceState = {
    ...state,
    runners: state.runners.map((entry) =>
      entry.participantId === participantId
        ? {
            ...entry,
            progressPercent: 100,
            finishMilliseconds: state.elapsedMilliseconds,
          }
        : entry
    ),
    incidents: [
      ...state.incidents,
      createIncident(
        "FLAG",
        occurredAt,
        `${runner.horseName} finished at ${(state.elapsedMilliseconds / 1_000).toFixed(3)}s`,
        participantId
      ),
    ],
  };

  return completeRaceIfFieldSettled(nextState);
}

export function applyPenalty(
  state: LiveRaceState,
  participantId: number,
  action: PenaltyAction,
  occurredAt: string
): LiveRaceState {
  const runner = state.runners.find((entry) => entry.participantId === participantId);

  if (!runner) {
    return state;
  }

  if (action === "DSQ") {
    return completeRaceIfFieldSettled({
      ...state,
      runners: state.runners.filter((entry) => entry.participantId !== participantId),
      outOfRace: [...state.outOfRace, { ...runner, status: "DSQ" }],
      incidents: [
        ...state.incidents,
        createIncident("DSQ", occurredAt, `${runner.horseName} disqualified`, participantId),
      ],
    });
  }

  const isFiveSecondPenalty = action === "PENALTY_5S";
  return {
    ...state,
    incidents: [
      ...state.incidents,
      createIncident(
        isFiveSecondPenalty ? "PENALTY" : "WARNING",
        occurredAt,
        isFiveSecondPenalty
          ? `${runner.horseName} receives +5s penalty`
          : `${runner.horseName} receives a warning`,
        participantId,
        isFiveSecondPenalty ? 5 : undefined
      ),
    ],
  };
}

export function createFinishedSnapshot(state: LiveRaceState): RaceSnapshot | null {
  const activeRunners = state.runners.filter((runner) => runner.status !== "DSQ");

  if (
    activeRunners.length === 0 ||
    activeRunners.some((runner) => runner.finishMilliseconds === undefined)
  ) {
    return null;
  }

  return {
    elapsedMilliseconds: raceCompletionElapsed(state),
    leaderboard: [...state.runners].sort((a, b) => {
      const finishDelta = (a.finishMilliseconds ?? Number.POSITIVE_INFINITY) - (b.finishMilliseconds ?? Number.POSITIVE_INFINITY);
      return finishDelta || b.progressPercent - a.progressPercent;
    }),
    outOfRace: [...state.outOfRace],
    incidents: [...state.incidents],
  };
}
