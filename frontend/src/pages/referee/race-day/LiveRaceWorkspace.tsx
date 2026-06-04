import { LiveRaceState, PenaltyAction } from "./refereeRaceDayModels";
import { LiveIncidentLog } from "./LiveIncidentLog";
import { LiveLeaderboard } from "./LiveLeaderboard";
import { RaceSimulator } from "./RaceSimulator";

export function LiveRaceWorkspace({
  state,
  onFlag,
  onPenalty,
  onFinish,
}: {
  state: LiveRaceState;
  onFlag: (mode: LiveRaceState["mode"]) => void;
  onPenalty: (participantId: number, action: PenaltyAction) => void;
  onFinish: () => void;
}) {
  return (
    <section aria-label="Live race workspace" className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-600">Live race control room</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-black text-slate-950">Track Operations Monitor</h2>
          <span className="w-fit rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">{state.mode.replace("_", " ")}</span>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RaceSimulator state={state} />
        <LiveLeaderboard onPenalty={onPenalty} state={state} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_480px]">
        <LiveIncidentLog incidents={state.incidents} />
        <section aria-label="Race flag controls" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Race controls</p>
          <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
            {state.mode === "FINISHED_DRAFT" ? (
              <button
                className="min-h-16 w-full rounded-xl bg-emerald-600 px-5 text-base font-black text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f]"
                onClick={onFinish}
                type="button"
              >
                PROCEED TO POST-RACE
              </button>
            ) : state.mode === "RED_FLAGGED" ? (
              <>
                <button aria-label="START / RESUME" className="min-h-12 rounded-md bg-emerald-600 px-4 text-xs font-black text-white" onClick={() => onFlag(state.resumeMode ?? "RACING")} type="button">
                  START / RESUME
                </button>
                <button aria-label="STOP RACE" className="min-h-12 rounded-md bg-rose-700 px-4 text-xs font-black text-white" onClick={() => onFlag("ABORTED")} type="button">
                  STOP RACE
                </button>
              </>
            ) : (
              <>
                <button className="min-h-12 rounded-md bg-emerald-600 px-4 text-xs font-black text-white" onClick={() => onFlag("RACING")} type="button">START / RESUME</button>
                <button className="min-h-12 rounded-md bg-amber-500 px-4 text-xs font-black text-slate-950" onClick={() => onFlag("SAFETY_CAR")} type="button">TRACK HAZARD</button>
                <button className="min-h-12 rounded-md bg-rose-700 px-4 text-xs font-black text-white" onClick={() => onFlag("RED_FLAGGED")} type="button">STOP RACE</button>
              </>
            )}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            The simulator freezes automatically after every active runner records a finish time. DSQ runners are excluded from that finish check.
          </p>
        </section>
      </div>
    </section>
  );
}
