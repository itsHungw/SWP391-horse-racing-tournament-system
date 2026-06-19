import { useState } from "react";
import { CheckCircle2, RefreshCw, Trash2, X, Plus, Minus } from "lucide-react";
import type { StreakPredictionLeg } from "../types/prediction.types";

interface StreakSlipProps {
  legs: StreakPredictionLeg[];
  wagerAmount: number;
  pointBalance: number;
  onClearAll: () => void;
  onRemoveLeg: (raceId: number) => void;
  onWagerChange: (amount: number) => void;
  onSubmit: () => Promise<void>;
}

export function StreakSlip({
  legs,
  wagerAmount,
  pointBalance,
  onClearAll,
  onRemoveLeg,
  onWagerChange,
  onSubmit,
}: StreakSlipProps) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalOdds = legs.reduce((acc, leg) => acc * leg.lockedOdds, 1);
  const displayOdds = legs.length > 0 ? Math.min(totalOdds, 1000).toFixed(2) : "0.00";
  const potentialWin = Math.floor(wagerAmount * parseFloat(displayOdds));

  let validationMessage = "";
  let canSubmit = true;

  if (legs.length < 2) {
    canSubmit = false;
    validationMessage = "Select at least 2 races to build a streak.";
  } else if (wagerAmount < 10000) {
    canSubmit = false;
    validationMessage = "Minimum wager is 10,000 VND.";
  } else if (wagerAmount > pointBalance) {
    canSubmit = false;
    validationMessage = "Insufficient balance.";
  }

  const handleConfirm = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await onSubmit();
      setSuccess("Winning streak prediction confirmed!");
      setTimeout(() => {
        onClearAll();
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to submit streak prediction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-turf-900 border-l border-turf-800 shadow-2xl">
      <div className="flex items-center justify-between border-b border-turf-800 bg-turf-850 p-4">
        <h2 className="font-display text-lg font-bold text-gold-400">Winning Streak Slip</h2>
        <button
          onClick={onClearAll}
          disabled={submitting || legs.length === 0}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-turf-400 hover:bg-turf-800 hover:text-turf-300 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {legs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-turf-400">Your slip is empty.</p>
            <p className="mt-1 text-xs text-turf-500">Pick horses across multiple races to build a streak.</p>
          </div>
        ) : (
          legs.map((leg, index) => (
            <div key={leg.raceId} className="relative rounded-lg border border-turf-800 bg-turf-850 p-3 shadow-inner">
              <button
                onClick={() => onRemoveLeg(leg.raceId)}
                className="absolute right-2 top-2 text-turf-500 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-wider text-turf-400">
                Leg {index + 1} &bull; {leg.raceName}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm font-extrabold text-ivory">{leg.horseName}</p>
                <p className="font-data text-sm font-bold text-gold-300">x{leg.lockedOdds.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-turf-800 bg-turf-850 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-turf-800 pb-3">
            <span className="text-sm font-semibold text-ivory-dim">Total Multiplier</span>
            <span className="font-data text-lg font-extrabold text-gold-400">x{displayOdds}</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ivory-dim">Wager Amount</label>
            <div className="flex items-center overflow-hidden rounded-lg border border-turf-700 bg-turf-900 p-1 transition-all focus-within:border-gold-400 focus-within:ring-1 focus-within:ring-gold-400">
              <button
                type="button"
                onClick={() => onWagerChange(Math.max(10000, wagerAmount - 10000))}
                className="grid h-8 w-8 place-items-center rounded-md bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min={10000}
                step={10000}
                value={wagerAmount}
                onChange={(e) => onWagerChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-transparent px-2 text-center font-data text-[15px] font-bold text-gold-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => onWagerChange(wagerAmount + 10000)}
                className="grid h-8 w-8 place-items-center rounded-md bg-turf-800 text-ivory-dim transition-colors hover:bg-turf-700 hover:text-ivory"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-turf-900/50 p-3">
            <span className="text-sm font-semibold text-ivory">To Win</span>
            <span className="font-data text-xl font-black text-green-400">{potentialWin.toLocaleString()} VND</span>
          </div>

          {!canSubmit && (
            <div className="rounded-md bg-turf-800/50 p-2 text-center text-xs font-semibold text-turf-400">
              {validationMessage}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center justify-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm font-semibold text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canSubmit || submitting || !!success}
            className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-turf-900 shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:opacity-50 disabled:grayscale"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              "Place Streak Bet"
            )}
            {!submitting && canSubmit && !success && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
