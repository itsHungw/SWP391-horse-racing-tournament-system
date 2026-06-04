import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  List,
  Loader2,
  Timer,
  X,
} from "lucide-react";

import { getJockeyContracts, getJockeyParticipants, getJockeySchedule } from "../../api/racingApi";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import type { JockeyInvitation, JockeyScheduleItem, TournamentParticipant } from "../../types/racing";
import { getApiErrorMessage } from "../../utils/apiError";

type ScheduleView = "timeline" | "calendar" | "list" | "completed";

const viewOptions: Array<{ id: ScheduleView; label: string; icon: typeof Timer }> = [
  { id: "timeline", label: "Championship Timeline", icon: Timer },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "list", label: "List", icon: List },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const visibleFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" });

function statusClass(status: string) {
  if (status === "PUBLISHED" || status === "FINISHED") return "border-emerald-200 bg-emerald-50 text-[#006d5b]";
  if (status === "ONGOING" || status === "READY" || status === "CHECKING") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (status === "CANCELLED") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusDotClass(status: string) {
  if (status === "PUBLISHED" || status === "FINISHED") return "bg-[#006d5b]";
  if (status === "ONGOING" || status === "READY" || status === "CHECKING") return "bg-amber-500";
  if (status === "CANCELLED") return "bg-rose-500";
  return "bg-blue-500";
}

function parseDate(value: string) {
  return new Date(value);
}

function sameMonth(date: Date, monthDate: Date) {
  return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthCells(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const mondayBasedOffset = (first.getDay() + 6) % 7;
  const cells: Array<number | null> = [];

  for (let i = 0; i < mondayBasedOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function raceDayLabel(item: JockeyScheduleItem) {
  const today = new Date();
  const raceDate = parseDate(item.raceAt);
  const dayDiff = Math.ceil(
    (new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (dayDiff < 0) return "Completed";
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  return `In ${dayDiff} days`;
}

function groupByChampionship(items: JockeyScheduleItem[]) {
  const groups = new Map<number, { name: string; items: JockeyScheduleItem[] }>();
  for (const item of items) {
    if (!groups.has(item.championshipId)) {
      groups.set(item.championshipId, { name: item.championshipName, items: [] });
    }
    groups.get(item.championshipId)?.items.push(item);
  }
  return [...groups.values()];
}

export function JockeySchedulePage() {
  useDocumentTitle("Jockey schedule");

  const [view, setView] = useState<ScheduleView>("timeline");
  const [schedule, setSchedule] = useState<JockeyScheduleItem[]>([]);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [contracts, setContracts] = useState<JockeyInvitation[]>([]);
  const [selectedRace, setSelectedRace] = useState<JockeyScheduleItem | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadSchedule() {
      setIsLoading(true);
      setError("");
      try {
        const [scheduleData, participantData, contractData] = await Promise.all([
          getJockeySchedule(),
          getJockeyParticipants(),
          getJockeyContracts(),
        ]);
        if (!ignore) {
          setSchedule(scheduleData);
          setParticipants(participantData);
          setContracts(contractData);
          if (scheduleData[0]) {
            setVisibleMonth(parseDate(scheduleData[0].raceAt));
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(getApiErrorMessage(err, "Could not load jockey schedule."));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadSchedule();

    return () => {
      ignore = true;
    };
  }, []);

  const completedItems = schedule.filter((item) => ["FINISHED", "PUBLISHED"].includes(item.raceStatus));
  const nextRace = schedule.find((item) => !["FINISHED", "PUBLISHED", "CANCELLED"].includes(item.raceStatus));
  const hasAcceptedContract = contracts.some((contract) => contract.status === "ACCEPTED");
  const championshipGroups = useMemo(() => groupByChampionship(schedule), [schedule]);
  const cells = useMemo(() => monthCells(visibleMonth), [visibleMonth]);
  const monthItems = useMemo(
    () => schedule.filter((item) => sameMonth(parseDate(item.raceAt), visibleMonth)),
    [schedule, visibleMonth],
  );

  const emptyState = (() => {
    if (participants.length > 0) {
      return {
        title: "Official assignment confirmed",
        message: "Your Horse + Jockey pair is locked. Waiting for admin to publish the official race schedule.",
      };
    }
    if (hasAcceptedContract) {
      return {
        title: "Contract accepted",
        message: "Your assignment is committed. Schedule unlocks after admin locks participants and publishes it.",
      };
    }
    return {
      title: "No official schedule yet",
      message: "Apply to championship pools and accept owner contracts before your official race calendar appears here.",
    };
  })();

  return (
    <JockeyLayout>
      <section aria-labelledby="schedule-title" className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">Official Race Schedule</p>
            <h1 id="schedule-title" className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Schedule
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              Calendar, list, and championship timeline generated from official race participants after schedule publication.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Schedule view">
            {viewOptions.map((item) => (
              <button
                aria-pressed={view === item.id}
                className={[
                  "inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                  view === item.id
                    ? "border-[#006d5b] bg-emerald-50 text-[#006d5b]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
                ].join(" ")}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white" />
            <div className="h-96 animate-pulse rounded-lg border border-slate-200 bg-white" />
          </div>
        ) : schedule.length === 0 ? (
          <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">{emptyState.title}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">{emptyState.message}</p>
            <div className="mx-auto mt-5 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <InfoBlock label="Accepted Contract" value={hasAcceptedContract ? "Done" : "Waiting"} />
              <InfoBlock label="Participant Lock" value={participants.length > 0 ? "Done" : "Waiting"} />
              <InfoBlock label="Schedule Publish" value="Waiting" />
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[1fr_300px]" aria-label="Schedule command summary">
              <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Next Published Race</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">{nextRace?.raceName ?? "Schedule Published"}</h2>
                {nextRace ? (
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {visibleFormatter.format(parseDate(nextRace.raceAt))} at {timeFormatter.format(parseDate(nextRace.raceAt))} -{" "}
                    {nextRace.horseName} / {nextRace.ownerName}
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    All currently published races are completed or published.
                  </p>
                )}
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Official Rounds</p>
                <p className="mt-2 text-4xl font-black text-slate-950">{schedule.length}</p>
                <p className="mt-2 text-sm font-bold text-slate-500">Generated from race participants</p>
              </article>
            </section>

            {view === "timeline" && (
              <section aria-labelledby="schedule-timeline-title" className="space-y-4">
                <div>
                  <h2 id="schedule-timeline-title" className="text-2xl font-black text-slate-950">
                    Championship Timeline
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Default schedule view for published championship rounds.
                  </p>
                </div>
                <div className="space-y-4">
                  {championshipGroups.map((group) => (
                    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={group.name}>
                      <h3 className="text-xl font-black text-slate-950">{group.name}</h3>
                      <ol className="mt-5 flex gap-3 overflow-x-auto pb-2">
                        {group.items.map((item, index) => (
                          <li className="flex min-w-56 items-stretch" key={item.raceParticipantId}>
                            <button
                              className={`w-full rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] ${statusClass(
                                item.raceStatus,
                              )}`}
                              onClick={() => setSelectedRace(item)}
                              type="button"
                            >
                              <p className="text-xs font-black uppercase tracking-[0.12em]">Round {index + 1}</p>
                              <p className="mt-2 text-base font-black text-slate-950">{item.raceName}</p>
                              <p className="mt-2 text-sm font-bold">
                                {visibleFormatter.format(parseDate(item.raceAt))} - {timeFormatter.format(parseDate(item.raceAt))}
                              </p>
                              <p className="mt-2 text-xs font-black uppercase tracking-[0.1em]">
                                {statusLabel(item.raceStatus)}
                              </p>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {view === "calendar" && (
              <section aria-label="Month calendar" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        aria-label="Previous month"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                        onClick={() =>
                          setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))
                        }
                        type="button"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <h2 className="text-2xl font-black text-slate-950">{monthFormatter.format(visibleMonth)}</h2>
                      <button
                        aria-label="Next month"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                        onClick={() =>
                          setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))
                        }
                        type="button"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#006d5b]">
                        Official
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black text-slate-600">
                      {monthItems.length} official race{monthItems.length === 1 ? "" : "s"} this month
                    </p>
                  </div>
                  <div
                    aria-label="Calendar status legend"
                    className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.1em] text-slate-500"
                  >
                    {["SCHEDULED", "CHECKING", "ONGOING", "PUBLISHED"].map((status) => (
                      <span className="inline-flex items-center gap-2" key={status}>
                        <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(status)}`} aria-hidden="true" />
                        {statusLabel(status)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-7 border-l border-t border-slate-200 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div className="border-b border-r border-slate-200 p-2 text-center" key={day}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 border-l border-slate-200">
                  {cells.map((day, index) => {
                    const cellDate =
                      day === null ? null : new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                    const dayItems = cellDate
                      ? monthItems.filter((item) => sameDay(parseDate(item.raceAt), cellDate))
                      : [];
                    const isToday = cellDate ? sameDay(cellDate, new Date()) : false;

                    return (
                      <div
                        className={[
                          "min-h-32 border-b border-r border-slate-200 p-2",
                          day === null ? "bg-slate-50" : isToday ? "bg-emerald-50/45 ring-1 ring-inset ring-[#006d5b]/25" : "bg-white",
                        ].join(" ")}
                        key={`${day ?? "blank"}-${index}`}
                      >
                        {day !== null && (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-black text-slate-700">{day}</p>
                              {isToday && (
                                <span
                                  className="rounded-md bg-[#006d5b] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                                  role="status"
                                >
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="mt-2 space-y-2">
                              {dayItems.slice(0, 2).map((item) => (
                                <button
                                  aria-label={`${item.raceName} ${statusLabel(item.raceStatus)}`}
                                  className={`w-full rounded-md border p-2 text-left text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b] ${statusClass(
                                    item.raceStatus,
                                  )}`}
                                  key={item.raceParticipantId}
                                  onClick={() => setSelectedRace(item)}
                                  type="button"
                                >
                                  <span className="block font-black">{item.raceName}</span>
                                  <span className="mt-1 block">{timeFormatter.format(parseDate(item.raceAt))}</span>
                                  <span className="mt-1 block truncate text-[11px] opacity-80">
                                    Your ride: {item.horseName}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {view === "list" && (
              <section className="space-y-3" aria-label="Schedule list">
                {schedule.map((item) => (
                  <button
                    className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#006d5b]/40 md:flex-row md:items-center md:justify-between"
                    key={item.raceParticipantId}
                    onClick={() => setSelectedRace(item)}
                    type="button"
                  >
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                        {item.championshipName}
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-950">{item.raceName}</p>
                      <p className="text-sm font-bold text-slate-500">
                        {visibleFormatter.format(parseDate(item.raceAt))} at {timeFormatter.format(parseDate(item.raceAt))}
                      </p>
                    </div>
                    <span className={`rounded-md border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClass(item.raceStatus)}`}>
                      {statusLabel(item.raceStatus)}
                    </span>
                  </button>
                ))}
              </section>
            )}

            {view === "completed" && (
              <section className="space-y-3" aria-label="Completed results">
                {completedItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                    <Flag className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
                    <h2 className="mt-3 text-xl font-black text-slate-950">No completed races yet</h2>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      Completed rounds will appear after results are finished or published.
                    </p>
                  </div>
                ) : (
                  completedItems.map((item) => (
                    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={item.raceParticipantId}>
                      <p className="text-sm font-black uppercase tracking-[0.12em] text-[#006d5b]">
                        {item.championshipName}
                      </p>
                      <h2 className="mt-1 text-xl font-black text-slate-950">{item.raceName}</h2>
                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {item.horseName} - {statusLabel(item.raceStatus)}
                      </p>
                    </article>
                  ))
                )}
              </section>
            )}
          </>
        )}
      </section>

      <RaceDrawer onClose={() => setSelectedRace(null)} race={selectedRace} />
    </JockeyLayout>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function RaceDrawer({ race, onClose }: { race: JockeyScheduleItem | null; onClose: () => void }) {
  if (!race) return null;

  return (
    <div aria-label="Race detail" aria-modal="true" className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" role="dialog">
      <div className="h-full w-full max-w-md overflow-auto bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#006d5b]">Race Day Brief</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{race.raceName}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{race.championshipName}</p>
          </div>
          <button
            aria-label="Close race detail"
            className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Your Ride</p>
            <p className="mt-2 text-xl font-black text-slate-950">{race.horseName}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">Owner: {race.ownerName}</p>
          </div>
          <div className="grid gap-3">
            <InfoBlock label="Race Date" value={visibleFormatter.format(parseDate(race.raceAt))} />
            <InfoBlock label="Start Time" value={timeFormatter.format(parseDate(race.raceAt))} />
            <InfoBlock label="Distance" value={`${race.distanceMeters} meters`} />
            <InfoBlock label="Race Status" value={statusLabel(race.raceStatus)} />
            <InfoBlock label="Check Status" value={statusLabel(race.checkStatus)} />
            <InfoBlock label="Confirmation" value={statusLabel(race.confirmationStatus)} />
          </div>
        </div>
      </div>
    </div>
  );
}
