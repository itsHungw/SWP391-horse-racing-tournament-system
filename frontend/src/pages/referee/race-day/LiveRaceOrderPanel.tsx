import { LiveRaceState } from "./refereeRaceDayModels";

function formatSeconds(milliseconds: number) {
  return `${(milliseconds / 1_000).toFixed(3)}s`;
}

function penaltyMillisecondsFor(state: LiveRaceState, participantId: number) {
  return state.incidents
    .filter((incident) => incident.participantId === participantId)
    .reduce((total, incident) => total + (incident.penaltySeconds ?? 0) * 1_000, 0);
}

export function LiveRaceOrderPanel({ state }: { state: LiveRaceState }) {
  const isOfficialResult = state.mode === "FINISHED_DRAFT";
  const rows = [...state.runners].sort((first, second) => {
    if (isOfficialResult) {
      const firstTotal = (first.finishMilliseconds ?? Number.POSITIVE_INFINITY) + penaltyMillisecondsFor(state, first.participantId);
      const secondTotal = (second.finishMilliseconds ?? Number.POSITIVE_INFINITY) + penaltyMillisecondsFor(state, second.participantId);
      return firstTotal - secondTotal;
    }

    const firstFinished = first.finishMilliseconds !== undefined;
    const secondFinished = second.finishMilliseconds !== undefined;
    if (firstFinished && secondFinished) {
      return (first.finishMilliseconds ?? 0) - (second.finishMilliseconds ?? 0);
    }
    if (firstFinished !== secondFinished) return firstFinished ? -1 : 1;
    return first.gateNumber - second.gateNumber;
  });

  return (
    <section aria-label={isOfficialResult ? "Official result order" : "Current field order"} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">
            {isOfficialResult ? "Official result" : "Current order"}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
            {isOfficialResult ? "Adjusted finish order" : "Field position board"}
          </h3>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
          {rows.length} runners
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-500">
            No active runners on the field board.
          </p>
        ) : (
          rows.map((runner, index) => {
            const penaltyMilliseconds = penaltyMillisecondsFor(state, runner.participantId);
            const hasFinish = runner.finishMilliseconds !== undefined;
            const finalMilliseconds = hasFinish ? (runner.finishMilliseconds ?? 0) + penaltyMilliseconds : undefined;

            return (
              <article
                className={[
                  "grid grid-cols-[42px_minmax(0,1fr)] gap-3 rounded-xl border p-3",
                  index === 0 ? "border-[#007a68] bg-[#eefbf7]" : "border-slate-200 bg-[#fbfdfe]",
                ].join(" ")}
                key={runner.participantId}
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-black",
                    index === 0 ? "bg-[#007a68] text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  P{index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm font-black text-slate-950">{runner.horseName}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                      G{runner.gateNumber}
                    </span>
                  </div>
                  {hasFinish ? (
                    <p className="mt-1 font-mono text-xs font-black text-slate-600">
                      {formatSeconds(finalMilliseconds ?? 0)}
                      {penaltyMilliseconds > 0 ? (
                        <span className="ml-2 text-orange-700">+{formatSeconds(penaltyMilliseconds)} penalty</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-bold text-slate-500">Running</p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {state.outOfRace.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Removed</p>
          <div className="mt-2 space-y-2">
            {state.outOfRace.map((runner) => (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700" key={runner.participantId}>
                G{runner.gateNumber} {runner.horseName} - {runner.status}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
