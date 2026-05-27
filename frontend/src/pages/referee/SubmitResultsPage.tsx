import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRaceResultEntries, submitRaceResults, ParticipantResultEntry } from "../../api/refereeApi";

export function SubmitResultsPage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const [entries, setEntries] = useState<ParticipantResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getRaceResultEntries(raceId)
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [raceId]);

  const handleNumberChange = (index: number, field: "position" | "finishTimeSeconds", value: string) => {
    const updated = [...entries];
    if (field === "finishTimeSeconds") {
      // Allow raw string value to let user type decimal point '.'
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        updated[index] = { ...updated[index], [field]: value as any };
        setEntries(updated);
      }
    } else {
      const parsed = value === "" ? "" : Number(value);
      updated[index] = { ...updated[index], [field]: parsed };
      setEntries(updated);
    }
  };

  const handleStatusChange = (index: number, status: ParticipantResultEntry["status"]) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], status };
    setEntries(updated);
  };

  const handleSave = async () => {
    // Validate ranks duplicates
    const positions = entries
      .map((e) => e.position)
      .filter((p): p is number => typeof p === "number");
    const hasDuplicates = new Set(positions).size !== positions.length;

    if (hasDuplicates) {
      setMessage("Duplicate finish positions are not allowed.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      
      // Safely map string/decimal elapsed times to numeric representation for the API
      const mappedEntries = entries.map((e) => ({
        ...e,
        finishTimeSeconds: e.finishTimeSeconds === "" ? "" : Number(e.finishTimeSeconds),
      }));

      await submitRaceResults(raceId, mappedEntries as any);
      setMessage("Results submitted successfully! Awaiting Admin review.");
    } catch {
      setMessage("Failed to submit official race results.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 font-medium">Loading result cards...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">Submit Final Results</h2>
          <p className="text-xs text-slate-500 mt-1">Record finishing order (ranks) and elapsed times.</p>
        </div>
        <Link to="/referee" className="text-xs text-slate-500 hover:text-slate-800 underline">
          Back to Races
        </Link>
      </div>

      {message && (
        <div className="mb-4 bg-slate-100 border border-slate-300 text-slate-800 font-semibold px-4 py-2.5 rounded text-xs">
          {message}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr] gap-3 text-xs font-bold border-b border-slate-100 pb-3 mb-4 text-slate-400 uppercase tracking-wider">
          <span>Horse & Jockey Entry</span>
          <span>Rank</span>
          <span>Elapsed Time</span>
          <span>Status</span>
        </div>

        <div className="flex flex-col gap-4">
          {entries.map((entry, idx) => (
            <div key={entry.participantId} className="grid grid-cols-[2fr_1fr_1.5fr_1fr] gap-3 items-center">
              <span className="font-semibold text-slate-800">⚡ {entry.horseName} — {entry.jockeyName}</span>
              <input
                type="number"
                placeholder="Rank"
                value={entry.position}
                onChange={(e) => handleNumberChange(idx, "position", e.target.value)}
                className="bg-white border border-slate-300 p-2 rounded text-xs text-slate-800 font-semibold w-20 focus:outline-none focus:border-[#004d3d]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 94.25"
                  value={entry.finishTimeSeconds}
                  onChange={(e) => handleNumberChange(idx, "finishTimeSeconds", e.target.value)}
                  className="bg-white border border-slate-300 p-2 rounded text-xs text-slate-800 font-semibold w-24 focus:outline-none focus:border-[#004d3d]"
                />
                <span className="text-xs text-slate-500 font-medium">seconds</span>
              </div>
              <select
                value={entry.status}
                onChange={(e) => handleStatusChange(idx, e.target.value as any)}
                className="bg-white border border-slate-300 p-2 rounded text-[11px] font-bold text-slate-800 focus:outline-none"
              >
                <option value="FINISHED">FINISHED</option>
                <option value="DISQUALIFIED">DISQUALIFIED</option>
                <option value="DID_NOT_FINISH">DID NOT FINISH</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={submitting}
        className="bg-amber-400 hover:bg-amber-500 text-slate-900 px-6 py-2.5 rounded text-xs font-bold transition-colors disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "🏁 Submit Official Results"}
      </button>
    </div>
  );
}
