import { LiveRaceState, LiveRunner, PenaltyAction } from "./refereeRaceDayModels";

function formatSeconds(milliseconds: number) {
  return `${(milliseconds / 1_000).toFixed(3)}s`;
}

function runnerStatus(runner: LiveRunner) {
  if (runner.status === "DSQ") return "DSQ";
  if (runner.status === "DNF") return "DNF";
  if (runner.status === "DNS") return "DNS";
  if (runner.finishMilliseconds !== undefined) return "FINISHED";
  return "RUNNING";
}

function statusClasses(status: string) {
  if (status === "RUNNING") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "FINISHED") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function penaltyMillisecondsFor(state: LiveRaceState, participantId: number) {
  return state.incidents
    .filter((incident) => incident.participantId === participantId)
    .reduce((total, incident) => total + (incident.penaltySeconds ?? 0) * 1_000, 0);
}

export function LiveLeaderboard({
  state,
  onPenalty,
  onRunnerFinish,
}: {
  state: LiveRaceState;
  onPenalty: (participantId: number, action: PenaltyAction) => void;
  onRunnerFinish: (participantId: number) => void;
}) {
  const runners = [...state.runners].sort((left, right) => left.gateNumber - right.gateNumber);

  return (
    <section aria-label="Live field board" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Field board</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Gate decisions</h3>
        </div>
        <span className="w-fit rounded-full bg-[#eefbf7] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#006f5f]">
          {runners.length} field cards
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {runners.map((runner) => {
          const status = runnerStatus(runner);
          const isActionable = status === "RUNNING";
          const penaltyMilliseconds = penaltyMillisecondsFor(state, runner.participantId);
          const hasFinish = runner.finishMilliseconds !== undefined;
          const finalMilliseconds = hasFinish ? (runner.finishMilliseconds ?? 0) + penaltyMilliseconds : undefined;

          return (
            <article
              className={[
                "race-day-row-motion rounded-2xl border p-4 transition hover:border-[#007a68]/40 hover:shadow-sm",
                isActionable ? "border-slate-200 bg-[#fbfdfe]" : "border-slate-200 bg-slate-50",
              ].join(" ")}
              key={runner.participantId}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#062f28] font-mono text-sm font-black text-white">
                    G{runner.gateNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-base font-black text-slate-950">{runner.horseName}</h4>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${statusClasses(status)}`}>
                        {status}
                      </span>
                    </div>
                    {hasFinish ? (
                      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white text-center">
                        <div className="px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Raw</p>
                          <p className="mt-1 font-mono text-xs font-black text-slate-800">{formatSeconds(runner.finishMilliseconds ?? 0)}</p>
                        </div>
                        <div className="border-l border-slate-200 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Penalty</p>
                          <p className="mt-1 font-mono text-xs font-black text-orange-700">{formatSeconds(penaltyMilliseconds)}</p>
                        </div>
                        <div className="border-l border-slate-200 px-3 py-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Final</p>
                          <p className="mt-1 font-mono text-xs font-black text-slate-950">{formatSeconds(finalMilliseconds ?? 0)}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Running on official clock <span className="font-mono font-black text-slate-700">{formatSeconds(state.elapsedMilliseconds)}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    aria-label={`Finish ${runner.horseName}`}
                    className="min-h-12 w-full rounded-md bg-[#007a68] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#006f5f] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    disabled={!isActionable}
                    onClick={() => onRunnerFinish(runner.participantId)}
                    type="button"
                  >
                    Finish runner
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      aria-label={`Warn ${runner.horseName}`}
                      className="min-h-11 rounded-md border border-amber-300 bg-amber-50 px-2 text-xs font-black text-amber-800 transition hover:bg-amber-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={!isActionable}
                      onClick={() => onPenalty(runner.participantId, "WARNING")}
                      type="button"
                    >
                      Warning
                    </button>
                    <button
                      aria-label={`Add five-second penalty to ${runner.horseName}`}
                      className="min-h-11 rounded-md border border-orange-300 bg-orange-50 px-2 text-xs font-black text-orange-800 transition hover:bg-orange-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      onClick={() => onPenalty(runner.participantId, "PENALTY_5S")}
                      type="button"
                    >
                      +5s
                    </button>
                    <button
                      aria-label={`Disqualify ${runner.horseName}`}
                      className="min-h-11 rounded-md border border-rose-300 bg-rose-50 px-2 text-xs font-black text-rose-800 transition hover:bg-rose-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      onClick={() => onPenalty(runner.participantId, "DSQ")}
                      type="button"
                    >
                      DSQ
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-rose-700">Out of race</h4>
        {state.outOfRace.length === 0 ? (
          <p className="mt-2 text-xs font-semibold text-slate-400">No runners removed from active competition.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {state.outOfRace.map((runner) => (
              <article
                className="race-day-row-motion rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                key={runner.participantId}
              >
                <span className="font-mono font-black">G{runner.gateNumber}</span> {runner.horseName}
                <span className="mt-1 block font-mono text-[11px]">{runner.status}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
