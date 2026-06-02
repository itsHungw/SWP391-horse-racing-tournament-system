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
      gateNumber: index + 1,
      progressPercent: 0,
      speedMultiplier: 1 - index * 0.025,
      status: "RUNNING",
    }));
}

export function setLiveFlag(
  state: LiveRaceState,
  mode: LiveRaceState["mode"],
  occurredAt: string
): LiveRaceState {
  const messages: Record<LiveRaceState["mode"], string> = {
    IDLE: "Race controls reset",
    RACING: "Green Flag - race speed restored",
    SAFETY_CAR: "Yellow Flag - Safety Car deployed",
    RED_FLAGGED: "Red Flag - race movement frozen",
    ABORTED: "Race aborted by referee",
    FINISHED_DRAFT: "Chequered Flag - finished draft captured",
  };

  return {
    ...state,
    mode,
    incidents: [...state.incidents, createIncident("FLAG", occurredAt, messages[mode])],
  };
}

export function applyLiveTick(state: LiveRaceState, elapsedMilliseconds: number): LiveRaceState {
  if (state.mode !== "RACING" && state.mode !== "SAFETY_CAR") {
    return state;
  }

  const progressPerSecond =
    state.mode === "SAFETY_CAR"
      ? REFEREE_RACE_DAY_CONFIG.safetyCarProgressPerSecond
      : REFEREE_RACE_DAY_CONFIG.normalProgressPerSecond;
  const seconds = elapsedMilliseconds / 1_000;
  const runners = state.runners.map((runner) => ({
    ...runner,
    progressPercent: Math.min(
      100,
      runner.progressPercent +
        progressPerSecond * seconds * (state.mode === "SAFETY_CAR" ? 1 : runner.speedMultiplier)
    ),
  }));

  return {
    ...state,
    elapsedMilliseconds: state.elapsedMilliseconds + elapsedMilliseconds,
    runners,
  };
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
    return {
      ...state,
      runners: state.runners.filter((entry) => entry.participantId !== participantId),
      outOfRace: [...state.outOfRace, { ...runner, status: "DSQ" }],
      incidents: [
        ...state.incidents,
        createIncident("DSQ", occurredAt, `Horse #${participantId} disqualified`, participantId),
      ],
    };
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
          ? `Horse #${participantId} receives +5s draft penalty`
          : `Horse #${participantId} receives a warning`,
        participantId,
        isFiveSecondPenalty ? 5 : undefined
      ),
    ],
  };
}

export function createFinishedSnapshot(state: LiveRaceState): RaceSnapshot | null {
  const leaderProgress = Math.max(0, ...state.runners.map((runner) => runner.progressPercent));

  if (leaderProgress < REFEREE_RACE_DAY_CONFIG.chequeredFlagUnlockPercent) {
    return null;
  }

  return {
    elapsedMilliseconds: state.elapsedMilliseconds,
    leaderboard: [...state.runners].sort((a, b) => b.progressPercent - a.progressPercent),
    outOfRace: [...state.outOfRace],
    incidents: [...state.incidents],
  };
}
