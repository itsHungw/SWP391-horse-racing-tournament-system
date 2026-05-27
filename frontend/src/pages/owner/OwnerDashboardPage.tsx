import { useEffect, useMemo, useState } from "react";

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

  return (
    <OwnerLayout>
      <section aria-labelledby="owner-dashboard-title" className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Stable command center</p>
            <h1 id="owner-dashboard-title" className="mt-2 text-4xl font-black tracking-tight">
              Owner Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
              Track horse approvals, open tournament windows, and registration review progress in one workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              className="flex min-h-11 items-center rounded-md bg-[#006d5b] px-5 text-sm font-black text-white hover:bg-[#004d3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
              href="/owner/horses"
            >
              Add Horse
            </a>
            <a
              className="flex min-h-11 items-center rounded-md border border-[#070f4f] bg-white px-5 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
              href="/owner/registrations"
            >
              Register Tournament
            </a>
          </div>
        </div>

        {message && (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status">
            {message}
          </p>
        )}

        <div aria-label="Owner stable summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total horses", summary.total],
            ["Approved horses", summary.approved],
            ["Pending review", summary.pending],
            ["Active registrations", summary.activeRegistrations],
          ].map(([label, value]) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5" key={label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
            </article>
          ))}
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading owner workspace...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="open-tournaments-title">
              <h2 id="open-tournaments-title" className="text-xl font-black">
                Open Tournaments
              </h2>
              <div className="mt-4 space-y-3">
                {openTournaments.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">No tournaments are open for registration.</p>
                ) : (
                  openTournaments.map((tournament) => (
                    <div className="rounded-md border border-slate-200 p-4" key={tournament.id}>
                      <p className="font-black text-slate-950">{tournament.name}</p>
                      <p className="text-sm text-slate-600">{tournament.location || "Location pending"}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <aside className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="review-alerts-title">
              <h2 id="review-alerts-title" className="text-xl font-black">
                Review Alerts
              </h2>
              <div className="mt-4 space-y-3">
                {rejectedHorses.length === 0 && rejectedRegistrations.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">No rejected items.</p>
                ) : (
                  <>
                    {rejectedHorses.map((horse) => (
                      <div className="border-l-4 border-rose-700 bg-rose-50 p-4" key={`horse-${horse.id}`}>
                        <p className="font-black text-rose-900">{horse.name}</p>
                        <p className="text-sm font-bold text-rose-800">
                          {horse.rejectionReason || "Horse review rejected."}
                        </p>
                      </div>
                    ))}
                    {rejectedRegistrations.map((registration) => (
                      <div
                        className="border-l-4 border-rose-700 bg-rose-50 p-4"
                        key={`registration-${registration.id}`}
                      >
                        <p className="font-black text-rose-900">{registration.tournamentName}</p>
                        <p className="text-sm font-bold text-rose-800">
                          {registration.rejectionReason || "Registration rejected."}
                        </p>
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
