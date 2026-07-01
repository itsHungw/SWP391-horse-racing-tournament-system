export type RaceMediaPhase = "PRE_RACE" | "LIVE" | "RESULT_PENDING" | "CONCLUDED";

const LIVE_BLOCKED_STATUSES = new Set(["FINISHED", "RESULT_SUBMITTED", "RESULT_CONFIRMED", "PUBLISHED", "CANCELLED"]);

export function canShowLiveStream(status: string | null | undefined) {
  return !LIVE_BLOCKED_STATUSES.has((status ?? "").toUpperCase());
}

export function raceMediaPhase(status: string | null | undefined): RaceMediaPhase {
  switch ((status ?? "").toUpperCase()) {
    case "ONGOING":
      return "LIVE";
    case "FINISHED":
    case "RESULT_SUBMITTED":
      return "RESULT_PENDING";
    case "RESULT_CONFIRMED":
    case "PUBLISHED":
      return "CONCLUDED";
    default:
      return "PRE_RACE";
  }
}
