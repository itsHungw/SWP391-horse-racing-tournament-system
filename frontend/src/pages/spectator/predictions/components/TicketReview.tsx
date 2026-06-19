import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Stamp, Ticket } from "lucide-react";
import type { OpenRacePrediction, PredictionOptions, PredictionType } from "../types/prediction.types";
import type { Picks } from "../predictionCockpitUtils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function TicketReview({
  race,
  options,
  predType,
  picks,
  pointBalance,
  isUpdate,
  onConfirm,
  onBack,
  onDone,
}: {
  race: OpenRacePrediction;
  options: PredictionOptions;
  predType: PredictionType;
  picks: Picks;
  pointBalance: number;
  isUpdate: boolean;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = options.entryCost?.winner || 0;

  const nameOf = (id: number | null) => {
    if (id == null) return "—";
    const opt = options.options.find((o) => o.raceParticipantId === id);
    return opt ? `#${opt.startNumber ?? "—"} ${opt.horseName} (${opt.jockeyName})` : "—";
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      setSuccess(true);
      window.setTimeout(onDone, reduce ? 900 : 1700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while submitting the prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  const rows: Array<{ label: string; value: string }> = [
    { label: "Race", value: race.raceName },
    { label: "Type", value: predType === "WINNER" ? "Winner Pick" : predType === "HEAD_TO_HEAD" ? "Matchup Pick" : "Position Pick" },
    { label: "1st Pick", value: nameOf(picks.winnerId) },
  ];

  if (predType === "EXACT_POSITION") {
    rows.push({ label: "Position", value: picks.predictedPosition?.toString() || "?" });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-turf-900 p-6 md:p-7">
      <h2 className="eyebrow text-emerald-soft">Step 3 · Review your ticket</h2>

      <div className="relative mt-5 rounded-xl border border-gold-600/30 bg-turf-950 p-6">
        <div className="absolute inset-x-6 top-0 border-t-2 border-dashed border-gold-600/20" aria-hidden="true" />
        <p className="font-data text-[10px] uppercase tracking-[0.24em] text-gold-300">
          Night at the Races · Prediction Ticket
        </p>
        <ul className="mt-5 space-y-3.5 text-sm">
          {rows.map((row) => (
            <li key={row.label} className="flex items-baseline justify-between gap-6 border-b border-white/6 pb-3 last:border-0 last:pb-0">
              <span className="font-data shrink-0 text-[11px] uppercase tracking-[0.16em] text-ivory-faint">
                {row.label}
              </span>
              <span className="min-w-0 truncate text-right font-semibold text-ivory">{row.value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 space-y-2 border-t border-white/8 pt-4 text-xs font-semibold text-ivory-dim">
          <div className="flex justify-between">
            <span>Entry cost</span>
            <span className="font-data text-ivory">{isUpdate ? "0 (editing)" : `${cost} VND`}</span>
          </div>
          {!isUpdate && (
            <div className="flex justify-between text-emerald-soft">
              <span>Balance after</span>
              <span className="font-data">{pointBalance - cost} VND</span>
            </div>
          )}
        </div>

        {success && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.7, rotate: -18 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -12 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <span className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-emerald-glow/80 text-emerald-soft">
              <Stamp size={22} />
              <span className="font-data mt-1 text-[10px] uppercase tracking-[0.18em]">
                {isUpdate ? "Updated" : "Submitted"}
              </span>
            </span>
          </motion.div>
        )}
      </div>

      {success && (
        <p className="mt-4 text-center text-sm font-semibold text-emerald-soft" role="status">
          {isUpdate ? "Your prediction has been updated." : "Your ticket is in. Good luck at the wire!"}
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-nyraRed/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300" role="alert">
          {error}
        </div>
      )}

      {!success && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 text-[12px] font-bold uppercase tracking-[0.12em] text-ivory transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            <ArrowLeft size={14} />
            Change picks
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-lg bg-emerald-glow text-[12px] font-bold uppercase tracking-[0.12em] text-turf-950 shadow-[0_16px_40px_-16px_rgba(31,157,118,0.8)] transition-colors hover:bg-emerald-soft disabled:opacity-60"
          >
            {submitting ? "Processing…" : isUpdate ? "Confirm update" : "Confirm ticket"}
          </button>
        </div>
      )}
    </div>
  );
}
