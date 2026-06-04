import { RaceIncident } from "./refereeRaceDayModels";

export function LiveIncidentLog({ incidents }: { incidents: RaceIncident[] }) {
  return (
    <section aria-label="Live incident log" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Steward audit trail</p>
      <h3 className="mt-1 text-lg font-black text-slate-950">Live Incident Log</h3>
      <div aria-live="polite" className="mt-3 max-h-52 space-y-2 overflow-y-auto">
        {incidents.length === 0 ? (
          <p className="text-sm text-slate-500">No incidents recorded.</p>
        ) : (
          incidents.map((entry) => (
            <article className="rounded-lg border border-slate-100 bg-[#fbfdfe] px-3 py-2" key={entry.id}>
              <p className="text-xs font-black text-slate-700">{entry.message}</p>
              <time className="mt-1 block text-[10px] font-bold text-slate-400">{new Date(entry.occurredAt).toLocaleTimeString()}</time>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
