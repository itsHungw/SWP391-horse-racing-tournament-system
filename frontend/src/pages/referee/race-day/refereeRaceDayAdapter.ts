import { ParticipantVerification, RaceSummary } from "../../../api/refereeApi";
import { AssignedRace, PreRaceParticipant } from "./refereeRaceDayModels";

function demoScheduledAt(now: Date, raceId: number) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = 13 + raceId;

  return `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:00:00.000+07:00`;
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
    equipmentDecision: scratched ? (participant.gearOk ? "PASSED" : "SCRATCHED") : participant.status === "PASSED" ? "PASSED" : "PENDING",
    healthDecision: scratched ? (participant.healthOk ? "PASSED" : "SCRATCHED") : participant.status === "PASSED" ? "PASSED" : "PENDING",
    status: scratched ? "SCRATCHED" : participant.status === "PASSED" ? "PASSED" : "CHECK_HEALTH",
    scratchedReason: scratched
      ? participant.healthOk
        ? "Failed equipment check"
        : "Failed health check"
      : undefined,
  };
}
