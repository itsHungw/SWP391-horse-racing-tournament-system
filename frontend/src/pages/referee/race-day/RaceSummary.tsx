import { RaceSnapshot } from "./refereeRaceDayModels";

export function RaceSummary({ snapshot }: { snapshot: RaceSnapshot }) {
  const topThree = snapshot.leaderboard.slice(0, 3);

  return (
    <section aria-labelledby="draft-summary-title" className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Finished Draft</p>
      <h2 className="mt-2 text-3xl font-black text-slate-950" id="draft-summary-title">Race Summary</h2>
      <p className="mt-2 text-sm text-slate-600">Elapsed: {(snapshot.elapsedMilliseconds / 1_000).toFixed(3)}s</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Draft Top 3</h3>
          <ol className="mt-3 space-y-2">
            {topThree.map((runner, index) => (
              <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#fbfdfe] px-4 py-3" key={runner.participantId}>
                <span className="font-mono text-sm font-black text-[#007a68]">P{index + 1}</span>
                <strong className="text-sm text-slate-950">{runner.horseName}</strong>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Incident History</h3>
          <div className="mt-3 space-y-2">
            {snapshot.incidents.length === 0 ? (
              <p className="text-sm text-slate-500">No incidents recorded.</p>
            ) : (
              snapshot.incidents.map((entry) => <p className="text-sm text-slate-600" key={entry.id}>{entry.message}</p>)
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
