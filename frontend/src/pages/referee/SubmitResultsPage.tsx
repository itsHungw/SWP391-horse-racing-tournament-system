import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, FileText, ShieldAlert } from "lucide-react";
import {
  buildObjectionDescription,
  getAssignedRace,
  getRaceParticipants,
  getRaceResultEntries,
  ParticipantResultEntry,
  ParticipantVerification,
  RaceObjectionDraft,
  RaceSummary,
  submitRaceResultPackage,
  submitViolation,
} from "../../api/refereeApi";
import { ObjectionForm } from "./race-day/ObjectionForm";

/** Race đã rời FINISHED theo hướng đã nộp — form khoá lại vì BR-16 chỉ cho nộp một lần. */
const LOCKED_STATUS_MESSAGES: Record<string, string> = {
  RESULT_SUBMITTED: "Results submitted — awaiting organizer confirmation.",
  RESULT_CONFIRMED: "Results confirmed by the organizer.",
  PUBLISHED: "Results published.",
};

const DECISION_LABELS: Record<string, string> = {
  NO_CHANGE: "No change to result",
  RIDER_PENALTY: "Rider penalty, result stands",
  RESULT_AMENDED: "Result amended",
};

function EntryRow({
  badge,
  entry,
  isReadOnly,
  onPositionChange,
  onStatusChange,
  onTimeChange,
}: {
  badge: string | null;
  entry: ParticipantResultEntry;
  isReadOnly: boolean;
  onPositionChange: (value: string) => void;
  onStatusChange: (status: ParticipantResultEntry["status"]) => void;
  onTimeChange: (value: string) => void;
}) {
  const fieldsDisabled = isReadOnly || entry.status !== "FINISHED";

  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1.4fr)_110px_150px_170px] lg:items-end">
        <div className="flex items-center gap-3">
          {badge ? (
            <span className="rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white">{badge}</span>
          ) : null}
          <div>
            <p className="text-base font-black text-slate-950">{entry.horseName}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{entry.jockeyName}</p>
          </div>
        </div>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Position</span>
          <input
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={fieldsDisabled}
            onChange={(event) => onPositionChange(event.target.value)}
            placeholder="1"
            type="number"
            value={entry.position ?? ""}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Time seconds</span>
          <input
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={fieldsDisabled}
            onChange={(event) => onTimeChange(event.target.value)}
            placeholder="94.25"
            type="text"
            value={entry.finishTimeSeconds ?? ""}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Result status</span>
          <select
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            disabled={isReadOnly}
            onChange={(event) => onStatusChange(event.target.value as ParticipantResultEntry["status"])}
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
  );
}

export function SubmitResultsPage() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const [entries, setEntries] = useState<ParticipantResultEntry[]>([]);
  const [race, setRace] = useState<RaceSummary>();
  const [participants, setParticipants] = useState<ParticipantVerification[]>([]);
  const [objections, setObjections] = useState<RaceObjectionDraft[]>([]);
  const [reportTitle, setReportTitle] = useState(`Race Report: R-${raceId}`);
  const [reportSummary, setReportSummary] = useState("");
  const [requiresAdminReview, setRequiresAdminReview] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getRaceResultEntries(raceId), getAssignedRace(raceId), getRaceParticipants(raceId)])
      .then(([resultEntries, raceRow, participantRows]) => {
        setEntries(resultEntries);
        setRace(raceRow);
        setParticipants(participantRows ?? []);
      })
      .catch(() => setMessage("Unable to load result entries."))
      .finally(() => setLoading(false));
  }, [raceId]);

  // Hai khái niệm khác nhau, trước đây bị gộp làm một: "đã nộp rồi" và "chưa tới lúc nộp".
  const isLocked = race != null && race.status in LOCKED_STATUS_MESSAGES;
  const isNotReady = race != null && !isLocked && race.status !== "FINISHED";
  const isReadOnly = isLocked || isNotReady;
  const readOnlyMessage = !race
    ? ""
    : LOCKED_STATUS_MESSAGES[race.status] ??
      (race.status === "CANCELLED"
        ? "This race was cancelled."
        : "This race has not finished yet — results cannot be submitted.");

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

  const sortedFinishedEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.status === "FINISHED")
    .sort((a, b) => {
      const positionA = typeof a.entry.position === "number" ? a.entry.position : Number.POSITIVE_INFINITY;
      const positionB = typeof b.entry.position === "number" ? b.entry.position : Number.POSITIVE_INFINITY;
      return positionA - positionB || a.index - b.index;
    });

  const otherEntries = entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.status !== "FINISHED");

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

      // Khiếu nại đi trước để chúng đã nằm trong sổ khi BTC mở gói ra duyệt.
      for (const objection of objections) {
        await submitViolation(raceId, {
          offenderId:
            objection.kind === "OBJECTION_INTERFERENCE"
              ? (objection.againstParticipantId as number)
              : objection.raisedByParticipantId,
          severity: objection.severity,
          description: buildObjectionDescription(objection),
          violationType: objection.kind,
          penalty: objection.decision,
        });
      }

      await submitRaceResultPackage(raceId, {
        results: mappedEntries as ParticipantResultEntry[],
        requiresAdminReview,
        reviewReason: requiresAdminReview ? reviewReason.trim() : null,
        reportTitle: reportTitle.trim(),
        reportSummary: reportSummary.trim(),
      });
      setRace((current) => (current ? { ...current, status: "RESULT_SUBMITTED" } : current));
      // BR-16: trọng tài chỉ NỘP. Không được nói "confirmed" — BTC mới là người chốt.
      setMessage(
        requiresAdminReview
          ? "Package submitted for admin review. Awaiting organizer confirmation."
          : "Package submitted. Awaiting organizer confirmation."
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

      {isReadOnly ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4" role="status">
          <p className="font-black text-emerald-800">{readOnlyMessage}</p>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4" role="status" aria-live="polite">
          <p className="font-black text-slate-800">{message}</p>
        </div>
      ) : null}

      <div className={isReadOnly ? "grid gap-5" : "grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"}>
        <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ClipboardCheck aria-hidden="true" className="h-6 w-6 text-[#007a68]" />
            <div>
              <h2 className="text-2xl font-black text-slate-950">Finish order</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">One official position per finished participant.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Official top 3</h3>
            <div className="space-y-3">
              {sortedFinishedEntries.slice(0, 3).map(({ entry, index }, position) => (
                <EntryRow
                  badge={`P${position + 1}`}
                  entry={entry}
                  isReadOnly={isReadOnly}
                  key={entry.participantId}
                  onPositionChange={(value) => handleNumberChange(index, "position", value)}
                  onStatusChange={(status) => handleStatusChange(index, status)}
                  onTimeChange={(value) => handleNumberChange(index, "finishTimeSeconds", value)}
                />
              ))}
            </div>

            {sortedFinishedEntries.length > 3 ? (
              <>
                <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Remaining finish order</h3>
                <div className="space-y-3">
                  {sortedFinishedEntries.slice(3).map(({ entry, index }, position) => (
                    <EntryRow
                      badge={`P${position + 4}`}
                      entry={entry}
                      isReadOnly={isReadOnly}
                      key={entry.participantId}
                      onPositionChange={(value) => handleNumberChange(index, "position", value)}
                      onStatusChange={(status) => handleStatusChange(index, status)}
                      onTimeChange={(value) => handleNumberChange(index, "finishTimeSeconds", value)}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {otherEntries.length > 0 ? (
              <>
                <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Did not finish / disqualified</h3>
                <div className="space-y-3">
                  {otherEntries.map(({ entry, index }) => (
                    <EntryRow
                      badge={null}
                      entry={entry}
                      isReadOnly={isReadOnly}
                      key={entry.participantId}
                      onPositionChange={(value) => handleNumberChange(index, "position", value)}
                      onStatusChange={(status) => handleStatusChange(index, status)}
                      onTimeChange={(value) => handleNumberChange(index, "finishTimeSeconds", value)}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="objections-title">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <ShieldAlert aria-hidden="true" className="h-6 w-6 text-amber-600" />
            <div>
              <h2 className="text-2xl font-black text-slate-950" id="objections-title">
                Incidents and objections
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Riders object in person at weigh-in. Record what was raised and how you ruled — it goes to the organizer with the result.
              </p>
            </div>
          </div>

          {objections.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-black text-slate-800">
                {objections.length} objection{objections.length === 1 ? "" : "s"} recorded
              </p>
              <ul className="mt-3 space-y-2">
                {objections.map((objection, index) => (
                  <li className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2" key={index}>
                    <p className="whitespace-pre-line text-sm font-semibold text-amber-900">
                      {buildObjectionDescription(objection)}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wider text-amber-800">
                      {DECISION_LABELS[objection.decision]}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!isReadOnly ? (
            <div className="mt-5">
              <ObjectionForm
                onRecord={(draft) => setObjections((current) => [...current, draft])}
                participants={participants}
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="official-report-title">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <FileText aria-hidden="true" className="h-6 w-6 text-[#007a68]" />
            <div>
              <h2 className="text-2xl font-black text-slate-950" id="official-report-title">
                Official report
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Track conditions, notable decisions, and result confidence.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="report-title">
                Report title
              </label>
              <input
                className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={isReadOnly}
                id="report-title"
                onChange={(event) => setReportTitle(event.target.value)}
                type="text"
                value={reportTitle}
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="report-summary">
                Race summary and observations
              </label>
              <textarea
                className="mt-1 w-full resize-y rounded-md border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#007a68]/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                disabled={isReadOnly}
                id="report-summary"
                onChange={(event) => setReportSummary(event.target.value)}
                placeholder="Example: Track condition was clear. One objection raised at weigh-in and dismissed after replay."
                rows={6}
                value={reportSummary}
              />
            </div>
          </div>
        </section>
        </div>

        {!isReadOnly ? (
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
              {submitting ? "Submitting..." : requiresAdminReview ? "Submit for review" : "Submit package to organizer"}
            </button>
          </aside>
        ) : null}
      </div>

      {!isReadOnly ? (
        <div className="fixed inset-x-3 bottom-24 z-40 rounded-lg border border-emerald-900/15 bg-white/95 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-md lg:hidden">
          <button
            className="min-h-[52px] w-full rounded-lg bg-[#007a68] px-5 text-sm font-black text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            disabled={submitting || resultBlocked}
            onClick={() => void handleSave()}
            type="button"
          >
            {submitting ? "Submitting..." : requiresAdminReview ? "Submit for review" : "Submit package to organizer"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
