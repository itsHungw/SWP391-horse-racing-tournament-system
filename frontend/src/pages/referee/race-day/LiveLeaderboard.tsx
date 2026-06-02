import { useState } from "react";
import { LiveRaceState, PenaltyAction } from "./refereeRaceDayModels";

export function LiveLeaderboard({
  state,
  onPenalty,
}: {
  state: LiveRaceState;
  onPenalty: (participantId: number, action: PenaltyAction) => void;
}) {
  const [selectedId, setSelectedId] = useState<number>();
  const runners = [...state.runners].sort((left, right) => right.progressPercent - left.progressPercent);

  return (
    <section aria-label="Live leaderboard" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="border-b border-slate-100 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Physical track order</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Live Leaderboard</h3>
      </div>

      <div className="mt-3 space-y-2">
        {runners.map((runner, index) => (
          <div key={runner.participantId}>
            <button
              aria-label={`P${index + 1} ${runner.horseName}`}
              aria-pressed={selectedId === runner.participantId}
              className={`flex min-h-14 w-full items-center gap-3 rounded-lg border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] ${
                selectedId === runner.participantId ? "border-[#007a68] bg-[#eefbf7]" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
              onClick={() => setSelectedId(runner.participantId)}
              type="button"
            >
              <span className="w-8 font-mono text-sm font-black text-[#007a68]">P{index + 1}</span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm text-slate-950">{runner.horseName}</strong>
                <span className="text-[10px] font-bold text-slate-400">Gate {runner.gateNumber}</span>
              </span>
              <span className="text-xs font-black text-slate-500">{runner.progressPercent.toFixed(1)}%</span>
            </button>

            {selectedId === runner.participantId ? (
              <div className="mt-2 flex flex-wrap gap-2 rounded-lg bg-slate-50 p-2">
                <button aria-label={`Warn ${runner.horseName}`} className="min-h-11 rounded-md border border-amber-300 bg-amber-50 px-3 text-xs font-black text-amber-800" onClick={() => onPenalty(runner.participantId, "WARNING")} type="button">
                  Warning
                </button>
                <button aria-label={`Add five-second penalty to ${runner.horseName}`} className="min-h-11 rounded-md border border-orange-300 bg-orange-50 px-3 text-xs font-black text-orange-800" onClick={() => onPenalty(runner.participantId, "PENALTY_5S")} type="button">
                  +5s
                </button>
                <button aria-label={`Disqualify ${runner.horseName}`} className="min-h-11 rounded-md border border-rose-300 bg-rose-50 px-3 text-xs font-black text-rose-800" onClick={() => onPenalty(runner.participantId, "DSQ")} type="button">
                  DSQ
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-rose-700">Out of Race</h4>
        {state.outOfRace.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">No runners removed from active competition.</p>
        ) : (
          state.outOfRace.map((runner) => (
            <p className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700" key={runner.participantId}>
              DSQ - {runner.horseName} at {runner.progressPercent.toFixed(1)}%
            </p>
          ))
        )}
      </div>
    </section>
  );
}
