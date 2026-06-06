import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAssignedRaces } from "../../api/refereeApi";
import { AssignedRace } from "./race-day/refereeRaceDayModels";
import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
import {
  countRaceStatuses,
  formatRaceDate,
  formatRaceTime,
  getNextRace,
  getRaceAction,
  getRaceStatusMeta,
  statusChipClasses,
} from "./refereeUi";

type RefereeDashboardPageProps = {
  now?: Date;
};

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function minutesUntil(value: string, now: Date) {
  return Math.ceil((new Date(value).getTime() - now.getTime()) / 60_000);
}

function formatCountdown(value: string, now: Date) {
  const minutes = minutesUntil(value, now);

  if (minutes <= -30) return "Race window open";
  if (minutes <= 0) return "Due now";
  if (minutes < 60) return `Starts in ${minutes} min`;

  const scheduledDate = new Date(value);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfRaceDay = new Date(
    scheduledDate.getFullYear(),
    scheduledDate.getMonth(),
    scheduledDate.getDate()
  ).getTime();
  const dayDiff = Math.round((startOfRaceDay - startOfToday) / 86_400_000);
  if (dayDiff === 0) return `Today at ${formatRaceTime(value)}`;
  if (dayDiff === 1) return `Tomorrow at ${formatRaceTime(value)}`;
  if (dayDiff > 1 && dayDiff <= 6) return `In ${dayDiff} days`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const days = Math.floor(hours / 24);
  if (days >= 1) return `In ${days} days`;
  return `${hours}h ${remainingMinutes}m remaining`;
}

function sortBySchedule(races: AssignedRace[]) {
  return [...races].sort(
    (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
  );
}

export function RefereeDashboardPage({ now }: RefereeDashboardPageProps) {
  const referenceNow = useMemo(() => now ?? new Date(), [now]);
  const navigate = useNavigate();
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const rows = await getAssignedRaces();
      setRaces(rows.map((race) => normalizeAssignedRace(race, referenceNow)));
    } catch {
      setError("Unable to load referee dashboard.");
    } finally {
      setLoading(false);
    }
  }, [referenceNow]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const todayRaces = sortBySchedule(
    races.filter((race) => isSameDay(new Date(race.scheduledAt), referenceNow))
  );
  const nextRace = getNextRace(races, referenceNow);
  const nextAction = nextRace ? getRaceAction(nextRace) : undefined;
  const queue = countRaceStatuses(races);
  const upcomingRaces = sortBySchedule(races)
    .filter((race) => new Date(race.scheduledAt).getTime() >= referenceNow.getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <section className="max-w-[1486px] space-y-5" aria-label="Loading referee dashboard">
        <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="h-28 animate-pulse rounded-xl bg-white" />
          <div className="h-28 animate-pulse rounded-xl bg-white" />
          <div className="h-28 animate-pulse rounded-xl bg-white" />
          <div className="h-28 animate-pulse rounded-xl bg-white" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error}</p>
        <button
          className="mt-4 min-h-11 rounded-lg bg-rose-700 px-5 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          onClick={() => void loadData()}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  const nextStatus = nextRace ? getRaceStatusMeta(nextRace.status) : undefined;
  const StatusIcon = nextStatus?.icon ?? CalendarDays;
  const queueItems: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    helper: string;
  }> = [
    { label: "Checks pending", value: queue.checks, icon: ClipboardCheck, helper: "Pre-race verification" },
    { label: "Ready to start", value: queue.ready, icon: CheckCircle2, helper: "Cleared field" },
    { label: "Live operations", value: queue.live, icon: Play, helper: "Race in progress" },
    { label: "Results to submit", value: queue.results, icon: Flag, helper: "Finish order needed" },
    { label: "Review needed", value: queue.review, icon: AlertTriangle, helper: "Escalated package" },
  ];

  return (
    <section className="max-w-[1486px] space-y-5 sm:space-y-6" aria-labelledby="referee-dashboard-title">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-[#052f2b] text-white shadow-sm">
          <div className="relative min-h-[250px] p-5 sm:min-h-[320px] sm:p-8">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1561470508-fd4df1ed90b2?auto=format&fit=crop&w=1800&q=70')] bg-cover bg-center opacity-24" />
            <div className="absolute inset-0 bg-[#052f2b]/78" />
            <div className="relative z-10 flex min-h-[214px] flex-col justify-between sm:min-h-[264px]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-100">
                  Next assigned race
                </p>
                <h1
                  className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:mt-5 sm:text-5xl"
                  id="referee-dashboard-title"
                >
                  {nextRace ? nextRace.name : "No active race assignment"}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50/88 sm:text-base sm:leading-7">
                  {nextRace
                    ? `${formatRaceDate(nextRace.scheduledAt)} at ${formatRaceTime(nextRace.scheduledAt)} | ${nextRace.venue} | ${nextRace.distanceMeters}m`
                    : "Race cards will appear here after the official schedule is published."}
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  {nextRace ? (
                    <>
                      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/18 bg-white/10 px-4 text-sm font-black text-white">
                        <StatusIcon aria-hidden="true" className="h-5 w-5" />
                        {nextStatus?.label}
                      </span>
                      <span className="inline-flex min-h-11 items-center rounded-lg border border-white/18 bg-white/10 px-4 text-sm font-black text-white">
                        {formatCountdown(nextRace.scheduledAt, referenceNow)}
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-lg border border-white/18 bg-white/10 px-4 text-sm font-black text-white">
                      Waiting for assignment
                    </span>
                  )}
                </div>

                {nextRace && nextAction ? (
                  <Link
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-[#05352f] transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-fit"
                    to={nextAction.to}
                  >
                    {nextAction.label}
                    <ArrowRight aria-hidden="true" className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-[#05352f] transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-fit"
                    to="/referee/assigned-races"
                  >
                    View assigned races
                    <ArrowRight aria-hidden="true" className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </article>

        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#007a68]">
            Operational queue
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Needs attention
          </h2>
          <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 xl:block xl:space-y-3">
            {queueItems.map(({ label, value, icon: Icon, helper }) => (
              <div
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                key={label}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#007a68] shadow-sm">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{label}</p>
                    <p className="text-xs font-semibold text-slate-500">{helper}</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-slate-950">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#007a68]">
                Today
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Race work queue
              </h2>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
              to="/referee/assigned-races"
            >
              Open race desk
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          {todayRaces.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-lg font-black text-slate-950">No assigned races today</p>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                When a published race schedule assigns you to a race, it will appear here as an actionable work item.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {todayRaces.map((race) => {
                const action = getRaceAction(race);
                const meta = getRaceStatusMeta(race.status);
                const Icon = meta.icon;

                return (
                  <article
                    className="grid gap-4 py-4 sm:grid-cols-[90px_minmax(0,1fr)] lg:grid-cols-[90px_minmax(0,1fr)_180px]"
                    key={race.id}
                  >
                    <div>
                      <p className="text-xl font-black text-slate-950">{formatRaceTime(race.scheduledAt)}</p>
                      <p className="text-xs font-bold text-slate-500">{formatCountdown(race.scheduledAt, referenceNow)}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-black uppercase ${statusChipClasses(race.status)}`}>
                          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{race.code}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-black text-slate-950">{race.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {race.venue} | {race.distanceMeters}m
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#007a68] px-4 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] sm:col-span-2 lg:col-span-1"
                      to={action.to}
                    >
                      {action.label}
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#007a68]">
                Upcoming
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Next assignments
              </h2>
            </div>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
              {queue.confirmed} confirmed
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingRaces.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No upcoming assignments on the official schedule.
              </p>
            ) : (
              upcomingRaces.map((race) => (
                <button
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-[#007a68] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
                  key={race.id}
                  onClick={() => navigate(`/referee/assigned-races?raceId=${race.id}`)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-950">{race.name}</p>
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase ${statusChipClasses(race.status)}`}>
                      {getRaceStatusMeta(race.status).label}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {formatRaceDate(race.scheduledAt)} | {formatRaceTime(race.scheduledAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
