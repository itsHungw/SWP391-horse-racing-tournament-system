import { useState } from "react";
import { CheckCircle2, RefreshCw, Trash2, X, Plus, Minus, History } from "lucide-react";
import type { StreakPredictionLeg, StreakPredictionResponse } from "../types/prediction.types";

interface StreakSlipProps {
  legs: StreakPredictionLeg[];
  wagerAmount: number;
  pointBalance: number;
  myStreaks: StreakPredictionResponse[];
  onClearAll: () => void;
  onRemoveLeg: (raceId: number) => void;
  onWagerChange: (wager: number) => void;
  onSubmit: () => Promise<void>;
  onViewAllStreaks?: () => void;
}

export function StreakSlip({
  legs,
  wagerAmount,
  pointBalance,
  myStreaks,
  onClearAll,
  onRemoveLeg,
  onWagerChange,
  onSubmit,
  onViewAllStreaks,
}: StreakSlipProps) {
  const [activeTab, setActiveTab] = useState<"NEW" | "HISTORY">("NEW");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalOdds = legs.reduce((acc, leg) => acc + leg.lockedOdds, 0);
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
      <div className="flex flex-col border-b border-turf-800 bg-turf-850">
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="font-display text-lg font-bold text-gold-400">Winning Streak</h2>
          {activeTab === "NEW" && (
            <button
              onClick={onClearAll}
              disabled={submitting || legs.length === 0}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-turf-400 hover:bg-turf-800 hover:text-turf-300 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>
        <div className="flex gap-4 px-4">
          <button
            onClick={() => setActiveTab("NEW")}
            className={`border-b-2 py-2 text-sm font-semibold transition-colors ${activeTab === "NEW" ? "border-gold-400 text-gold-400" : "border-transparent text-turf-400 hover:text-ivory"}`}
          >
            New Bet
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-1.5 border-b-2 py-2 text-sm font-semibold transition-colors ${activeTab === "HISTORY" ? "border-gold-400 text-gold-400" : "border-transparent text-turf-400 hover:text-ivory"}`}
          >
            <History className="h-4 w-4" />
            My Streaks
            {myStreaks.length > 0 && (
              <span className="ml-1 rounded-full bg-turf-700 px-1.5 py-0.5 text-[10px] text-ivory">
                {myStreaks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "NEW" ? (
        <>
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

          <div className="mt-3 space-y-2 rounded-lg border border-turf-800 bg-turf-900/50 p-3 text-[12px] font-semibold text-ivory-dim">
            <div className="flex justify-between gap-3">
              <span>To Win</span>
              <span className="font-data text-lg font-black text-green-400">
                {potentialWin.toLocaleString()} VND
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-turf-800 pt-2">
              <span>Balance</span>
              <span className="font-data text-ivory">
                {(pointBalance ?? 0).toLocaleString()} VND
              </span>
            </div>
            <div className="flex justify-between gap-3 text-emerald-soft">
              <span>Balance After</span>
              <span className={`font-data ${pointBalance - wagerAmount < 0 ? 'text-red-400' : 'text-emerald-soft'}`}>
                {Math.max(0, pointBalance - wagerAmount).toLocaleString()} VND
              </span>
            </div>
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
            className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-turf-900 shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 disabled:opacity-50 disabled:grayscale disabled:shadow-none"
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
      </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-turf-950">
          {myStreaks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <History className="mb-2 h-8 w-8 text-turf-700" />
              <p className="text-sm font-semibold text-turf-400">No streak history.</p>
            </div>
            ) : (
            <>
              {(() => {
                const sortedStreaks = [...myStreaks].sort((a, b) => b.id - a.id);
                const displayStreaks = sortedStreaks.slice(0, 3);
                return (
                  <>
                    {displayStreaks.map(streak => (
                      <div key={streak.id} className="rounded-lg border border-turf-800 bg-turf-900 shadow-lg">
                        <div className="flex items-center justify-between border-b border-turf-800 bg-turf-850 px-3 py-2">
                          <span className="font-data text-xs font-bold text-turf-300">Ticket #{streak.id}</span>
                          <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            streak.status === 'WON' ? 'bg-green-500/20 text-green-400' :
                            streak.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                            'bg-gold-500/20 text-gold-400'
                          }`}>
                            {streak.status}
                          </span>
                        </div>
                        <div className="p-3 space-y-2">
                          {streak.legs.map((leg, idx) => (
                            <div key={leg.id} className="flex items-center justify-between text-sm">
                              <span className="text-[10px] uppercase font-bold text-ivory-dim">Leg {idx + 1}</span>
                              <span className="font-semibold text-ivory">{leg.predictedWinnerName}</span>
                              <span className="font-data text-gold-300">x{leg.lockedOdds.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-turf-800 bg-turf-850/50 px-3 py-2 text-sm">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-ivory-dim font-bold">Wager</span>
                            <span className="font-data font-semibold text-ivory">{streak.wagerAmount.toLocaleString()} VND</span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] uppercase text-ivory-dim font-bold">Total Odds</span>
                            <span className="font-data font-bold text-gold-400">x{streak.totalOdds.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sortedStreaks.length > 3 && onViewAllStreaks && (
                      <button
                        onClick={onViewAllStreaks}
                        className="mt-4 w-full rounded-md border border-turf-700 bg-turf-800 py-2.5 text-xs font-bold uppercase tracking-wider text-turf-300 transition-colors hover:bg-turf-700 hover:text-ivory"
                      >
                        View All Streaks ({sortedStreaks.length})
                      </button>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
