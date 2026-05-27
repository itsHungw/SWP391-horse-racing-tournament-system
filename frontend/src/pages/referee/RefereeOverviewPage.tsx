import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedRaces, RaceSummary } from "../../api/refereeApi";

export function RefereeOverviewPage() {
  const [races, setRaces] = useState<RaceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssignedRaces()
      .then(setRaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-500 font-medium">Loading assigned races...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">Assigned Races</h2>
          <p className="text-xs text-slate-500 mt-1">Track and manage the races you are scheduled to officiate.</p>
        </div>
        <span className="bg-[#004d3d]/5 text-[#004d3d] border border-[#004d3d]/15 px-3 py-1 rounded-full text-xs font-semibold">
          2026 Season
        </span>
      </div>

      {races.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500">
          No races currently assigned to you.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {races.map((race) => (
            <div
              key={race.id}
              className="bg-white border border-slate-200 rounded-lg p-5 flex justify-between items-center shadow-sm hover:border-[#004d3d]/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 border border-emerald-200 rounded text-uppercase">
                    {race.status}
                  </span>
                  <strong className="text-slate-900 text-base font-semibold">{race.name}</strong>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex gap-4">
                  <span>
                    Code: <strong className="text-slate-700 font-mono">{race.code}</strong>
                  </span>
                  <span>
                    Distance: <strong>{race.distanceMeters}m</strong>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/referee/races/${race.id}/check`}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 border border-slate-300 rounded text-xs transition-colors"
                >
                  Verify Pre-check
                </Link>
                <Link
                  to={`/referee/races/${race.id}/results`}
                  className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded text-xs transition-colors"
                >
                  Submit Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
