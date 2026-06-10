import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ShieldAlert } from "lucide-react";
import {
  getRaceResultEntries,
  ParticipantResultEntry,
  submitRaceResultPackage,
} from "../../api/refereeApi";

export function SubmitResultsPage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const [entries, setEntries] = useState<ParticipantResultEntry[]>([]);
  const [requiresAdminReview, setRequiresAdminReview] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getRaceResultEntries(raceId)
      .then(setEntries)
      .catch(() => setMessage("Unable to load result entries."))
      .finally(() => setLoading(false));
  }, [raceId]);

  const handleNumberChange = (index: number, field: "position" | "finishTimeSeconds", value: string) => {
    const updated = [...entries];
    if (field === "finishTimeSeconds") {
      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
        updated[index] = { ...updated[index], [field]: value as any };
        setEntries(updated);
      }
      return;
    }

    const parsed = value === "" ? "" : Number(value);
    updated[index] = { ...updated[index], [field]: parsed };
    setEntries(updated);
  };

  const handleStatusChange = (index: number, status: ParticipantResultEntry["status"]) => {
    const updated = [...entries];
    updated[index] =
      status === "FINISHED"
        ? { ...updated[index], status }
        : { ...updated[index], status, position: "", finishTimeSeconds: "" };
    setEntries(updated);
  };

  const finishedEntries = entries.filter((entry) => entry.status === "FINISHED");
  const positions = finishedEntries
    .map((entry) => entry.position)
    .filter((position): position is number => typeof position === "number");
  const hasDuplicates = new Set(positions).size !== positions.length;
  const missingFinishedData = finishedEntries.some(
    (entry) => !entry.position || entry.finishTimeSeconds === "" || entry.finishTimeSeconds == null,
  );
  const resultBlocked = entries.length === 0 || hasDuplicates || missingFinishedData;

  const handleSave = async () => {
    if (hasDuplicates) {
      setMessage("Duplicate finish positions are not allowed.");
      return;
    }

    if (missingFinishedData) {
      setMessage("Every finished participant needs a position and finish time.");
      return;
    }

    if (requiresAdminReview && !reviewReason.trim()) {
      setMessage("Add a review reason before escalating this result package.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const mappedEntries = entries.map((entry) => ({
        ...entry,
        position: entry.position === "" ? null : entry.position,
        finishTimeSeconds: entry.finishTimeSeconds === "" ? null : Number(entry.finishTimeSeconds),
      }));

      await submitRaceResultPackage(raceId, {
        results: mappedEntries as ParticipantResultEntry[],
        requiresAdminReview,
        reviewReason: requiresAdminReview ? reviewReason.trim() : null,
      });
      setMessage(
        requiresAdminReview
          ? "Result package submitted for admin review."
          : "Result package confirmed. Standings can now update."
      );
    } catch {
      setMessage("Failed to submit result package.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="max-w-[1180px] space-y-4" aria-label="Loading result package">
        <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1180px] space-y-5 pb-20 lg:pb-0" aria-labelledby="submit-results-title">
      <header className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
          to={`/referee/races/${raceId}/officiate`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Race control
        </Link>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Result package</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl" id="submit-results-title">
          Submit race results
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
          Record finish order and elapsed times. Normal submissions are confirmed by the referee. Escalate only when there is a dispute or serious incident.
        </p>
      </header>

      {message ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4" role="status" aria-live="polite">
          <p className="font-black text-slate-800">{message}</p>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ClipboardCheck aria-hidden="true" className="h-6 w-6 text-[#007a68]" />
            <div>
              <h2 className="text-2xl font-black text-slate-950">Finish order</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">One official position per finished participant.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {entries.map((entry, index) => (
              <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={entry.participantId}>
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.4fr)_110px_150px_170px] lg:items-end">
                  <div>
                    <p className="text-base font-black text-slate-950">{entry.horseName}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{entry.jockeyName}</p>
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Position</span>
                    <input
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
                      onChange={(event) => handleNumberChange(index, "position", event.target.value)}
                      placeholder="1"
                      type="number"
                      value={entry.position ?? ""}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Time seconds</span>
                    <input
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
                      onChange={(event) => handleNumberChange(index, "finishTimeSeconds", event.target.value)}
                      placeholder="94.25"
                      type="text"
                      value={entry.finishTimeSeconds ?? ""}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Result status</span>
                    <select
                      className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
                      onChange={(event) => handleStatusChange(index, event.target.value as ParticipantResultEntry["status"])}
                      value={entry.status}
                    >
                      <option value="FINISHED">Finished</option>
                      <option value="DISQUALIFIED">Disqualified</option>
                      <option value="DID_NOT_FINISH">Did not finish</option>
                      <option value="WITHDRAWN">Withdrawn</option>
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-[#007a68]">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-black text-slate-950">Confirmation path</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Keep the normal path fast. Use admin review only for disputes, photo-finish uncertainty, or serious incidents.
          </p>

          <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              checked={requiresAdminReview}
              className="mt-1 h-4 w-4 accent-[#007a68]"
              onChange={(event) => setRequiresAdminReview(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-black text-slate-950">Needs admin review</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                Escalate this package instead of confirming immediately.
              </span>
            </span>
          </label>

          {requiresAdminReview ? (
            <label className="mt-4 block">
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                <ShieldAlert aria-hidden="true" className="h-4 w-4 text-amber-600" />
                Review reason
              </span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20"
                onChange={(event) => setReviewReason(event.target.value)}
                placeholder="Example: Photo finish review requested by race officials."
                value={reviewReason}
              />
            </label>
          ) : null}

          <button
            className="mt-5 hidden min-h-12 w-full rounded-lg bg-[#007a68] px-5 text-sm font-black text-white transition hover:bg-[#006f5f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] lg:block"
            disabled={submitting || resultBlocked}
            onClick={() => void handleSave()}
            type="button"
          >
            {submitting ? "Submitting..." : requiresAdminReview ? "Submit for review" : "Confirm result package"}
          </button>
        </aside>
      </div>

      <div className="fixed inset-x-3 bottom-24 z-40 rounded-lg border border-emerald-900/15 bg-white/95 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-md lg:hidden">
        <button
          className="min-h-[52px] w-full rounded-lg bg-[#007a68] px-5 text-sm font-black text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
          disabled={submitting || resultBlocked}
          onClick={() => void handleSave()}
          type="button"
        >
          {submitting ? "Submitting..." : requiresAdminReview ? "Submit for review" : "Confirm result package"}
        </button>
      </div>
    </section>
  );
}
