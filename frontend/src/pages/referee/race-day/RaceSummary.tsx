import { useMemo, useState } from "react";
import { ParticipantResultEntry, submitRaceResultPackage } from "../../../api/refereeApi";
import { LiveRunner, RaceAppeal, RaceSnapshot } from "./refereeRaceDayModels";

type RaceSummaryProps = {
  raceId: number;
  snapshot: RaceSnapshot;
  appeals?: RaceAppeal[];
  onConfirmed?: () => void;
};

function seconds(value: number) {
  return `${value.toFixed(3)}s`;
}

function penaltyFor(snapshot: RaceSnapshot, participantId: number) {
  return snapshot.incidents
    .filter((incident) => incident.participantId === participantId)
    .reduce((total, incident) => total + (incident.penaltySeconds ?? 0), 0);
}

export function outOfRaceStatusLabel(status: LiveRunner["status"]): string {
  if (status === "DSQ") return "DSQ";
  if (status === "DNS") return "DNS";
  return "DNF";
}

export function outOfRaceResultStatus(status: LiveRunner["status"]): ParticipantResultEntry["status"] {
  if (status === "DSQ") return "DISQUALIFIED";
  if (status === "DNS") return "WITHDRAWN";
  return "DID_NOT_FINISH";
}

function outOfRaceNote(status: LiveRunner["status"]): string {
  if (status === "DSQ") return "Disqualified during live race control.";
  if (status === "DNS") return "Scratched at pre-race check; did not start.";
  return "Removed during live race control.";
}

type ResultRowData = {
  runner: LiveRunner;
  physicalPosition: number;
  actualSeconds: number;
  penaltySeconds: number;
  hasManualOverride: boolean;
  totalSeconds: number;
};

function ResultRow({
  row,
  position,
  confirmed,
  timeDraft,
  savedIndicatorVisible,
  onDraftChange,
  onSave,
}: {
  row: ResultRowData;
  position: number;
  confirmed: boolean;
  timeDraft: string;
  savedIndicatorVisible: boolean;
  onDraftChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <li className="race-day-row-motion rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white">P{position}</span>
          <strong className="text-base text-slate-950">{row.runner.horseName}</strong>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
            P{position} (was P{row.physicalPosition})
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs font-black text-slate-500">
            Total time override
            <input
              aria-label={`Override total time for ${row.runner.horseName}`}
              className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 font-mono text-sm font-black text-slate-950 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#d4f1e7] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-28"
              disabled={confirmed}
              inputMode="decimal"
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={row.totalSeconds.toFixed(3)}
              type="number"
              value={timeDraft}
            />
          </label>
          <button
            aria-label={`Update time for ${row.runner.horseName}`}
            className="min-h-11 rounded-md bg-[#007a68] px-3 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={confirmed || !timeDraft.trim()}
            onClick={onSave}
            type="button"
          >
            Update Time
          </button>
          {savedIndicatorVisible ? (
            <span className="inline-flex min-h-11 items-center rounded-md bg-emerald-50 px-3 text-xs font-black text-emerald-700">
              Saved
            </span>
          ) : null}
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-white px-3 py-2 font-mono text-sm font-black text-slate-700">
        {seconds(row.actualSeconds)} + {seconds(row.penaltySeconds)} = {seconds(row.totalSeconds)}
      </p>
    </li>
  );
}

export function RaceSummary({ raceId, snapshot, appeals = [], onConfirmed }: RaceSummaryProps) {
  const [timeDrafts, setTimeDrafts] = useState<Record<number, string>>({});
  const [savedOverrides, setSavedOverrides] = useState<Record<number, number>>({});
  const [savedRunnerIds, setSavedRunnerIds] = useState<number[]>([]);
  const [draftUpdated, setDraftUpdated] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [appealRows, setAppealRows] = useState<RaceAppeal[]>(appeals);
  const [appealInputs, setAppealInputs] = useState<Record<string, string>>({});
  const [raceNotes, setRaceNotes] = useState("");
  const [reportDraft, setReportDraft] = useState("");
  const confirmationUnlocked = appealRows.every((appeal) => appeal.status === "RESOLVED" || appeal.status === "REJECTED");

  const rows = useMemo(
    () =>
      snapshot.leaderboard
        .map((runner, index) => {
          const penaltySeconds = penaltyFor(snapshot, runner.participantId);
          const actualSeconds = (runner.finishMilliseconds ?? snapshot.elapsedMilliseconds) / 1_000;
          const totalSeconds = actualSeconds + penaltySeconds;
          const savedOverride = savedOverrides[runner.participantId];

          return {
            runner,
            physicalPosition: index + 1,
            actualSeconds,
            penaltySeconds,
            hasManualOverride: Number.isFinite(savedOverride),
            totalSeconds: Number.isFinite(savedOverride) ? savedOverride : totalSeconds,
          };
        })
        .sort((first, second) => first.totalSeconds - second.totalSeconds),
    [savedOverrides, snapshot]
  );

  const updateAppeal = (id: string, patch: Partial<RaceAppeal>) => {
    setAppealRows((current) => current.map((appeal) => (appeal.id === id ? { ...appeal, ...patch } : appeal)));
  };

  const saveOverride = (participantId: number) => {
    const nextTotal = Number(timeDrafts[participantId]);

    if (!Number.isFinite(nextTotal)) {
      return;
    }

    setSavedOverrides((current) => ({
      ...current,
      [participantId]: nextTotal,
    }));
    setSavedRunnerIds((current) => (current.includes(participantId) ? current : [...current, participantId]));
  };

  const confirmResultPackage = async () => {
    try {
      setSubmitting(true);
      setSubmitMessage(null);

      const finishedEntries: ParticipantResultEntry[] = rows.map((row, index) => ({
        participantId: row.runner.participantId,
        horseName: row.runner.horseName,
        jockeyName: row.runner.jockeyName ?? "",
        position: index + 1,
        rawFinishTimeSeconds: row.hasManualOverride ? "" : Number(row.actualSeconds.toFixed(3)),
        penaltySeconds: Number(row.penaltySeconds.toFixed(3)),
        finishTimeSeconds: Number(row.totalSeconds.toFixed(3)),
        status: "FINISHED",
        note: row.hasManualOverride ? "Manual total time override from race summary." : null,
      }));

      const removedEntries: ParticipantResultEntry[] = snapshot.outOfRace.map((runner) => ({
        participantId: runner.participantId,
        horseName: runner.horseName,
        jockeyName: runner.jockeyName ?? "",
        position: "",
        rawFinishTimeSeconds: "",
        penaltySeconds: 0,
        finishTimeSeconds: "",
        status: outOfRaceResultStatus(runner.status),
        note: outOfRaceNote(runner.status),
      }));

      await submitRaceResultPackage(raceId, {
        results: [...finishedEntries, ...removedEntries],
        requiresAdminReview: false,
        reviewReason: null,
        reportTitle: `Race result package ${raceId}`,
        reportSummary: reportDraft || raceNotes || null,
      });

      setConfirmed(true);
      setSubmitMessage("Official result package submitted and confirmed.");
      onConfirmed?.();
    } catch {
      setSubmitMessage("Unable to submit official result package.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateReportDraft = () => {
    const winner = rows[0]?.runner.horseName ?? "the leading runner";
    const incidentCount = snapshot.incidents.length;
    const removedCount = snapshot.outOfRace.length;
    const topThree = rows
      .slice(0, 3)
      .map((row, index) => `P${index + 1} ${row.runner.horseName}`)
      .join(", ");

    setReportDraft(
      [
        `${winner} finished first after referee review of timing and penalties.`,
        topThree ? `Draft top three: ${topThree}.` : "",
        incidentCount > 0
          ? `${incidentCount} official decision${incidentCount === 1 ? "" : "s"} were recorded during live control.`
          : "No official incidents were recorded during live control.",
        removedCount > 0
          ? `${removedCount} runner${removedCount === 1 ? "" : "s"} were removed from the finish order.`
          : "All cleared runners remained eligible for the finish order.",
        raceNotes.trim() ? `Referee notes: ${raceNotes.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    );
  };

  return (
    <section aria-labelledby="draft-summary-title" className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Result confirmation</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950" id="draft-summary-title">Official finish order</h2>
          <p className="mt-2 text-sm text-slate-600">Review timing, penalties, and appeals before confirming this race result.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-11 rounded-md bg-blue-600 px-4 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={confirmed}
            onClick={() => setDraftUpdated(true)}
            type="button"
          >
            Update finish order
          </button>
          <button
            className="min-h-11 rounded-md bg-emerald-600 px-4 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={!draftUpdated || !confirmationUnlocked || confirmed || submitting}
            onClick={() => void confirmResultPackage()}
            type="button"
          >
            {submitting ? "Submitting..." : "Confirm official result"}
          </button>
        </div>
      </header>

      {submitMessage ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700" role="status" aria-live="polite">
          {submitMessage}
        </p>
      ) : null}

      {confirmed ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <span className="block">Official result confirmed</span>
          <span className="mt-1 block font-bold text-emerald-600">Finish order, appeals, and manual overrides are locked.</span>
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Official top 3</h3>
          <ol className="mt-3 space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <ResultRow
                confirmed={confirmed}
                key={row.runner.participantId}
                onDraftChange={(value) =>
                  setTimeDrafts((current) => ({
                    ...current,
                    [row.runner.participantId]: value,
                  }))
                }
                onSave={() => saveOverride(row.runner.participantId)}
                position={index + 1}
                row={row}
                savedIndicatorVisible={savedRunnerIds.includes(row.runner.participantId)}
                timeDraft={timeDrafts[row.runner.participantId] ?? ""}
              />
            ))}
          </ol>

          {rows.length > 3 ? (
            <>
              <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Remaining finish order</h3>
              <ol className="mt-3 space-y-3">
                {rows.slice(3).map((row, index) => (
                  <ResultRow
                    confirmed={confirmed}
                    key={row.runner.participantId}
                    onDraftChange={(value) =>
                      setTimeDrafts((current) => ({
                        ...current,
                        [row.runner.participantId]: value,
                      }))
                    }
                    onSave={() => saveOverride(row.runner.participantId)}
                    position={index + 4}
                    row={row}
                    savedIndicatorVisible={savedRunnerIds.includes(row.runner.participantId)}
                    timeDraft={timeDrafts[row.runner.participantId] ?? ""}
                  />
                ))}
              </ol>
            </>
          ) : null}

          {snapshot.outOfRace.length > 0 ? (
            <>
              <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-slate-700">Did not start / did not finish / disqualified</h3>
              <ol className="mt-3 space-y-2">
                {snapshot.outOfRace.map((runner) => (
                  <li
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    key={runner.participantId}
                  >
                    <strong className="text-sm font-black text-slate-800">{runner.horseName}</strong>
                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-rose-700">
                      {outOfRaceStatusLabel(runner.status)}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}

          {draftUpdated ? (
            <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-labelledby="appeals-board-title">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Real-time review queue</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950" id="appeals-board-title">Appeals Board</h3>
                </div>
                <span className="text-xs font-black text-amber-800">{appealRows.length} appeal(s)</span>
              </div>

              <div className="mt-3 space-y-3">
                {appealRows.length === 0 ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    No pending appeals. Result confirmation is available.
                  </p>
                ) : (
                  appealRows.map((appeal) => {
                    const inputValue = appealInputs[appeal.id] ?? "";

                    return (
                      <article className="rounded-xl border border-amber-200 bg-white p-3" key={appeal.id}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black text-slate-950">{appeal.teamName}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{appeal.allegation}</p>
                          </div>
                          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                            {appeal.status === "RESOLVED" ? "Resolved" : appeal.status === "REJECTED" ? "Rejected" : "Pending"}
                          </span>
                        </div>

                        {appeal.status === "ACCEPTING" ? (
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <label className="text-xs font-black text-slate-600">
                              Penalty seconds for {appeal.teamName}
                              <input
                                aria-label={`Penalty seconds for ${appeal.teamName}`}
                                className="mt-1 min-h-11 rounded-md border border-slate-200 px-3 font-mono text-sm font-black disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                disabled={confirmed}
                                onChange={(event) => setAppealInputs((current) => ({ ...current, [appeal.id]: event.target.value }))}
                                type="number"
                                value={inputValue}
                              />
                            </label>
                            <button
                              className="min-h-11 rounded-md bg-blue-600 px-3 text-xs font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                              disabled={confirmed || !inputValue.trim()}
                              onClick={() => updateAppeal(appeal.id, { status: "RESOLVED", penaltySeconds: Number(inputValue) })}
                              type="button"
                            >
                              Save accepted appeal for {appeal.teamName}
                            </button>
                          </div>
                        ) : null}

                        {appeal.status === "REJECTING" ? (
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                            <label className="text-xs font-black text-slate-600">
                              Rejection reason for {appeal.teamName}
                              <input
                                aria-label={`Rejection reason for ${appeal.teamName}`}
                                className="mt-1 min-h-11 rounded-md border border-slate-200 px-3 text-sm font-bold disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                disabled={confirmed}
                                onChange={(event) => setAppealInputs((current) => ({ ...current, [appeal.id]: event.target.value }))}
                                type="text"
                                value={inputValue}
                              />
                            </label>
                            <button
                              className="min-h-11 rounded-md bg-rose-700 px-3 text-xs font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                              disabled={confirmed || !inputValue.trim()}
                              onClick={() => updateAppeal(appeal.id, { status: "REJECTED", rejectionReason: inputValue })}
                              type="button"
                            >
                              Save rejected appeal for {appeal.teamName}
                            </button>
                          </div>
                        ) : null}

                        {appeal.status === "PENDING" ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              className="min-h-11 rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                              disabled={confirmed}
                              onClick={() => updateAppeal(appeal.id, { status: "ACCEPTING" })}
                              type="button"
                            >
                              Accept appeal from {appeal.teamName}
                            </button>
                            <button
                              className="min-h-11 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                              disabled={confirmed}
                              onClick={() => updateAppeal(appeal.id, { status: "REJECTING" })}
                              type="button"
                            >
                              Reject appeal from {appeal.teamName}
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ) : null}
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Incident History</h3>
            <div className="mt-3 space-y-2">
              {snapshot.incidents.length === 0 ? (
                <p className="text-sm text-slate-500">No incidents recorded.</p>
              ) : (
                snapshot.incidents.map((entry) => (
                  <article className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2" key={entry.id}>
                    <p className="text-sm font-bold text-slate-700">{entry.message}</p>
                    <time className="mt-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {new Date(entry.occurredAt).toLocaleTimeString()}
                    </time>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#007a68]">Race report draft</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Official narrative</h3>
            <label className="mt-4 block text-xs font-black text-slate-600">
              Referee notes
              <textarea
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#d4f1e7]"
                onChange={(event) => setRaceNotes(event.target.value)}
                placeholder="Track condition, notable incidents, weather, appeal context..."
                value={raceNotes}
              />
            </label>
            <button
              className="mt-3 min-h-11 w-full rounded-md border border-[#007a68] bg-white px-4 text-xs font-black text-[#006f5f] transition hover:bg-[#eefbf7]"
              onClick={generateReportDraft}
              type="button"
            >
              Generate AI draft report
            </button>
            {reportDraft ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Draft report</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{reportDraft}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
