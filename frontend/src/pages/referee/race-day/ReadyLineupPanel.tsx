import { PreRaceParticipant } from "./refereeRaceDayModels";

export function ReadyLineupPanel({
  participants,
  onEnterLive,
}: {
  participants: PreRaceParticipant[];
  onEnterLive: () => void;
}) {
  const eligible = participants.filter((participant) => participant.status === "PASSED");
  const scratched = participants.filter((participant) => participant.status === "SCRATCHED");
  const hasUnresolvedScratch = participants.some(
    (participant) => participant.status === "SCRATCHED" && !participant.scratchedReason?.trim()
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Starting gate board</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Field cleared for live control</h3>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Confirm the gate lineup before opening live race operations. Scratched runners stay visible for the audit record.
          </p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-center">
          <div className="min-w-28 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Ready gates</p>
            <p className="mt-1 text-2xl font-black text-[#007a68]">{eligible.length}</p>
          </div>
          <div className="min-w-28 border-l border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Scratched</p>
            <p className="mt-1 text-2xl font-black text-rose-700">{scratched.length}</p>
          </div>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {participants.map((participant, index) => {
          const isReady = participant.status === "PASSED";
          const isScratched = participant.status === "SCRATCHED";

          return (
            <li
              className={[
                "relative min-h-36 overflow-hidden rounded-2xl border p-4",
                isReady ? "border-emerald-200 bg-emerald-50" : "",
                isScratched ? "border-rose-200 bg-rose-50" : "",
                !isReady && !isScratched ? "border-slate-200 bg-slate-50" : "",
              ].join(" ")}
              key={participant.participantId}
            >
              <div className="absolute inset-y-0 left-0 w-1.5 bg-[#007a68]" aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-lg bg-white px-3 py-2 font-mono text-sm font-black text-slate-950 shadow-sm">
                  G{index + 1}
                </span>
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
                    isReady ? "bg-emerald-600 text-white" : "",
                    isScratched ? "bg-rose-700 text-white" : "",
                    !isReady && !isScratched ? "bg-slate-200 text-slate-600" : "",
                  ].join(" ")}
                >
                  {isReady ? "Ready" : isScratched ? "Scratched" : "Checking"}
                </span>
              </div>
              <p className="mt-5 text-lg font-black leading-tight text-slate-950">{participant.horseName}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{participant.jockeyName}</p>
              {isScratched ? (
                <p className="mt-3 line-clamp-2 rounded-lg border border-rose-200 bg-white/70 px-3 py-2 text-xs font-bold leading-5 text-rose-700">
                  {participant.scratchedReason || "Scratch reason required"}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {participants.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
          No gate lineup is available for this race yet.
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {hasUnresolvedScratch ? (
          <p className="text-xs font-bold text-rose-700" role="alert">
            Add audit reasons for all scratched horses before opening Live Control.
          </p>
        ) : (
          <p className="text-xs font-bold text-slate-500">
            Gate board is ready when each runner is either cleared or scratched with a reason.
          </p>
        )}
        <button
          className="hidden min-h-12 rounded-md bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 lg:inline-flex lg:items-center lg:justify-center"
          disabled={eligible.length === 0 || hasUnresolvedScratch}
          onClick={onEnterLive}
          type="button"
        >
          Confirm & Enter Live Control
        </button>
      </div>
    </section>
  );
}
