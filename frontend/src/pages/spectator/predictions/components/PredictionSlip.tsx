import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { Countdown } from "../../../../components/client/Countdown";
import type { OpenRacePrediction, PredictionOptions, PredictionType, UserPrediction } from "../types/prediction.types";
import {
  derivePredictionValidation,
  formatRunnerName,
  getEntryCost,
  getRewardLabel,
  getBibClass,
  type Picks,
} from "../predictionCockpitUtils";
import { MyPredictionsPanel } from "./MyPredictionsPanel";

interface PredictionSlipProps {
  race: OpenRacePrediction | null;
  options: PredictionOptions | null;
  predType: PredictionType;
  picks: Picks;
  wagerAmount: number;
  pointBalance: number;
  isUpdate: boolean;
  myPredictions: UserPrediction[];
  onClear: () => void;
  onConfirm: () => Promise<void>;
  onEditPrediction: (prediction: UserPrediction) => void;
  onViewAll: () => void;
}

function selectionRows(
  options: PredictionOptions | null,
  predType: PredictionType,
  picks: Picks,
): Array<{ label: string; value: React.ReactNode }> {
  if (!options) {
    const rows: Array<{ label: string; value: React.ReactNode }> = [{ label: "First", value: "Waiting for race options" }];
    if (predType === "HEAD_TO_HEAD") {
      rows.push(
        { label: "Winner", value: "Waiting for race options" }
      );
    }
    return rows;
  }

  const renderRunner = (participantId: number | null) => {
    if (!participantId) return "-";
    const runner = options.options.find((opt) => opt.raceParticipantId === participantId);
    if (!runner) return "-";
    const bib = String(runner.startNumber ?? runner.laneNumber ?? "-");
    const bibClass = getBibClass(bib);
    return (
      <div className="flex items-center justify-end gap-2">
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[4px] font-data text-[10px] font-bold ${bibClass}`}>
          {bib}
        </span>
        <span className="truncate">{runner.horseName}</span>
      </div>
    );
  };

  if (predType === "EXACT_POSITION") {
    return [{ label: `Pos ${picks.predictedPosition ?? "?"}`, value: renderRunner(picks.winnerId) }];
  }

  const rows = [{ label: "First", value: renderRunner(picks.winnerId) }];

  if (predType === "HEAD_TO_HEAD") {
    return [{ label: "Matchup Pick", value: renderRunner(picks.winnerId) }];
  }

  return rows;
}

function validationDisplay(message: string): string {
  return message;
}

export function PredictionSlip({
  race,
  options,
  predType,
  picks,
  wagerAmount,
  pointBalance,
  isUpdate,
  myPredictions,
  onClear,
  onConfirm,
  onEditPrediction,
  onViewAll,
}: PredictionSlipProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(
    () => {
      if (!race) {
        return { canConfirm: false, message: "Select a race to continue." };
      }

      return derivePredictionValidation({
        predType,
        picks,
        options,
        pointBalance,
        isUpdate,
        wagerAmount,
      });
    },
    [isUpdate, options, picks, pointBalance, predType, race, wagerAmount],
  );

  const chargedPoints = isUpdate ? 0 : wagerAmount;
  const balanceAfter = pointBalance - chargedPoints;
  const rows = selectionRows(options, predType, picks);
  const canConfirm = validation.canConfirm && !submitting && success == null;
  const visibleValidation = validationDisplay(validation.message);

  useEffect(() => {
    setSuccess(null);
    setError(null);
  }, [
    race?.raceId,
    options?.raceId,
    options?.predictionOpen,
    predType,
    picks.winnerId,
    picks.secondId,
    picks.thirdId,
    isUpdate,
  ]);

  const handleConfirm = async () => {
    if (!validation.canConfirm || submitting || success) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await onConfirm();
      setSuccess(isUpdate ? "Your prediction is updated." : "Your prediction is confirmed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm your prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedOdds = () => {
    if (predType === "EXACT_POSITION" && picks.winnerId && picks.predictedPosition && options?.positionOddsMatrix) {
      const odds = options.positionOddsMatrix[picks.winnerId]?.[picks.predictedPosition];
      if (odds) return odds.toFixed(2);
    }
    if (predType === "HEAD_TO_HEAD" && picks.winnerId && options?.h2hMatchups) {
      const matchup = options.h2hMatchups.find(
        (m) => m.participantAId === picks.winnerId || m.participantBId === picks.winnerId
      );
      if (matchup) {
        return matchup.participantAId === picks.winnerId
          ? matchup.oddsA.toFixed(2)
          : matchup.oddsB.toFixed(2);
      }
    }
    return "Dynamic (Calculated on Lock)";
  };

  return (
    <aside className="space-y-3 xl:sticky xl:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 custom-scrollbar" aria-label="Prediction slip">
      <section className="rounded-lg border border-turf-800 bg-turf-900 p-4 shadow-[0_18px_70px_-38px_rgba(0,0,0,0.85)]">
        <h2 className="sr-only">Prediction Slip</h2>

        {race ? (
          <dl className="space-y-2 text-[12px] font-semibold text-ivory-dim">
            <div className="flex justify-between gap-3">
              <dt>Racecourse</dt>
              <dd className="truncate text-right text-ivory">{race.tournamentName || race.roundName || "-"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Weather</dt>
              <dd className="text-ivory">-</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Track Condition</dt>
              <dd className="text-ivory">-</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Community Picks</dt>
              <dd className="font-data text-ivory">{race.totalPredictions}</dd>
            </div>
          </dl>
        ) : null}

        {race ? (
          <div className="mt-3 rounded-lg border border-gold-600/30 bg-gold-400/5 p-3">
            <p className="font-data text-[10px] uppercase tracking-[0.14em] text-gold-300">Prediction Lock Countdown</p>
            <Countdown target={race.raceAt} doneLabel="Locked" className="mt-2" />
          </div>
        ) : null}

        <div className="mt-3 rounded-lg border border-turf-800 bg-turf-850 p-3">
          <p className="text-[12px] font-semibold text-ivory-dim">Current Selection</p>
          <dl className="mt-2 space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3 text-[12px]">
                <dt className="font-data uppercase tracking-[0.12em] text-gold-300">{row.label}</dt>
                <dd className="min-w-0 truncate text-right font-bold text-ivory">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-3 space-y-2 rounded-lg border border-turf-800 bg-turf-850 p-3 text-[12px] font-semibold text-ivory-dim">
          <div className="flex justify-between gap-3">
            <span>Wager Amount</span>
            <span className="font-data text-ivory">
              {(wagerAmount ?? 0).toLocaleString("en-US")} VND
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Estimated Odds</span>
            <span className="min-w-0 truncate text-right font-data text-gold-300">
              {getSelectedOdds()}
            </span>
          </div>
          <div className="flex justify-between gap-3 border-t border-turf-800 pt-2">
            <span>Balance</span>
            <span className="font-data text-ivory">{(pointBalance ?? 0).toLocaleString("en-US")} VND</span>
          </div>
          <div className="flex justify-between gap-3 text-emerald-soft">
            <span>Balance After</span>
            <span className="font-data">{(balanceAfter ?? 0).toLocaleString("en-US")} VND</span>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-turf-800 bg-white/[0.03] p-2.5 text-[12px] font-semibold text-ivory-dim">
          {visibleValidation}
        </div>

        {success ? (
          <div
            role="status"
            className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-glow/40 bg-emerald-glow/10 p-2.5 text-[12px] font-semibold text-emerald-soft"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span aria-hidden="true">{isUpdate ? "Prediction updated." : "Prediction confirmed."}</span>
            <span className="sr-only">{success}</span>
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-nyraRed/40 bg-rose-500/10 p-2.5 text-[12px] font-semibold text-rose-300"
          >
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-[42px_1fr] gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-turf-600 text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Clear selections"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Confirm Prediction"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-gold-400 px-4 text-[12px] font-extrabold text-turf-900 shadow-[0_16px_34px_-18px_rgba(212,175,55,0.9)] transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-turf-900 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint disabled:shadow-none"
          >
            {submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
            {submitting ? "Processing" : isUpdate ? "Confirm Update" : "Confirm Prediction"}
          </button>
        </div>
      </section>

      <MyPredictionsPanel
        predictions={myPredictions}
        selectedRace={race}
        options={options}
        onEditPrediction={onEditPrediction}
        onViewAll={onViewAll}
      />
    </aside>
  );
}
