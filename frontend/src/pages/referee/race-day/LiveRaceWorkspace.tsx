import { AssignedRace, LiveRaceState, PenaltyAction } from "./refereeRaceDayModels";
import { LiveIncidentLog } from "./LiveIncidentLog";
import { LiveLeaderboard } from "./LiveLeaderboard";
import { LiveRaceOrderPanel } from "./LiveRaceOrderPanel";

function formatElapsed(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1_000);
  const fraction = milliseconds % 1_000;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}`;
}

function formatRaceStart(value?: string) {
  if (!value) return "Schedule loaded";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LiveRaceWorkspace({
  race,
  state,
  onFlag,
  onPenalty,
  onRunnerFinish,
  onFinish,
}: {
  race?: AssignedRace;
  state: LiveRaceState;
  onFlag: (mode: LiveRaceState["mode"]) => void;
  onPenalty: (participantId: number, action: PenaltyAction) => void;
  onRunnerFinish: (participantId: number) => void;
  onFinish: () => void;
}) {
  const fieldSize = state.runners.length + state.outOfRace.length;

  return (
    <section aria-label="Live race workspace" className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-600">Live race control room</p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Race Operations Console</h2>
          <span className="w-fit rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
            {state.mode.replace("_", " ")}
          </span>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section
          aria-label="Official race clock"
          className="relative overflow-hidden rounded-2xl border border-[#063f36] bg-[#063f36] p-5 text-white shadow-[0_18px_50px_rgba(6,63,54,0.22)]"
        >
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute left-8 top-8 h-px w-[72%] bg-white" />
            <div className="absolute bottom-10 left-8 h-px w-[88%] bg-white" />
            <div className="absolute right-10 top-0 h-full w-px bg-white" />
          </div>
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-100">Official race clock</p>
              <h3 className="mt-3 font-mono text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
                {formatElapsed(state.elapsedMilliseconds)}
              </h3>
              <p className="mt-3 text-sm font-bold text-emerald-100">
                Field decisions are recorded against the official race log.
              </p>
            </div>
            <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/20 bg-white/10 text-center backdrop-blur">
              <div className="px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Mode</p>
                <p className="mt-1 text-sm font-black uppercase">{state.mode.replace("_", " ")}</p>
              </div>
              <div className="border-l border-white/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Field</p>
                <p className="mt-1 text-sm font-black">{fieldSize} gates</p>
              </div>
              <div className="border-l border-white/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-100">Removed</p>
                <p className="mt-1 text-sm font-black">{state.outOfRace.length}</p>
              </div>
            </div>
          </div>
        </section>

        <aside aria-label="Race brief" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Race brief</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{race?.name ?? "Live race"}</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Start</p>
              <p className="mt-1 text-sm font-black text-slate-950">{formatRaceStart(race?.scheduledAt)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Venue</p>
                <p className="mt-1 text-sm font-black text-slate-950">{race?.venue ?? "Race venue"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Distance</p>
                <p className="mt-1 text-sm font-black text-slate-950">{race?.distanceMeters ? `${race.distanceMeters}m` : "Official"}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Field</p>
              <p className="mt-1 text-sm font-black text-slate-950">
                {fieldSize} runners, {state.outOfRace.length} removed from finish order
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LiveLeaderboard onPenalty={onPenalty} onRunnerFinish={onRunnerFinish} state={state} />
        <div className="space-y-4">
          <LiveRaceOrderPanel state={state} />
          <LiveIncidentLog incidents={state.incidents} />
        </div>
      </div>

      <section aria-label="Race flag controls" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Race controls</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Field state</h3>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Use race-level controls for hazards or stoppage. Runner decisions stay on each gate card.
            </p>
          </div>
          <div className="grid gap-2 sm:flex sm:flex-wrap lg:justify-end">
            {state.mode === "FINISHED_DRAFT" ? (
              <button
                className="min-h-12 rounded-md bg-emerald-600 px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f]"
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
        </div>
      </section>
    </section>
  );
}
