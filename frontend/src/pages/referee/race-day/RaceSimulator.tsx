import { LiveRaceState } from "./refereeRaceDayModels";

function formatElapsed(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const fraction = milliseconds % 1_000;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}`;
}

export function RaceSimulator({ state }: { state: LiveRaceState }) {
  const leaderProgress = Math.max(0, ...state.runners.map((runner) => runner.progressPercent));

  return (
    <section aria-label="Live race monitor" className="overflow-hidden rounded-2xl border border-[#052e2b] bg-[#073f36] text-white shadow-lg">
      <div className="flex flex-col gap-3 border-b border-emerald-800 bg-[#052e2b] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Live Monitor</p>
          <h3 className="mt-1 text-lg font-black">Track Telemetry Simulator</h3>
        </div>
        <p className="font-mono text-3xl font-black tabular-nums text-emerald-300">{formatElapsed(state.elapsedMilliseconds)}</p>
      </div>

      <div className="relative p-5">
        <div aria-hidden="true" className="absolute inset-y-5 right-8 border-r-2 border-dashed border-white/50" />
        <div className="space-y-3">
          {state.runners.map((runner) => (
            <div className="relative h-10 rounded-md border-y border-dashed border-emerald-200/20 bg-emerald-950/30" key={runner.participantId}>
              <span
                className="absolute top-1/2 flex min-w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-amber-400 px-2 py-1 text-[10px] font-black text-slate-950 shadow-md transition-[left] duration-500"
                style={{ left: `calc(${Math.min(96, runner.progressPercent)}% - 1rem)` }}
              >
                #{runner.participantId}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-xs font-bold text-emerald-100/80">
          <span>{state.mode.replace("_", " ")}</span>
          <span>{leaderProgress.toFixed(1)}% leader progress</span>
        </div>
      </div>
    </section>
  );
}
