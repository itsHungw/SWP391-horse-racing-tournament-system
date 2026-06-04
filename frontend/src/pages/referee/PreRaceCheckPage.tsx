import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRaceParticipants, savePreRaceChecks, ParticipantVerification } from "../../api/refereeApi";

export function PreRaceCheckPage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const [participants, setParticipants] = useState<ParticipantVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getRaceParticipants(raceId)
      .then(setParticipants)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [raceId]);

  const handleCheckboxChange = (index: number, field: "gearOk" | "healthOk") => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: !updated[index][field] };
    setParticipants(updated);
  };

  const handleStatusChange = (index: number, status: "PASSED" | "FAILED" | "PENDING") => {
    const updated = [...participants];
    updated[index] = { ...updated[index], status };
    setParticipants(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      await savePreRaceChecks(raceId, participants);
      setMessage("Pre-race checks saved successfully!");
    } catch {
      setMessage("Failed to save verification checks.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-500 font-medium">Loading verification data...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">Pre-Race Check-in Verification</h2>
          <p className="text-xs text-slate-500 mt-1">Inspect and approve health, weight, and gear conditions.</p>
        </div>
        <Link to="/referee" className="text-xs text-slate-500 hover:text-slate-800 underline">
          Back to Races
        </Link>
      </div>

      {message && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold px-4 py-2.5 rounded text-xs">
          {message}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-6">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-200 text-slate-600 font-bold">
              <th className="p-4">Horse Registered Name</th>
              <th className="p-4">Assigned Jockey</th>
              <th className="p-4 text-center">Jockey Weight</th>
              <th className="p-4 text-center">Gear OK?</th>
              <th className="p-4 text-center">Health OK?</th>
              <th className="p-4 text-center">Verification Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => (
              <tr key={p.participantId} className="border-bottom border-slate-100 text-slate-700">
                <td className="p-4 font-bold text-slate-900">⚡ {p.horseName}</td>
                <td className="p-4 font-semibold text-[#004d3d]">{p.jockeyName}</td>
                <td className="p-4 text-center">{p.jockeyWeight} kg</td>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={p.gearOk}
                    onChange={() => handleCheckboxChange(idx, "gearOk")}
                    className="accent-[#004d3d]"
                  />
                </td>
                <td className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={p.healthOk}
                    onChange={() => handleCheckboxChange(idx, "healthOk")}
                    className="accent-[#004d3d]"
                  />
                </td>
                <td className="p-4 text-center">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(idx, e.target.value as any)}
                    className="bg-white border border-slate-300 rounded p-1 text-[11px] font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="PASSED">PASSED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-[#004d3d] hover:bg-[#003d30] text-white px-6 py-2.5 rounded text-xs font-bold transition-colors disabled:opacity-60"
      >
        {saving ? "Saving Checks..." : "💾 Save Pre-Checks"}
      </button>
    </div>
  );
}
