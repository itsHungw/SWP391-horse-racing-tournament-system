import { RaceIncident } from "./refereeRaceDayModels";

function formatLogTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function logTone(type: RaceIncident["type"]) {
  if (type === "DSQ") return "bg-rose-600";
  if (type === "PENALTY") return "bg-orange-500";
  if (type === "WARNING") return "bg-amber-500";
  return "bg-[#007a68]";
}

export function LiveIncidentLog({ incidents }: { incidents: RaceIncident[] }) {
  return (
    <section aria-label="Official race log" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Official log</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Race decisions audit trail</h3>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
          {incidents.length} entries
        </span>
      </div>

      <div aria-live="polite" className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
        {incidents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-700">No official decisions recorded yet.</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Warnings, penalties, disqualifications, and race-state changes will appear here with timestamps.
            </p>
          </div>
        ) : (
          incidents.map((entry) => (
            <article className="grid grid-cols-[82px_minmax(0,1fr)] gap-3 rounded-xl border border-slate-100 bg-[#fbfdfe] p-3" key={entry.id}>
              <time className="font-mono text-[11px] font-black text-slate-500">{formatLogTime(entry.occurredAt)}</time>
              <div className="relative pl-4">
                <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${logTone(entry.type)}`} aria-hidden="true" />
                <p className="text-sm font-black leading-5 text-slate-800">{entry.message}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{entry.type.replace("_", " ")}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
