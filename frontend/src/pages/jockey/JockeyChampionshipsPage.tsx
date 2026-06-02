import { useState } from "react";
import { ArrowRight, CheckCircle2, Trophy } from "lucide-react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import { jockeyChampionships } from "./jockeyWorkspaceData";

export function JockeyChampionshipsPage() {
  useDocumentTitle("Jockey championships");
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({ "autumn-2026": false });

  return (
    <JockeyLayout>
      <section aria-labelledby="championships-title" className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Championship Pools</p>
          <h1 id="championships-title" className="mt-2 text-4xl font-black tracking-tight text-slate-950">
            Championships
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            Enroll into championship pools so stable owners can send tournament assignment contracts.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {jockeyChampionships.map((championship) => {
            const isOpen = championship.enrollmentStatus === "Open Enrollment";
            const isEnrolled = championship.enrollmentStatus === "Enrolled" || enrolled[championship.id];
            return (
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={championship.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#006d5b]">
                      {isEnrolled ? "Enrolled" : championship.enrollmentStatus}
                    </span>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">{championship.name}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {championship.track} - {championship.location}
                    </p>
                  </div>
                  <Trophy className="h-6 w-6 text-[#006d5b]" aria-hidden="true" />
                </div>
                <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="font-bold text-slate-500">Season</dt>
                    <dd className="mt-1 font-black text-slate-950">{championship.season}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="font-bold text-slate-500">Rounds</dt>
                    <dd className="mt-1 font-black text-slate-950">{championship.rounds}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="font-bold text-slate-500">Enrollment deadline</dt>
                    <dd className="mt-1 font-black text-slate-950">{championship.enrollmentDeadline}</dd>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <dt className="font-bold text-slate-500">Commitment</dt>
                    <dd className="mt-1 font-black text-slate-950">{championship.commitmentStatus}</dd>
                  </div>
                </dl>
                {isEnrolled ? (
                  <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-[#006d5b]">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
                    Owners can now invite you for this championship.
                  </p>
                ) : (
                  <button
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    disabled={!isOpen}
                    onClick={() => setEnrolled((current) => ({ ...current, [championship.id]: true }))}
                    type="button"
                  >
                    Enroll
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </JockeyLayout>
  );
}
