import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedRaces, RaceSummary } from "../../api/refereeApi";

interface RefereeOverviewPageProps {
  mode?: "all" | "check" | "results" | "reports";
}

export function RefereeOverviewPage({ mode = "all" }: RefereeOverviewPageProps) {
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

  // Define headers based on mode
  let title = "Assigned Races";
  let description = "Track and manage the races you are scheduled to officiate.";
  if (mode === "check") {
    title = "Pre-Race Checks";
    description = "Select an active or scheduled race to verify horse & jockey credentials.";
  } else if (mode === "results") {
    title = "Submit Results";
    description = "Record official timing and finish ranks for recently run races.";
  } else if (mode === "reports") {
    title = "Reports & Violations";
    description = "File incident logs or submit final officiating observations.";
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
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
                {(mode === "all" || mode === "check") && (
                  <Link
                    to={`/referee/races/${race.id}/check`}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 border border-slate-300 rounded text-xs transition-colors"
                  >
                    Verify Pre-check
                  </Link>
                )}
                {(mode === "all" || mode === "results") && (
                  <Link
                    to={`/referee/races/${race.id}/results`}
                    className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-4 py-2 rounded text-xs transition-colors"
                  >
                    Submit Results
                  </Link>
                )}
                {(mode === "all" || mode === "reports") && (
                  <Link
                    to={`/referee/races/${race.id}/report`}
                    className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-4 py-2 border border-red-200 rounded text-xs transition-colors"
                  >
                    Log Incident
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
