import { ShieldAlert, FileText, Calendar, MapPin, Award, Clock, UserCheck } from "lucide-react";

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
    <section className="max-w-[1486px] space-y-6" aria-labelledby="result-history-title">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">Result packages</p>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl" id="result-history-title">
          Confirmed race results
        </h2>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Review confirmed finish orders, incidents, and penalties after a referee result package has been accepted.
        </p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Read-only archive</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Race result packages</h3>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-700">
            {publishedRaceResults.length} published
          </span>
        </div>

        {/* Responsive Card Feed - No horizontal scrollbar */}
        <section
          role="region"
          aria-label="published race results"
          className="space-y-4 p-4 sm:p-5 bg-slate-50/50"
        >
          {publishedRaceResults.map((result) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
              key={result.id}
            >
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-2">
                  <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-green-800">
                    {result.status}
                  </span>
                  <h4 className="text-xl font-black text-slate-950 leading-tight">{result.raceName}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {result.raceDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {result.venue}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-left sm:text-right min-w-[120px]">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1 sm:justify-end">
                    <Clock className="h-3 w-3" />
                    Final Time
                  </span>
                  <p className="mt-1 text-lg font-black text-emerald-950 font-mono leading-none">
                    {result.finalTime}
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-[#006f5f]" />
                    Winner
                  </span>
                  <p className="mt-2 text-sm font-black text-[#006f5f]">{result.winner}</p>
                </div>
                <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-slate-400" />
                    Top 3 Placement
                  </span>
                  <p className="mt-2 text-xs font-bold leading-relaxed text-slate-600">
                    {result.topThree.join(", ")}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-150 bg-slate-50/50 p-3.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-slate-450" />
                    Steward Sign-off
                  </span>
                  <p className="mt-2 text-xs font-black text-slate-800">{result.publishedAt}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">By {result.publishedBy}</p>
                </div>
              </div>

              {/* Logged incidents & penalties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    Incidents Logged
                  </span>
                  {result.incidents.length > 0 ? (
                    <ul className="space-y-1.5 text-xs font-semibold text-rose-950">
                      {result.incidents.map((incident) => (
                        <li key={incident} className="list-disc list-inside leading-relaxed">
                          {incident}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400">Clean race recorded</p>
                  )}
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    Penalties Applied
                  </span>
                  {result.penalties.length > 0 ? (
                    <ul className="space-y-1.5 text-xs font-semibold text-amber-950">
                      {result.penalties.map((penalty) => (
                        <li key={penalty} className="list-disc list-inside leading-relaxed">
                          {penalty}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400">No penalties</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}
