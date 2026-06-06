type PublishedRaceResult = {
  id: number;
  raceName: string;
  raceDate: string;
  venue: string;
  topThree: string[];
  winner: string;
  finalTime: string;
  incidents: string[];
  penalties: string[];
  publishedAt: string;
  publishedBy: string;
  status: "PUBLISHED";
};

const publishedRaceResults: PublishedRaceResult[] = [
  {
    id: 501,
    raceName: "June Stakes - Heat 2",
    raceDate: "2026-06-02 14:00",
    venue: "Aqueduct Main Track",
    topThree: ["Golden Arrow", "Night Bloom", "River Comet"],
    winner: "Golden Arrow",
    finalTime: "62.344s",
    incidents: ["Track Hazard - Caution Period Enabled", "Track Cleared - Race Resumed"],
    penalties: ["Warning: Lane drift", "5s penalty: Early gate movement"],
    publishedAt: "2026-06-02 14:27",
    publishedBy: "Julian Sterling",
    status: "PUBLISHED",
  },
  {
    id: 498,
    raceName: "Spring Trial - Heat 4",
    raceDate: "2026-05-29 10:30",
    venue: "Belmont Training Loop",
    topThree: ["Silver Rail", "Copper Finch", "Harbor Wind"],
    winner: "Silver Rail",
    finalTime: "71.902s",
    incidents: ["Clean race recorded"],
    penalties: ["No penalties"],
    publishedAt: "2026-05-29 10:58",
    publishedBy: "Mara Chen",
    status: "PUBLISHED",
  },
];

export function RefereeResultHistoryPage() {
  return (
    <section className="max-w-[1486px]" aria-labelledby="result-history-title">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Result packages</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl" id="result-history-title">
          Confirmed race results
        </h2>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Review confirmed finish orders, incidents, and penalties after a referee result package has been accepted.
        </p>
      </header>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Read-only archive</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Race result packages</h3>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
            {publishedRaceResults.length} published
          </span>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {publishedRaceResults.map((result) => (
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={result.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    {result.status}
                  </span>
                  <h4 className="mt-3 text-lg font-black leading-tight text-slate-950">{result.raceName}</h4>
                  <p className="mt-1 text-xs font-bold text-slate-500">{result.raceDate}</p>
                </div>
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-xs font-black text-emerald-800">
                  {result.finalTime}
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Winner</p>
                  <p className="mt-1 text-sm font-black text-[#006f5f]">{result.winner}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{result.topThree.join(", ")}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Incidents</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{result.incidents.join(" | ")}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Published</p>
                  <p className="mt-1 text-xs font-black text-slate-900">{result.publishedAt}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">By {result.publishedBy}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table aria-label="Published race results" className="min-w-[1180px] w-full border-collapse text-left">
            <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4" scope="col">Race</th>
                <th className="px-5 py-4" scope="col">Top 3</th>
                <th className="px-5 py-4" scope="col">Final Time</th>
                <th className="px-5 py-4" scope="col">Incidents</th>
                <th className="px-5 py-4" scope="col">Penalties</th>
                <th className="px-5 py-4" scope="col">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {publishedRaceResults.map((result) => (
                <tr className="align-top transition-colors hover:bg-slate-50" key={result.id}>
                  <th className="px-5 py-5" scope="row">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                        {result.status}
                      </span>
                      <p className="text-base font-black text-slate-950">{result.raceName}</p>
                      <p className="text-xs font-bold text-slate-500">{result.raceDate}</p>
                      <p className="text-xs text-slate-500">{result.venue}</p>
                    </div>
                  </th>
                  <td className="px-5 py-5">
                    <p className="text-sm font-black text-[#006f5f]">Winner: {result.winner}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{result.topThree.join(", ")}</p>
                  </td>
                  <td className="px-5 py-5 font-mono text-sm font-black text-slate-950">{result.finalTime}</td>
                  <td className="px-5 py-5">
                    <ul className="space-y-1 text-sm leading-6 text-slate-600">
                      {result.incidents.map((incident) => (
                        <li key={incident}>{incident}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-5 py-5">
                    <ul className="space-y-1 text-sm leading-6 text-slate-600">
                      {result.penalties.map((penalty) => (
                        <li key={penalty}>{penalty}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-5 py-5">
                    <p className="text-sm font-black text-slate-900">{result.publishedAt}</p>
                    <p className="mt-1 text-xs text-slate-500">By {result.publishedBy}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
