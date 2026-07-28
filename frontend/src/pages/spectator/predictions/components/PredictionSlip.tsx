import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, HelpCircle, LockKeyhole, RefreshCw, Trash2 } from "lucide-react";
import { Countdown } from "../../../../components/client/Countdown";
import type { OpenRacePrediction, PredictionOptions, PredictionQuote, PredictionType, UserPrediction } from "../types/prediction.types";
import {
  derivePredictionValidation,
  getBibClass,
  type Picks,
} from "../predictionCockpitUtils";
import { MyPredictionsPanel } from "./MyPredictionsPanel";
import { PayoutReceipt } from "./PayoutReceipt";
import { RulesDialog } from "./RulesDialog";
import { spectatorPredictionApi } from "../services/spectatorPredictionApi";

interface PredictionSlipProps {
  race: OpenRacePrediction | null;
  options: PredictionOptions | null;
  predType: PredictionType;
  picks: Picks;
  wagerAmount: number;
  pointBalance: number;
  myPredictions: UserPrediction[];
  onClear: () => void;
  onConfirm: () => Promise<void>;
  onViewAll: () => void;
  readOnly?: boolean;
  readOnlyReason?: string;
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
  myPredictions,
  onClear,
  onConfirm,
  onViewAll,
  readOnly = false,
  readOnlyReason,
}: PredictionSlipProps) {
  const [activeTab, setActiveTab] = useState<"BET" | "POSITIONS">("BET");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [quote, setQuote] = useState<PredictionQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const selectedRacePredictionCount = race
    ? myPredictions.filter((prediction) => prediction.raceId === race.raceId).length
    : myPredictions.length;

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
        isUpdate: false,
        wagerAmount,
      });
    },
    [options, picks, pointBalance, predType, race, wagerAmount],
  );

  const rows = selectionRows(options, predType, picks);
  const canConfirm = !readOnly && validation.canConfirm && !submitting && success == null;
  const visibleValidation = readOnly
    ? (readOnlyReason ?? "Predictions are currently unavailable.")
    : validationDisplay(validation.message);

  useEffect(() => {
    setSuccess(null);
    setError(null);
  }, [
    race?.raceId,
    options?.raceId,
    options?.predictionOpen,
    predType,
  ]);

  useEffect(() => {
    if (picks.winnerId == null) return;
    setSuccess(null);
    setError(null);
  }, [picks.winnerId, picks.predictedPosition]);

  useEffect(() => {
    if (
      readOnly ||
      !race ||
      !options?.predictionOpen ||
      !picks.winnerId ||
      wagerAmount < 10000 ||
      (predType === "EXACT_POSITION" && !picks.predictedPosition) ||
      predType === "WINNING_STREAK"
    ) {
      setQuote(null);
      setQuoteLoading(false);
      setQuoteError(null);
      return;
    }

    let cancelled = false;
    setQuote(null);
    setQuoteLoading(true);
    setQuoteError(null);
    const timer = window.setTimeout(async () => {
      try {
        const nextQuote = await spectatorPredictionApi.quotePrediction({
          raceId: race.raceId,
          predictionType: predType,
          predictedWinnerId: picks.winnerId!,
          predictedPosition: predType === "EXACT_POSITION" ? picks.predictedPosition : null,
          wagerAmount,
        });
        if (!cancelled) {
          setQuote(nextQuote);
        }
      } catch (err: any) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err?.response?.data?.message || "Unable to quote this stake.");
        }
      } finally {
        if (!cancelled) {
          setQuoteLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [options?.predictionOpen, picks.predictedPosition, picks.winnerId, predType, race, readOnly, wagerAmount]);

  const handleConfirm = async () => {
    if (readOnly || !validation.canConfirm || submitting || success) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await onConfirm();
      setSuccess("Your prediction is confirmed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm your prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setSuccess(null);
    setError(null);
    onClear();
  };

  const getSelectedOddsNum = (): number | null => {
    if (predType === "EXACT_POSITION" && picks.winnerId && picks.predictedPosition && options?.positionOddsMatrix) {
      const odds = options.positionOddsMatrix[picks.winnerId]?.[picks.predictedPosition];
      return typeof odds === "number" ? odds : null;
    }
    if (predType === "HEAD_TO_HEAD" && picks.winnerId && options?.h2hMatchups) {
      const matchup = options.h2hMatchups.find(
        (m) => m.participantAId === picks.winnerId || m.participantBId === picks.winnerId,
      );
      if (matchup) {
        return matchup.participantAId === picks.winnerId ? matchup.oddsA : matchup.oddsB;
      }
    }
    return null;
  };

  return (
    <aside className="min-w-0 space-y-3 xl:sticky xl:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 pr-1 custom-scrollbar" aria-label="Prediction slip">
      <section className="rounded-lg border border-turf-800 bg-turf-900 p-1.5">
        <div className="grid grid-cols-2 gap-1" role="tablist" aria-label="Prediction sidebar">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "BET"}
            onClick={() => setActiveTab("BET")}
            className={`min-h-10 rounded-md px-3 text-[12px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 ${
              activeTab === "BET"
                ? "bg-gold-400 text-turf-950"
                : "text-ivory-dim hover:bg-white/5 hover:text-ivory"
            }`}
          >
            Bet Slip
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "POSITIONS"}
            onClick={() => setActiveTab("POSITIONS")}
            className={`min-h-10 rounded-md px-3 text-[12px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 ${
              activeTab === "POSITIONS"
                ? "bg-gold-400 text-turf-950"
                : "text-ivory-dim hover:bg-white/5 hover:text-ivory"
            }`}
          >
            My Positions
            {selectedRacePredictionCount > 0 ? (
              <span className="ml-1.5 rounded-full bg-turf-800 px-1.5 py-0.5 font-data text-[10px] text-ivory">
                {selectedRacePredictionCount}
              </span>
            ) : null}
          </button>
        </div>
      </section>

      {activeTab === "POSITIONS" ? (
        <MyPredictionsPanel
          predictions={myPredictions}
          selectedRace={race}
          options={options}
          onViewAll={onViewAll}
        />
      ) : (
        <section className="rounded-lg border border-turf-800 bg-turf-900 p-4 shadow-[0_18px_70px_-38px_rgba(0,0,0,0.85)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-[15px] font-bold text-ivory">Bet Slip</h2>
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-turf-700 px-2.5 py-1.5 text-[11px] font-bold text-ivory-dim transition-colors hover:border-gold-500/50 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              How to play
            </button>
          </div>

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

          <div className="mt-3">
          <PayoutReceipt
            stake={wagerAmount}
            odds={getSelectedOddsNum()}
            balance={pointBalance}
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
            feePercent={options?.houseFeePercent}
            onOpenRules={() => setRulesOpen(true)}
          />
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
              <span aria-hidden="true">Prediction confirmed.</span>
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
              onClick={handleClear}
              disabled={readOnly || submitting}
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
              {readOnly ? <LockKeyhole className="h-4 w-4" aria-hidden="true" /> : null}
              {!readOnly && submitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
              {readOnly ? "Unavailable while suspended" : submitting ? "Processing" : "Confirm Prediction"}
            </button>
          </div>
        </section>
      )}

      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} feePercent={options?.houseFeePercent} />
    </aside>
  );
}
