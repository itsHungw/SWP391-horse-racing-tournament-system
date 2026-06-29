import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileWarning, ListChecks } from "lucide-react";

import { getOwnerHorses, getOwnerTournamentRegistrations, getPublicTournaments } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { OwnerLayout } from "../../layouts/OwnerLayout";
import type { Horse, Tournament, TournamentRegistration } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

export function OwnerDashboardPage() {
  useDocumentTitle("Owner dashboard");

  const [horses, setHorses] = useState<Horse[]>([]);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [horseData, registrationData, tournamentData] = await Promise.all([
          getOwnerHorses(),
          getOwnerTournamentRegistrations(),
          getPublicTournaments(),
        ]);
        if (active) {
          setHorses(Array.isArray(horseData) ? horseData : []);
          setRegistrations(Array.isArray(registrationData) ? registrationData : []);
          setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
          setMessage(null);
        }
      } catch (error) {
        if (active) {
          setMessage(getApiErrorMessage(error, "Could not load owner dashboard."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () => ({
      total: horses.length,
      approved: horses.filter((horse) => horse.status === "APPROVED").length,
      pending: horses.filter((horse) => horse.status === "PENDING").length,
      activeRegistrations: registrations.filter((item) => item.status === "PENDING" || item.status === "APPROVED")
        .length,
    }),
    [horses, registrations],
  );

  const rejectedHorses = horses.filter((horse) => horse.status === "REJECTED");
  const rejectedRegistrations = registrations.filter((registration) => registration.status === "REJECTED");
  const openTournaments = tournaments.filter((tournament) => tournament.status === "OPEN_REGISTRATION");
  const pendingReview = summary.pending;
  const metricCards = [
    {
      label: "Active registrations",
      value: summary.activeRegistrations,
      helper: "Entries currently moving through tournament review.",
      icon: ListChecks,
      tone: "border-[#006d5b]/20 bg-emerald-50 text-[#006d5b]",
    },
    {
      label: "Pending review",
      value: pendingReview,
      helper: "Horse profiles waiting on operations approval.",
      icon: Clock3,
      tone: "border-amber-300 bg-amber-50 text-amber-700",
    },
    {
      label: "Approved horses",
      value: summary.approved,
      helper: "Ready for registration workflows.",
      icon: CheckCircle2,
      tone: "border-green-300 bg-green-50 text-green-700",
    },
    {
      label: "Total horses",
      value: summary.total,
      helper: "All profiles in your stable roster.",
      icon: ListChecks,
      tone: "border-slate-200 bg-slate-50 text-slate-600",
    },
  ];

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-dashboard-title" className="space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#008670] to-[#006d5b]"></div>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Stable command center</p>
              <h1 id="owner-dashboard-title" className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Owner Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                Track horse approvals, open tournament windows, and registration review progress in one workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#006d5b] px-5 text-sm font-black text-white transition hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                href="/owner/horses"
              >
                Add Horse
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-black text-slate-900 transition hover:border-[#006d5b] hover:text-[#006d5b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                href="/owner/registrations"
              >
                Register Tournament
              </a>
            </div>
          </div>
        </div>

        {message && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900" role="status">
            {message}
          </p>
        )}

        <div aria-label="Owner stable summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-4xl font-black text-slate-950">{item.value}</p>
                </div>
                <span className={`rounded-md border p-2 ${item.tone}`}>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{item.helper}</p>
            </article>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]" aria-label="Loading owner workspace">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="h-6 w-44 rounded-md bg-slate-200" />
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div className="rounded-md border border-slate-200 p-4" key={item}>
                    <div className="h-5 w-2/3 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="h-6 w-32 rounded-md bg-slate-200" />
              <div className="mt-5 h-24 rounded-md bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="open-tournaments-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 id="open-tournaments-title" className="text-xl font-black text-slate-950">
                    Open Tournaments
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">Registration windows currently available.</p>
                </div>
                <a className="text-sm font-black text-[#006d5b] hover:text-[#004d3d]" href="/owner/registrations">
                  Browse Tournaments
                </a>
              </div>
              <div className="mt-4 space-y-3">
                {openTournaments.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5">
                    <p className="font-black text-slate-950">No active registrations.</p>
                    <p className="mt-1 text-sm font-bold text-slate-500">No tournaments are open for registration right now.</p>
                    <a
                      className="mt-4 inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-900 hover:border-[#006d5b] hover:text-[#006d5b]"
                      href="/owner/registrations"
                    >
                      Browse Tournaments
                    </a>
                  </div>
                ) : (
                  openTournaments.map((tournament) => (
                    <div className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-[#006d5b]/40 hover:bg-emerald-50/30" key={tournament.id}>
                      <p className="font-black text-slate-950">{tournament.name}</p>
                      <p className="text-sm text-slate-600">{tournament.location || "Location pending"}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="review-alerts-title">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="review-alerts-title" className="text-xl font-black text-slate-950">
                    Review Alerts
                  </h2>
                  <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                    Items that need owner follow-up after admin review.
                  </p>
                </div>
                <span className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {rejectedHorses.length === 0 && rejectedRegistrations.length === 0 ? (
                  <div className="rounded-md border border-green-200 bg-green-50 p-4">
                    <p className="font-black text-green-800">No rejected items.</p>
                    <p className="mt-1 text-sm font-bold text-green-700">Your current submissions do not need rejection follow-up.</p>
                  </div>
                ) : (
                  <>
                    {rejectedHorses.map((horse) => (
                      <div className="rounded-md border border-red-200 bg-white p-4 shadow-sm shadow-red-950/5" key={`horse-${horse.id}`}>
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 rounded-md bg-red-50 p-2 text-red-700">
                            <FileWarning className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-red-700">
                              Horse profile rejected
                            </span>
                            <p className="mt-2 font-black text-slate-950">{horse.name}</p>
                            <dl className="mt-3 grid gap-2 text-xs font-bold text-slate-600">
                              <div className="flex justify-between gap-3">
                                <dt>Affected item</dt>
                                <dd className="text-right text-slate-950">Horse profile</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt>Next step</dt>
                                <dd className="text-right text-slate-950">Fix horse details or documents</dd>
                              </div>
                            </dl>
                            <div className="mt-3 rounded-md border border-red-100 bg-red-50/70 px-3 py-2">
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-700">Reason</p>
                              <p className="mt-1 text-sm font-bold leading-6 text-red-900">
                                {horse.rejectionReason || "Horse review rejected."}
                              </p>
                            </div>
                          </div>
                        </div>
                        <a
                          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-black text-red-800 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                          href={`/owner/horses/${horse.id}`}
                        >
                          Update horse profile
                        </a>
                      </div>
                    ))}
                    {rejectedRegistrations.map((registration) => (
                      <div
                        className="rounded-md border border-red-200 bg-white p-4 shadow-sm shadow-red-950/5"
                        key={`registration-${registration.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 rounded-md bg-red-50 p-2 text-red-700">
                            <FileWarning className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="inline-flex rounded-md bg-red-50 px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-red-700">
                              Registration rejected
                            </span>
                            <p className="mt-2 font-black text-slate-950">{registration.tournamentName}</p>
                            <dl className="mt-3 grid gap-2 text-xs font-bold text-slate-600">
                              <div className="flex justify-between gap-3">
                                <dt>Horse</dt>
                                <dd className="text-right text-slate-950">{registration.horseName}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt>Affected item</dt>
                                <dd className="text-right text-slate-950">Tournament registration #{registration.id}</dd>
                              </div>
                              <div className="flex justify-between gap-3">
                                <dt>Next step</dt>
                                <dd className="text-right text-slate-950">Review rejected registration</dd>
                              </div>
                            </dl>
                            <div className="mt-3 rounded-md border border-red-100 bg-red-50/70 px-3 py-2">
                              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-700">Reason</p>
                              <p className="mt-1 text-sm font-bold leading-6 text-red-900">
                                {registration.rejectionReason || "Registration rejected."}
                              </p>
                            </div>
                          </div>
                        </div>
                        <a
                          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-black text-red-800 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                          href={`/owner/registrations?registrationId=${registration.id}#registration-${registration.id}`}
                        >
                          Open this registration
                        </a>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </section>
    </OwnerLayout>
  );
}
