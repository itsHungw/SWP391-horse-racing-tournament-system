import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAssignedRaces, RaceSummary } from "../../api/refereeApi";

interface RefereeOverviewPageProps {
  mode?: "all" | "check" | "results" | "reports";
}

const modeCopy = {
  all: {
    title: "Assigned Race Desk",
    description: "Select assigned race cards and move through official referee workflows.",
    queueLabel: "REFEREE DESK",
  },
  check: {
    title: "Pre-Race Checks",
    description: "Select a scheduled race to verify horse, jockey, equipment, and readiness records.",
    queueLabel: "PRE-RACE VERIFICATION",
  },
  results: {
    title: "Submit Results",
    description: "Record official timing, finish ranks, and result status for completed races.",
    queueLabel: "RESULTS DESK",
  },
  reports: {
    title: "Reports & Violations",
    description: "File incident logs and final steward observations for assigned race cards.",
    queueLabel: "INCIDENT REVIEW",
  },
};

export function RefereeOverviewPage({ mode = "all" }: RefereeOverviewPageProps) {
  const [races, setRaces] = useState<RaceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssignedRaces()
      .then(setRaces)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copy = modeCopy[mode];

  if (loading) {
    return (
      <div className="max-w-[1486px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">
            Preparing steward assignments
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-16 rounded-lg bg-slate-100" />
            <div className="h-16 rounded-lg bg-slate-100" />
            <div className="h-16 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1486px]">
      <section className="mb-9">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-[#006f5f]">{copy.queueLabel}</p>
        <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#050818]">
          {copy.title}
        </h2>
        <p className="mt-4 max-w-4xl text-xl leading-8 text-slate-600">{copy.description}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-[0_1px_6px_rgba(15,23,42,0.12)]">
        <div className="mx-auto mb-8 grid max-w-4xl grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-4 border-b border-slate-100 pb-7">
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#d4f1e7] bg-[#007a68] text-lg font-black text-white shadow-sm">
              1
            </span>
            <p className="mt-3 text-sm font-black text-[#007a68]">Select Race</p>
          </div>
          <div className="h-px w-full bg-slate-200" />
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-400">
              2
            </span>
            <p className="mt-3 text-sm font-black text-slate-500">Officiate</p>
          </div>
          <div className="h-px w-full bg-slate-200" />
          <div className="text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-400">
              3
            </span>
            <p className="mt-3 text-sm font-black text-slate-500">Confirm Record</p>
          </div>
        </div>

        <h3 className="mb-6 text-2xl font-black text-slate-900">Step 1: Select a Race Task</h3>

        {races.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-sm font-black text-slate-900">No races currently assigned</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              When the tournament desk assigns a race card to your account, it will appear here with
              the available officiating actions.
            </p>
          </div>
        ) : (
          <div className="grid max-w-3xl gap-5">
            {races.map((race) => (
              <article
                key={race.id}
                className="rounded-xl border border-slate-200 bg-white p-7 shadow-[0_1px_10px_rgba(15,23,42,0.06)] transition-colors hover:border-[#007a68]/40"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <span className="w-fit rounded-full bg-[#e8fbf4] px-4 py-2 text-xs font-black uppercase text-[#007a68]">
                    {race.status}
                  </span>
                  <span className="text-sm font-bold text-slate-400">
                    Code: <strong className="text-slate-500">{race.code}</strong>
                  </span>
                </div>

                <h4 className="mt-5 text-2xl font-black leading-tight text-[#0f172a]">{race.name}</h4>
                <p className="mt-3 text-base leading-7 text-slate-500">
                  Official race card assigned to your referee desk for race-day processing.
                </p>

                <dl className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-bold text-slate-400">Distance:</dt>
                    <dd className="mt-1 font-black text-slate-700">{race.distanceMeters}m</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-slate-400">Workspace:</dt>
                    <dd className="mt-1 font-black text-slate-700">Referee Operations</dd>
                  </div>
                </dl>

                <div className="mt-7 grid gap-3">
                  {(mode === "all" || mode === "check") && (
                    <Link
                      to={`/referee/races/${race.id}/officiate`}
                      className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#007a68] px-5 text-sm font-black text-white transition-colors hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f]"
                    >
                      Open Pre-Check
                    </Link>
                  )}
                  {(mode === "all" || mode === "results") && (
                    <Link
                      to={`/referee/races/${race.id}/officiate`}
                      className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#007a68] bg-white px-5 text-sm font-black text-[#007a68] transition-colors hover:bg-[#e8fbf4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f]"
                    >
                      Record Results
                    </Link>
                  )}
                  {(mode === "all" || mode === "reports") && (
                    <Link
                      to={`/referee/races/${race.id}/officiate`}
                      className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-5 text-sm font-black text-white transition-colors hover:bg-[#06145f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
                    >
                      File Incident
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
