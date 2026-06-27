import { useMemo, useState } from "react";
import { ChevronDown, ReceiptText, WalletCards } from "lucide-react";
import {
  type OpenRacePrediction,
  predictionStatusLabel,
  type PredictionOptions,
  type PredictionStatus,
  type UserPrediction,
} from "../types/prediction.types";
import { computePayout, filterSlipPredictions, formatBib, formatVnd, getBibClass } from "../predictionCockpitUtils";

interface MyPredictionsPanelProps {
  predictions: UserPrediction[];
  selectedRace: OpenRacePrediction | null;
  options?: PredictionOptions | null;
  onViewAll: () => void;
}

const settledStatuses: PredictionStatus[] = [
  "CORRECT",
  "INCORRECT",
  "REFUNDED",
  "CANCELLED",
];

type OddsSource = "live" | "locked" | "settled" | "none";

interface PositionGroup {
  key: string;
  predictions: UserPrediction[];
  sample: UserPrediction;
  raceTitle: string;
  selectionTitle: string;
  marketLabel: string;
  totalStake: number;
  ticketCount: number;
  statusLabel: string;
  statusTone: PredictionStatus | "MIXED";
  odds: number | null;
  oddsSource: OddsSource;
  projectedReturn: number | null;
  projectedProfit: number | null;
  settledReturn: number | null;
  latestCreatedAt: string;
}

function getStatusBadge(status: PredictionStatus | "MIXED"): string {
  switch (status) {
    case "PENDING":
      return "border-white/15 bg-white/5 text-ivory-dim";
    case "LOCKED":
      return "border-gold-600/40 bg-gold-400/10 text-gold-300";
    case "CORRECT":
      return "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-soft";
    case "INCORRECT":
      return "border-white/10 bg-white/5 text-ivory-faint";
    case "REFUNDED":
    case "CANCELLED":
      return "border-gold-600/30 bg-gold-400/5 text-gold-200";
    case "MIXED":
      return "border-sky-400/30 bg-sky-400/10 text-sky-200";
    default:
      return "border-white/15 bg-white/5 text-ivory-dim";
  }
}

function normalizeName(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function getPredictionScope(
  predictions: UserPrediction[],
  selectedRace: OpenRacePrediction | null,
): { label: string; description: string } {
  if (predictions.length === 0) {
    return {
      label: selectedRace ? "Selected race" : "Recent predictions",
      description: selectedRace ? selectedRace.raceName : "Recent race picks",
    };
  }

  if (!selectedRace) {
    return { label: "Recent predictions", description: "Recent race picks" };
  }

  if (predictions.every((prediction) => prediction.raceId === selectedRace.raceId)) {
    return { label: "Selected race", description: selectedRace.raceName };
  }

  const selectedTournamentName = normalizeName(selectedRace.tournamentName);
  if (
    selectedTournamentName !== "" &&
    predictions.every((prediction) => normalizeName(prediction.championshipName) === selectedTournamentName)
  ) {
    return { label: "Same championship", description: selectedRace.tournamentName ?? "Related predictions" };
  }

  return { label: "Recent predictions", description: "Showing recent predictions" };
}

function compactRaceTitle(prediction: UserPrediction, selectedRace: OpenRacePrediction | null): string {
  const raceName = prediction.raceName || selectedRace?.raceName || "Race";
  const roundTime = prediction.roundCode || prediction.roundName || "";
  return roundTime ? `${raceName} - ${roundTime}` : raceName;
}

function ordinal(value: number | undefined): string {
  if (!value) return "selected position";
  const suffix = value === 1 ? "st" : value === 2 ? "nd" : value === 3 ? "rd" : "th";
  return `${value}${suffix}`;
}

function marketLabel(prediction: UserPrediction): string {
  if (prediction.predictionType === "HEAD_TO_HEAD") return "Head-to-Head";
  if (prediction.predictionType === "EXACT_POSITION") return "Exact Position";
  if (prediction.predictionType === "WINNER") return "Winner";
  return "Prediction";
}

function selectionTitle(prediction: UserPrediction): string {
  const runner = prediction.predictedWinnerName || `Runner ${prediction.predictedWinnerId}`;
  if (prediction.predictionType === "EXACT_POSITION") {
    return `${runner} to finish ${ordinal(prediction.predictedPosition)}`;
  }
  if (prediction.predictionType === "HEAD_TO_HEAD") {
    return `${runner} to win matchup`;
  }
  return `${runner} to win`;
}

function positionBadge(prediction: UserPrediction): string {
  if (prediction.predictionType === "EXACT_POSITION") {
    return prediction.predictedPosition ? `Pos ${prediction.predictedPosition}` : "Exact";
  }
  if (prediction.predictionType === "HEAD_TO_HEAD") return "H2H";
  return "Win";
}

function ticketSummary(group: PositionGroup): string {
  if (group.ticketCount === 1) return `Ticket #${group.sample.id}`;
  return `${group.ticketCount} tickets`;
}

function positionKey(prediction: UserPrediction): string {
  return [
    prediction.raceId,
    prediction.predictionType,
    prediction.predictedWinnerId,
    prediction.predictedPosition ?? "any",
  ].join(":");
}

function stakeOf(prediction: UserPrediction): number {
  return prediction.wagerAmount ?? prediction.entryCostPoints ?? 0;
}

function getLiveOdds(prediction: UserPrediction, options?: PredictionOptions | null): number | null {
  if (!options || options.raceId !== prediction.raceId) return null;

  if (prediction.predictionType === "EXACT_POSITION" && prediction.predictedPosition != null) {
    const odds = options.positionOddsMatrix?.[prediction.predictedWinnerId]?.[prediction.predictedPosition];
    return typeof odds === "number" && Number.isFinite(odds) && odds > 0 ? odds : null;
  }

  if (prediction.predictionType === "HEAD_TO_HEAD") {
    const matchup = options.h2hMatchups?.find(
      (m) => m.participantAId === prediction.predictedWinnerId || m.participantBId === prediction.predictedWinnerId,
    );
    if (!matchup) return null;
    const odds = matchup.participantAId === prediction.predictedWinnerId ? matchup.oddsA : matchup.oddsB;
    return typeof odds === "number" && Number.isFinite(odds) && odds > 0 ? odds : null;
  }

  const runner = options.options.find((opt) => opt.raceParticipantId === prediction.predictedWinnerId);
  const odds = runner?.winOdds ?? options.positionOddsMatrix?.[prediction.predictedWinnerId]?.[1];
  return typeof odds === "number" && Number.isFinite(odds) && odds > 0 ? odds : null;
}

function getWeightedLockedOdds(predictions: UserPrediction[]): number | null {
  let weighted = 0;
  let totalStake = 0;

  for (const prediction of predictions) {
    if (typeof prediction.lockedOdds !== "number" || !Number.isFinite(prediction.lockedOdds) || prediction.lockedOdds <= 0) {
      continue;
    }
    const stake = stakeOf(prediction);
    weighted += stake * prediction.lockedOdds;
    totalStake += stake;
  }

  return totalStake > 0 ? weighted / totalStake : null;
}

function resolveOdds(predictions: UserPrediction[], options?: PredictionOptions | null): { odds: number | null; source: OddsSource } {
  const sample = predictions[0];
  const hasPending = predictions.some((prediction) => prediction.status === "PENDING");
  const liveOdds = hasPending ? getLiveOdds(sample, options) : null;
  if (liveOdds != null) {
    return { odds: liveOdds, source: "live" };
  }

  const lockedOdds = getWeightedLockedOdds(predictions);
  if (lockedOdds != null) {
    return {
      odds: lockedOdds,
      source: predictions.every((prediction) => settledStatuses.includes(prediction.status)) ? "settled" : "locked",
    };
  }

  return { odds: null, source: "none" };
}

function groupStatus(predictions: UserPrediction[]): { label: string; tone: PredictionStatus | "MIXED" } {
  const statuses = [...new Set(predictions.map((prediction) => prediction.status))];
  if (statuses.length === 1) {
    const status = statuses[0];
    return { label: predictionStatusLabel[status] || status, tone: status };
  }

  if (statuses.includes("PENDING")) return { label: "Mixed", tone: "MIXED" };
  if (statuses.includes("LOCKED")) return { label: "Mixed", tone: "MIXED" };
  return { label: "Settled", tone: "MIXED" };
}

function buildPositionGroups(
  predictions: UserPrediction[],
  selectedRace: OpenRacePrediction | null,
  options?: PredictionOptions | null,
): PositionGroup[] {
  const map = new Map<string, UserPrediction[]>();
  for (const prediction of predictions) {
    const key = positionKey(prediction);
    const group = map.get(key);
    if (group) {
      group.push(prediction);
    } else {
      map.set(key, [prediction]);
    }
  }

  return [...map.entries()]
    .map(([key, groupPredictions]) => {
      const sorted = [...groupPredictions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const sample = sorted[0];
      const totalStake = sorted.reduce((sum, prediction) => sum + stakeOf(prediction), 0);
      const status = groupStatus(sorted);
      const { odds, source } = resolveOdds(sorted, options);
      const payout = odds != null ? computePayout(totalStake, odds) : null;
      const settledReturn = sorted.every((prediction) => settledStatuses.includes(prediction.status))
        ? sorted.reduce((sum, prediction) => sum + (prediction.rewardPoints ?? 0), 0)
        : null;

      return {
        key,
        predictions: sorted,
        sample,
        raceTitle: compactRaceTitle(sample, selectedRace),
        selectionTitle: selectionTitle(sample),
        marketLabel: marketLabel(sample),
        totalStake,
        ticketCount: sorted.length,
        statusLabel: status.label,
        statusTone: status.tone,
        odds,
        oddsSource: source,
        projectedReturn: payout?.payout ?? null,
        projectedProfit: payout?.profit ?? null,
        settledReturn,
        latestCreatedAt: sample.createdAt,
      };
    })
    .sort((a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime());
}

function runnerChip(prediction: UserPrediction, options?: PredictionOptions | null) {
  const runner = options?.options?.find((option) => option.raceParticipantId === prediction.predictedWinnerId);
  const bib = runner ? formatBib(runner.startNumber, runner.laneNumber) : "-";
  const bibClass = runner ? getBibClass(bib) : "bg-turf-800 text-ivory";

  return (
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-[4px] font-data text-xs font-extrabold ${bibClass}`}>
      {bib}
    </span>
  );
}

function oddsSourceLabel(source: OddsSource): string {
  if (source === "live") return "Live estimate";
  if (source === "locked") return "Locked odds";
  if (source === "settled") return "Final odds";
  return "At lock";
}

function formatTicketTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatOdds(value: number): string {
  return value.toFixed(2);
}

function formatSignedVnd(value: number): string {
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}${formatVnd(Math.abs(value))}`;
}

export function MyPredictionsPanel({
  predictions,
  selectedRace,
  options,
  onViewAll,
}: MyPredictionsPanelProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const filteredPredictions = useMemo(() => filterSlipPredictions(predictions, selectedRace), [predictions, selectedRace]);
  const groups = useMemo(
    () => buildPositionGroups(filteredPredictions, selectedRace, options),
    [filteredPredictions, selectedRace, options],
  );
  const scope = getPredictionScope(filteredPredictions, selectedRace);
  const totalStake = filteredPredictions.reduce((sum, prediction) => sum + stakeOf(prediction), 0);
  const totalTickets = filteredPredictions.length;

  return (
    <section className="rounded-lg border border-turf-800 bg-turf-900 p-4" aria-labelledby="my-predictions-slip-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-data text-[10px] font-bold uppercase tracking-[0.16em] text-gold-300">
            {scope.label}
          </p>
          <h2 id="my-predictions-slip-title" className="mt-1 truncate text-[18px] font-extrabold text-ivory">
            My Predictions
          </h2>
          <p className="sr-only">{scope.description}</p>
        </div>
        <span className="inline-flex min-h-8 items-center rounded-full bg-[#111f34] px-3 font-data text-[11px] font-extrabold text-ivory-dim">
          {totalTickets} tickets
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-turf-600 bg-turf-850 p-5 text-center">
          <ReceiptText className="mx-auto h-6 w-6 text-ivory-faint" />
          <p className="mt-2 text-[13px] font-semibold text-ivory-dim">Your positions will appear here.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {groups.map((group) => {
            const expanded = expandedKey === group.key;
            const returnLabel = group.settledReturn != null ? "Settled return" : oddsSourceLabel(group.oddsSource);
            const returnAmount = group.settledReturn ?? group.projectedReturn;
            const profitAmount = returnAmount != null ? returnAmount - group.totalStake : group.projectedProfit;

            return (
              <article key={group.key} className="overflow-hidden rounded-lg border border-turf-800 bg-turf-850 shadow-[0_12px_34px_-28px_rgba(0,0,0,0.9)]">
                <button
                  type="button"
                  onClick={() => setExpandedKey(expanded ? null : group.key)}
                  className="w-full px-3 py-3 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-300"
                  aria-expanded={expanded}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      {runnerChip(group.sample, options)}
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-gold-400 px-1.5 py-0.5 font-data text-[9px] font-black uppercase tracking-[0.12em] text-turf-950">
                            {positionBadge(group.sample)}
                          </span>
                          <p className="min-w-0 flex-1 text-[13px] font-extrabold leading-snug text-ivory">{group.selectionTitle}</p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-ivory-faint">{group.raceTitle}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 text-ivory-faint transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border border-turf-700 bg-turf-900 px-2 py-0.5 font-data text-[10px] font-bold uppercase tracking-[0.12em] text-ivory-dim">
                      {ticketSummary(group)}
                    </span>
                    <span className="rounded-md border border-turf-700 bg-turf-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-300">
                      {group.marketLabel}
                    </span>
                    <span className={`rounded-md border px-2 py-0.5 font-data text-[10px] uppercase tracking-[0.12em] ${getStatusBadge(group.statusTone)}`}>
                      {group.statusLabel}
                    </span>
                  </div>
                </button>

                {expanded ? (
                  <div className="border-t border-turf-800 bg-turf-900/65 p-3">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-md border border-turf-800 bg-turf-900/60 px-2.5 py-2">
                      <p className="font-semibold text-ivory-faint">Stake</p>
                      <p className="mt-0.5 font-data text-[13px] font-bold leading-snug text-ivory">
                        {formatVnd(group.totalStake)} VND
                      </p>
                    </div>
                    <div className="rounded-md border border-turf-800 bg-turf-900/60 px-2.5 py-2">
                      <p className="font-semibold text-ivory-faint">{group.oddsSource === "live" ? "Live odds" : "Odds"}</p>
                      <p className="mt-0.5 font-data text-[13px] font-bold leading-snug text-gold-300">
                        {group.odds != null ? formatOdds(group.odds) : "At lock"}
                      </p>
                    </div>
                    {returnAmount != null ? (
                      <div className="rounded-md border border-emerald-glow/25 bg-emerald-glow/[0.07] px-2.5 py-2">
                        <p className="font-semibold text-ivory-faint">{returnLabel}</p>
                        <p className="mt-0.5 font-data text-[13px] font-bold leading-snug text-emerald-soft">
                          {formatVnd(returnAmount)} VND
                        </p>
                      </div>
                    ) : null}
                    {profitAmount != null ? (
                      <div className="rounded-md border border-turf-800 bg-turf-900/60 px-2.5 py-2">
                        <p className="font-semibold text-ivory-faint">Profit</p>
                        <p className={`mt-0.5 font-data text-[13px] font-bold leading-snug ${profitAmount >= 0 ? "text-emerald-soft" : "text-rose-300"}`}>
                          {formatSignedVnd(profitAmount)} VND
                        </p>
                      </div>
                    ) : null}
                  </div>

                    <p className="mt-2 rounded-lg border border-turf-800 bg-turf-850 px-3 py-2 text-[10.5px] font-semibold leading-relaxed text-ivory-faint">
                      {returnAmount != null
                        ? "Estimate can move until betting locks. Your stake stays fixed."
                        : "Return is calculated when odds are available at lock."}
                    </p>

                    <div className="mt-3">
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ivory-faint">
                      <WalletCards className="h-3.5 w-3.5" />
                      Ticket breakdown
                    </div>
                    <div className="space-y-1.5">
                      {group.predictions.map((prediction) => (
                        <div
                          key={prediction.id}
                          className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-turf-800 bg-turf-850 px-2.5 py-2 text-[11px]"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-data font-bold text-ivory">Ticket #{prediction.id}</p>
                            <p className="mt-0.5 truncate font-semibold text-ivory-faint">
                              {selectionTitle(prediction)} - {formatTicketTime(prediction.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-data font-bold text-ivory">{formatVnd(stakeOf(prediction))} VND</p>
                            <p className="mt-0.5 font-semibold text-ivory-faint">
                              {prediction.lockedOdds != null ? prediction.lockedOdds.toFixed(2) : oddsSourceLabel(group.oddsSource)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-3 rounded-lg border border-turf-800 bg-turf-850 p-3">
        <div className="flex justify-between gap-3 text-[13px] font-semibold text-ivory-dim">
          <span>Total stake</span>
          <span className="font-data font-extrabold text-gold-300">{formatVnd(totalStake)} VND</span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-gold-400 px-3 text-[12px] font-extrabold text-turf-900 transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900"
        >
          View All Predictions
        </button>
      </div>
    </section>
  );
}
