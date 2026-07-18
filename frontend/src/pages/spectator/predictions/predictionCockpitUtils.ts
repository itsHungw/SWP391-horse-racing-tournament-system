import type { OpenRacePrediction, PredictionOptions, PredictionType, UserPrediction } from "./types/prediction.types";

export type PickSlot = "winnerId";

export interface Picks {
  winnerId: number | null; // Used as horseId for EXACT_POSITION
  predictedPosition?: number | null; // Used for EXACT_POSITION
}

export interface PredictionValidation {
  canConfirm: boolean;
  message: string;
}

export interface RaceTimelineStatus {
  label: "Open" | "Closing Soon" | "Locked" | "Finished";
  tone: "success" | "warning" | "muted" | "neutral";
}

export const EMPTY_PICKS: Picks = {
  winnerId: null,
  predictedPosition: null,
};

export const bibClasses = [
  "bg-[#c9252d] text-white",
  "bg-[#2d63d8] text-white",
  "bg-[#f2cc49] text-turf-900",
  "bg-[#65aa4d] text-white",
  "bg-[#7b54d9] text-white",
  "bg-[#4b5568] text-white",
  "bg-[#f28a18] text-turf-900",
  "bg-[#e7edf7] text-turf-900",
];

export function formatBib(startNumber: number | null, laneNumber: number | null): string {
  return String(startNumber ?? laneNumber ?? "-");
}

export function getBibClass(value: string): string {
  const index = Number(value) - 1;
  return bibClasses[index] ?? "bg-turf-800 text-ivory";
}

// --- Money math (shared by the bet slip, streak slip, and prediction cards) ---
// House takeout baked into the displayed odds — mirrors backend `app.prediction.*` defaults.
// Display-only: single-race payouts are settled from the real pari-mutuel pool at close.
export const HOUSE_TAKEOUT_PCT = 15;
export const STREAK_TAKEOUT = 0.2;
export const STREAK_MAX_ODDS = 100;

export function formatVnd(amount: number): string {
  return Math.round(amount || 0).toLocaleString("en-US");
}

export interface PayoutMath {
  stake: number;
  odds: number; // decimal multiplier
  payout: number; // gross return if the bet wins = floor(stake * odds)
  profit: number; // net = payout - stake
  returnPct: number; // profit / stake * 100
}

export function computePayout(stake: number, odds: number | null | undefined): PayoutMath {
  const safeStake = Math.max(0, Math.round(stake || 0));
  const safeOdds = typeof odds === "number" && Number.isFinite(odds) && odds > 0 ? odds : 0;
  const payout = Math.floor(safeStake * safeOdds);
  const profit = payout - safeStake;
  return {
    stake: safeStake,
    odds: safeOdds,
    payout,
    profit,
    returnPct: safeStake > 0 ? (profit / safeStake) * 100 : 0,
  };
}

// Streak parlay multiplier from per-leg odds: sum(legOdds), capped.
// Note: The commission is already baked into each legOdds by the backend.
export function computeStreakOdds(legOdds: number[]): number {
  if (legOdds.length === 0) return 0;
  const sum = legOdds.reduce((acc, o) => acc + (o > 0 ? o : 0), 0);
  return Math.min(sum, STREAK_MAX_ODDS);
}

export function getEntryCost(options: PredictionOptions | null | undefined, predType: PredictionType): number {
  if (!options) {
    return 0;
  }

  return options.entryCost?.winner || 0;
}

export function getRewardLabel(options: PredictionOptions | null | undefined, predType: PredictionType): string {
  if (!options) {
    return "-";
  }

  if (predType === "HEAD_TO_HEAD") {
    return "Matchup estimate";
  }

  return "-";
}

export function formatRunnerName(options: PredictionOptions | null | undefined, participantId: number | null): string {
  if (participantId == null || !options) {
    return "-";
  }

  const runner = options.options.find((option) => option.raceParticipantId === participantId);
  if (!runner) {
    return "-";
  }

  return `#${runner.startNumber ?? runner.laneNumber ?? "-"} ${runner.horseName}`;
}

export function getPickedSlot(picks: Picks, participantId: number): PickSlot | null {
  return picks.winnerId === participantId ? "winnerId" : null;
}

export function pickRunnerForMode({
  picks,
  participantId,
}: {
  picks: Picks;
  participantId: number;
}): Picks {
  // Single-winner pick (toggle). EXACT_POSITION is handled separately by its own UI
  // because it needs both a horse and a position.
  if (picks.winnerId === participantId) {
    return { ...EMPTY_PICKS };
  }
  return { ...EMPTY_PICKS, winnerId: participantId };
}

export function derivePredictionValidation({
  predType,
  picks,
  options,
  pointBalance,
  isUpdate,
  wagerAmount,
}: {
  predType: PredictionType;
  picks: Picks;
  options: PredictionOptions | null | undefined;
  pointBalance: number;
  isUpdate: boolean;
  wagerAmount: number;
}): PredictionValidation {
  if (!options) {
    return { canConfirm: false, message: "Race options are still loading." };
  }

  if (!options.predictionOpen) {
    return { canConfirm: false, message: "Predictions are locked for this race." };
  }

  if (predType === "EXACT_POSITION") {
    if (picks.winnerId == null || picks.predictedPosition == null) {
      return { canConfirm: false, message: "Choose a horse and position." };
    }
  }

  if (predType === "WINNER" && picks.winnerId == null) {
    return { canConfirm: false, message: "Choose a runner for First." };
  }

  if (predType === "HEAD_TO_HEAD") {
    if (picks.winnerId == null) {
      return { canConfirm: false, message: "Choose a horse for the Head-to-Head matchup." };
    }
  }

  if (wagerAmount < 10000) {
    return { canConfirm: false, message: "Minimum wager is 10,000 VND." };
  }

  if (!isUpdate && pointBalance < wagerAmount) {
    return { canConfirm: false, message: `You need ${(wagerAmount - pointBalance).toLocaleString("en-US")} more VND.` };
  }

  return { canConfirm: true, message: "Ready to confirm." };
}

export function getRaceTimelineStatus(race: OpenRacePrediction, predictionOpen?: boolean): RaceTimelineStatus {
  const raceTime = new Date(race.raceAt).getTime();
  const now = Date.now();

  if (Number.isFinite(raceTime) && raceTime <= now) {
    return { label: "Finished", tone: "neutral" };
  }

  if (predictionOpen === false) {
    return { label: "Locked", tone: "muted" };
  }

  if (Number.isFinite(raceTime) && raceTime - now <= 15 * 60 * 1000) {
    return { label: "Closing Soon", tone: "warning" };
  }

  return { label: "Open", tone: "success" };
}

function normalizeTournamentName(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

export function filterSlipPredictions(items: UserPrediction[], selectedRace: OpenRacePrediction | null): UserPrediction[] {
  const sortedItems = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (!selectedRace) {
    return sortedItems.slice(0, 3);
  }

  const selectedRaceItems = sortedItems.filter((item) => item.raceId === selectedRace.raceId);
  if (selectedRaceItems.length > 0) {
    return selectedRaceItems;
  }

  const selectedTournamentName = normalizeTournamentName(selectedRace.tournamentName);
  const tournamentItems = sortedItems.filter((item) => {
    return selectedTournamentName !== "" && normalizeTournamentName(item.championshipName) === selectedTournamentName;
  });
  if (tournamentItems.length > 0) {
    return tournamentItems.slice(0, 3);
  }

  return sortedItems.slice(0, 3);
}
