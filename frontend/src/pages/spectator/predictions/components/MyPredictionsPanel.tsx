import { Link } from "react-router-dom";
import { Edit3 } from "lucide-react";
import {
  type OpenRacePrediction,
  predictionStatusLabel,
  type PredictionStatus,
  type UserPrediction,
  type PredictionOptions,
} from "../types/prediction.types";
import { filterSlipPredictions, formatBib, getBibClass } from "../predictionCockpitUtils";
import { PredictionResultCard } from "./PredictionResultCard";

interface MyPredictionsPanelProps {
  predictions: UserPrediction[];
  selectedRace: OpenRacePrediction | null;
  options?: PredictionOptions | null;
  onEditPrediction: (prediction: UserPrediction) => void;
}

const settledStatuses: PredictionStatus[] = [
  "CORRECT",
  "CORRECT_EXACT",
  "CORRECT_ANY_ORDER",
  "INCORRECT",
  "REFUNDED",
  "CANCELLED",
];


function getStatusBadge(status: PredictionStatus): string {
  switch (status) {
    case "PENDING":
      return "border-white/15 bg-white/5 text-ivory-dim";
    case "LOCKED":
      return "border-gold-600/40 bg-gold-400/10 text-gold-300";
    case "CORRECT":
    case "CORRECT_EXACT":
    case "CORRECT_ANY_ORDER":
      return "border-emerald-glow/40 bg-emerald-glow/10 text-emerald-soft";
    case "INCORRECT":
      return "border-white/10 bg-white/5 text-ivory-faint";
    case "REFUNDED":
    case "CANCELLED":
      return "border-gold-600/30 bg-gold-400/5 text-gold-200";
    default:
      return "border-white/15 bg-white/5 text-ivory-dim";
  }
}

function normalizeName(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function runnerBadges(prediction: UserPrediction): Array<{ id: number | undefined; name: string | undefined }> {
  const badges: Array<{ id: number | undefined; name: string | undefined }> = [
    { id: prediction.predictedWinnerId, name: prediction.predictedWinnerName },
  ];

  if (prediction.predictionType === "TOP3") {
    badges.push(
      { id: prediction.predictedSecondId, name: prediction.predictedSecondName },
      { id: prediction.predictedThirdId, name: prediction.predictedThirdName },
    );
  }

  return badges;
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

export function MyPredictionsPanel({
  predictions,
  selectedRace,
  options,
  onEditPrediction,
}: MyPredictionsPanelProps) {
  const filteredPredictions = filterSlipPredictions(predictions, selectedRace);
  const scope = getPredictionScope(filteredPredictions, selectedRace);
  const totalEntryPoints = filteredPredictions.reduce((sum, prediction) => sum + (prediction.wagerAmount ?? prediction.entryCostPoints), 0);

  return (
    <section className="rounded-lg border border-turf-800 bg-turf-900 p-4" aria-labelledby="my-predictions-slip-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="my-predictions-slip-title" className="text-[18px] font-extrabold text-ivory">
            My Predictions
          </h2>
          <p className="sr-only">
            {scope.label}: {scope.description}
          </p>
        </div>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#111f34] font-data text-xs font-extrabold text-ivory-dim">
          {filteredPredictions.length}
        </span>
      </div>

      {filteredPredictions.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-turf-600 bg-turf-850 p-4 text-center text-[13px] font-semibold text-ivory-dim">
          Your predictions will appear here.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {filteredPredictions.map((prediction) => {
            const isPending = prediction.status === "PENDING";
            const isSettled = settledStatuses.includes(prediction.status);

            return (
              <article key={prediction.id} className="rounded-lg border border-turf-700 bg-turf-850 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-extrabold text-gold-300">
                      {compactRaceTitle(prediction, selectedRace)}
                    </h3>
                    <p className="mt-2 text-[12px] font-semibold text-ivory-dim">
                      {prediction.predictionType === "WINNER" ? "WIN - Winner" : prediction.predictionType === "HEAD_TO_HEAD" ? "H2H - Matchup Pick" : "EXACT_POSITION"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 font-data text-[10px] uppercase tracking-[0.12em] ${getStatusBadge(
                      prediction.status,
                    )}`}
                  >
                    {predictionStatusLabel[prediction.status] || prediction.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {prediction.predictionType === "HEAD_TO_HEAD" ? (() => {
                      const runnerId = prediction.predictedWinnerId;
                      const runner = options?.options?.find(o => o.raceParticipantId === runnerId);
                      const bib = runner ? formatBib(runner.startNumber, runner.laneNumber) : "-";
                      const bibColorClass = runner ? getBibClass(bib) : "bg-turf-800 text-ivory";
                      
                      return (
                        <div>
                          <p className="text-ivory-dim text-[10px] uppercase font-bold tracking-wider mb-1">
                            Matchup Pick
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[4px] font-data text-xs font-extrabold shadow-sm ${bibColorClass}`}>
                              {bib}
                            </span>
                            <span className="font-semibold text-ivory text-sm">{prediction.predictedWinnerName || "—"}</span>
                          </div>
                        </div>
                      );
                    })() : (
                      runnerBadges(prediction).map((badge, index) => {
                        const label = badge.name || `Runner ${badge.id ?? "-"}`;
                        const runner = options?.options?.find(o => o.raceParticipantId === badge.id);
                        const bib = runner ? formatBib(runner.startNumber, runner.laneNumber) : "-";
                        const bibColorClass = runner ? getBibClass(bib) : "bg-turf-800 text-ivory";
                        
                        return (
                          <span key={`${prediction.id}-${index}`} className="inline-flex min-w-0 items-center gap-2">
                            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-[4px] font-data text-xs font-extrabold shadow-sm ${bibColorClass}`}>
                              {bib}
                            </span>
                            {index === 0 ? (
                              <span className="max-w-[118px] truncate text-[12px] font-bold text-ivory">{label}</span>
                            ) : null}
                          </span>
                        );
                      })
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="shrink-0 font-data text-[13px] font-extrabold text-ivory">
                      {prediction.wagerAmount ?? prediction.entryCostPoints} VND
                    </span>
                    {prediction.lockedOdds != null && (
                      <span className="mt-0.5 rounded bg-turf-800 px-1.5 py-0.5 text-[10px] font-bold text-emerald-soft">
                        Odds: {prediction.lockedOdds.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {isSettled ? (
                  <div className="mt-3">
                    <PredictionResultCard
                      status={prediction.status}
                      resultCategory={prediction.resultCategory}
                      rewardPoints={prediction.rewardPoints}
                      entryCost={prediction.entryCostPoints}
                      predictionType={prediction.predictionType}
                    />
                  </div>
                ) : null}

                {isPending ? (
                  <button
                    type="button"
                    onClick={() => onEditPrediction(prediction)}
                    aria-label={`Edit ${prediction.predictionType} prediction #${prediction.id} for ${
                      prediction.raceName || selectedRace?.raceName || "this race"
                    }`}
                    className="mt-3 inline-flex min-h-8 w-full items-center justify-center gap-2 rounded-md border border-turf-600 text-[11px] font-extrabold text-ivory-dim transition-colors hover:border-gold-400/60 hover:text-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-3 rounded-lg border border-turf-800 bg-turf-850 p-3">
        <div className="flex justify-between gap-3 text-[13px] font-semibold text-ivory-dim">
          <span>Total Wager</span>
          <span className="font-data font-extrabold text-gold-300">{totalEntryPoints} VND</span>
        </div>
        <Link
          to="/spectator/predictions"
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-gold-400 px-3 text-[12px] font-extrabold text-turf-900 transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900"
        >
          View All Predictions
        </Link>
      </div>
    </section>
  );
}
