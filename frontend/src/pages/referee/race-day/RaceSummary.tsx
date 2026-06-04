import { useMemo, useState } from "react";
import { RaceAppeal, RaceSnapshot } from "./refereeRaceDayModels";

type RaceSummaryProps = {
  snapshot: RaceSnapshot;
  appeals?: RaceAppeal[];
};

function seconds(value: number) {
  return `${value.toFixed(3)}s`;
}

function penaltyFor(snapshot: RaceSnapshot, participantId: number) {
  return snapshot.incidents
    .filter((incident) => incident.participantId === participantId)
    .reduce((total, incident) => total + (incident.penaltySeconds ?? 0), 0);
}

export function RaceSummary({ snapshot, appeals = [] }: RaceSummaryProps) {
  const [timeDrafts, setTimeDrafts] = useState<Record<number, string>>({});
  const [savedOverrides, setSavedOverrides] = useState<Record<number, number>>({});
  const [savedRunnerIds, setSavedRunnerIds] = useState<number[]>([]);
  const [draftUpdated, setDraftUpdated] = useState(false);
  const [published, setPublished] = useState(false);
  const [appealRows, setAppealRows] = useState<RaceAppeal[]>(appeals);
  const [appealInputs, setAppealInputs] = useState<Record<string, string>>({});
  const baseElapsedSeconds = snapshot.elapsedMilliseconds / 1_000;
  const publishUnlocked = appealRows.every((appeal) => appeal.status === "RESOLVED" || appeal.status === "REJECTED");

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
            totalSeconds: Number.isFinite(savedOverride) ? savedOverride : totalSeconds,
          };
        })
        .sort((first, second) => first.totalSeconds - second.totalSeconds),
    [baseElapsedSeconds, savedOverrides, snapshot]
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

  return (
    <section aria-labelledby="draft-summary-title" className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#007a68]">Finished Draft</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950" id="draft-summary-title">Race Summary</h2>
          <p className="mt-2 text-sm text-slate-600">Draft timing snapshot captured at {seconds(baseElapsedSeconds)}.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="min-h-11 rounded-md bg-blue-600 px-4 text-xs font-black text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={published}
            onClick={() => setDraftUpdated(true)}
            type="button"
          >
            Update Draft Result
          </button>
          <button
            className="min-h-11 rounded-md bg-emerald-600 px-4 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={!draftUpdated || !publishUnlocked || published}
            onClick={() => setPublished(true)}
            type="button"
          >
            Publish Official Result
          </button>
        </div>
      </header>

      {published ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <span className="block">Official result published</span>
          <span className="mt-1 block font-bold text-emerald-600">Draft timing, appeals, and manual overrides are locked.</span>
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Draft Top 3</h3>
          <ol className="mt-3 space-y-3">
            {rows.slice(0, 3).map((row, index) => (
              <li className="race-day-row-motion rounded-2xl border border-slate-200 bg-[#fbfdfe] p-4" key={row.runner.participantId}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#007a68] px-3 py-1 font-mono text-xs font-black text-white">P{index + 1}</span>
                    <strong className="text-base text-slate-950">{row.runner.horseName}</strong>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      P{index + 1} (was P{row.physicalPosition})
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <label className="text-xs font-black text-slate-500">
                      Total time override
                      <input
                        aria-label={`Override total time for ${row.runner.horseName}`}
                        className="mt-1 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 font-mono text-sm font-black text-slate-950 outline-none focus:border-[#007a68] focus:ring-2 focus:ring-[#d4f1e7] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:w-28"
                        disabled={published}
                        inputMode="decimal"
                        onChange={(event) =>
                          setTimeDrafts((current) => ({
                            ...current,
                            [row.runner.participantId]: event.target.value,
                          }))
                        }
                        placeholder={row.totalSeconds.toFixed(3)}
                        type="number"
                        value={timeDrafts[row.runner.participantId] ?? ""}
                      />
                    </label>
                    <button
                      aria-label={`Update time for ${row.runner.horseName}`}
                      className="min-h-11 rounded-md bg-[#007a68] px-3 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      disabled={published || !timeDrafts[row.runner.participantId]?.trim()}
                      onClick={() => saveOverride(row.runner.participantId)}
                      type="button"
                    >
                      Update Time
                    </button>
                    {savedRunnerIds.includes(row.runner.participantId) ? (
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
            ))}
          </ol>

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
                    No pending appeals. Publish is available.
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
                                disabled={published}
                                onChange={(event) => setAppealInputs((current) => ({ ...current, [appeal.id]: event.target.value }))}
                                type="number"
                                value={inputValue}
                              />
                            </label>
                            <button
                              className="min-h-11 rounded-md bg-blue-600 px-3 text-xs font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                              disabled={published || !inputValue.trim()}
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
                                disabled={published}
                                onChange={(event) => setAppealInputs((current) => ({ ...current, [appeal.id]: event.target.value }))}
                                type="text"
                                value={inputValue}
                              />
                            </label>
                            <button
                              className="min-h-11 rounded-md bg-rose-700 px-3 text-xs font-black text-white disabled:bg-slate-200 disabled:text-slate-500"
                              disabled={published || !inputValue.trim()}
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
                              disabled={published}
                              onClick={() => updateAppeal(appeal.id, { status: "ACCEPTING" })}
                              type="button"
                            >
                              Accept appeal from {appeal.teamName}
                            </button>
                            <button
                              className="min-h-11 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-black text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                              disabled={published}
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

        <section>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Incident History</h3>
          <div className="mt-3 space-y-2">
            {snapshot.incidents.length === 0 ? (
              <p className="text-sm text-slate-500">No incidents recorded.</p>
            ) : (
              snapshot.incidents.map((entry) => <p className="text-sm text-slate-600" key={entry.id}>{entry.message}</p>)
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
