import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getRaceParticipants,
  submitViolation,
  submitRefereeReport,
  ParticipantVerification,
} from "../../api/refereeApi";

export function IncidentReportsPage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const [participants, setParticipants] = useState<ParticipantVerification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Violation form state
  const [offenderId, setOffenderId] = useState<number | "">("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [violationDesc, setViolationDesc] = useState("");
  const [violationMsg, setViolationMsg] = useState<string | null>(null);

  // Report form state
  const [reportTitle, setReportTitle] = useState(`Race Report: R-2026-${raceId}`);
  const [reportSummary, setReportSummary] = useState("");
  const [reportMsg, setReportMsg] = useState<string | null>(null);

  useEffect(() => {
    getRaceParticipants(raceId)
      .then((data) => {
        setParticipants(data);
        if (data.length > 0) {
          setOffenderId(data[0].participantId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [raceId]);

  const handleViolationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offenderId) return;

    try {
      setViolationMsg(null);
      await submitViolation(raceId, {
        offenderId: Number(offenderId),
        severity,
        description: violationDesc,
      });
      setViolationMsg("Violation incident logged successfully!");
      setViolationDesc("");
    } catch {
      setViolationMsg("Failed to log rules violation.");
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setReportMsg(null);
      await submitRefereeReport(raceId, {
        title: reportTitle,
        summary: reportSummary,
      });
      setReportMsg("Referee report submitted successfully!");
    } catch {
      setReportMsg("Failed to submit referee report.");
    }
  };

  if (loading) {
    return <div className="text-slate-500 font-medium">Loading report components...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">Incident report</h2>
          <p className="text-xs text-slate-500 mt-1">Log rules violations or submit the race-day officiating report.</p>
        </div>
        <Link to={`/referee/races/${raceId}/officiate`} className="text-xs text-slate-500 hover:text-slate-800 underline">
          Back to race control
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Violation Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h4 className="text-red-600 font-bold text-sm mb-4 flex items-center gap-2">File new infraction</h4>
          {violationMsg && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-800 p-2.5 rounded text-xs font-semibold">
              {violationMsg}
            </div>
          )}
          <form onSubmit={handleViolationSubmit} className="flex flex-col gap-3 font-medium text-xs">
            <div>
              <label className="block mb-1 text-slate-500">Offender/Participant</label>
              <select
                value={offenderId}
                onChange={(e) => setOffenderId(Number(e.target.value))}
                className="bg-white border border-slate-300 p-2 rounded text-xs text-slate-800 font-semibold w-full focus:outline-none"
              >
                {participants.map((p) => (
                  <option key={p.participantId} value={p.participantId}>
                    {p.jockeyName} ({p.horseName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-500">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="bg-white border border-slate-300 p-2 rounded text-xs text-red-600 font-bold w-full focus:outline-none"
              >
                <option value="LOW">LOW SEVERITY</option>
                <option value="MEDIUM">MEDIUM SEVERITY</option>
                <option value="HIGH">HIGH SEVERITY</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-500">Infraction Description</label>
              <textarea
                rows={3}
                value={violationDesc}
                onChange={(e) => setViolationDesc(e.target.value)}
                placeholder="Provide accurate details..."
                className="bg-white border border-slate-300 p-2 rounded text-xs text-slate-800 font-semibold w-full resize-none focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded font-bold transition-colors cursor-pointer"
            >
              Submit Violation
            </button>
          </form>
        </div>

        {/* Referee Report Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <h4 className="text-[#004d3d] font-bold text-sm mb-4 flex items-center gap-2">Official referee report</h4>
          {reportMsg && (
            <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded text-xs font-semibold">
              {reportMsg}
            </div>
          )}
          <form onSubmit={handleReportSubmit} className="flex flex-col gap-3 font-medium text-xs">
            <div>
              <label className="block mb-1 text-slate-500">Report Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="bg-white border border-slate-300 p-2 rounded text-xs text-slate-800 font-bold w-full focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-500">Race Summary & Observations</label>
              <textarea
                rows={4}
                value={reportSummary}
                onChange={(e) => setReportSummary(e.target.value)}
                placeholder="Summarize overall race conditions..."
                className="bg-white border border-slate-300 p-2 rounded text-xs text-slate-800 font-semibold w-full resize-none focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-[#004d3d] hover:bg-[#003d30] text-white p-2.5 rounded font-bold transition-colors cursor-pointer"
            >
              Save Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
