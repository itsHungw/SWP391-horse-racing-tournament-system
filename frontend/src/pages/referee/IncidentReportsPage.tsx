import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getRaceParticipants, ParticipantVerification, submitViolation } from "../../api/refereeApi";

export function IncidentReportsPage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const [participants, setParticipants] = useState<ParticipantVerification[]>([]);
  const [loading, setLoading] = useState(true);

  const [offenderId, setOffenderId] = useState<number | "">("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [violationDesc, setViolationDesc] = useState("");
  const [violationMsg, setViolationMsg] = useState<string | null>(null);

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

  const handleViolationSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!offenderId) return;

    try {
      setViolationMsg(null);
      await submitViolation(raceId, {
        offenderId: Number(offenderId),
        severity,
        description: violationDesc,
      });
      setViolationMsg("Race incident logged.");
      setViolationDesc("");
    } catch {
      setViolationMsg("Failed to log race incident.");
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-[1180px] space-y-4" aria-label="Loading incident report">
        <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1180px] space-y-6" aria-labelledby="incident-report-title">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            to={`/referee/races/${raceId}/officiate`}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Race control
          </Link>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">
            Referee report desk
          </p>
          <h1 id="incident-report-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Race incident log
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Record rule observations as you notice them. The official report and any rider objections are written on the
            result package screen, so they reach the organizer together with the finish order.
          </p>
        </div>
      </header>

      <div className="grid gap-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="race-incident-title">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 text-rose-700">
              <ShieldAlert aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 id="race-incident-title" className="mt-3 text-2xl font-black text-slate-950">
              Race incident
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Use this only for official observations that affect safety, fairness, or result review.
            </p>
          </div>

          {violationMsg ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-black text-rose-800" role="status">
              {violationMsg}
            </div>
          ) : null}

          <form onSubmit={handleViolationSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Participant</span>
              <select
                value={offenderId}
                onChange={(event) => setOffenderId(Number(event.target.value))}
                className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
              >
                {participants.map((participant) => (
                  <option key={participant.participantId} value={participant.participantId}>
                    {participant.jockeyName} with {participant.horseName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Severity</span>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="mt-2 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
              >
                <option value="LOW">Low severity</option>
                <option value="MEDIUM">Medium severity</option>
                <option value="HIGH">High severity</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Observation</span>
              <textarea
                rows={5}
                value={violationDesc}
                onChange={(event) => setViolationDesc(event.target.value)}
                placeholder="Describe what happened, when it happened, and whether it affects the official result."
                className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
                required
              />
            </label>

            <button
              type="submit"
              className="min-h-12 w-full rounded-md bg-rose-700 px-5 text-sm font-black text-white transition hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
            >
              Log race incident
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
