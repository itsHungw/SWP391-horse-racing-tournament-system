import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, List, Timer } from "lucide-react";

import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { JockeyLayout } from "../../layouts/JockeyLayout";
import { ChampionshipTimeline } from "./components/ChampionshipTimeline";
import { RaceDetailDrawer } from "./components/RaceDetailDrawer";
import {
  getRoundsForChampionship,
  jockeyChampionships,
  type JockeyRound,
  type RoundStatus,
} from "./jockeyWorkspaceData";

type ScheduleView = "timeline" | "calendar" | "list" | "completed";

const viewOptions: Array<{ id: ScheduleView; label: string; icon: typeof Timer }> = [
  { id: "timeline", label: "Championship Timeline", icon: Timer },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "list", label: "List", icon: List },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const TODAY = new Date("2026-06-02T00:00:00");
const TODAY_DAY = 2;

function statusClass(status: RoundStatus) {
  if (status === "FINISHED") {
    return "border-emerald-200 bg-emerald-50 text-[#006d5b]";
  }
  if (status === "NEXT") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (status === "LOCKED") {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function statusLabel(status: RoundStatus) {
  if (status === "FINISHED") return "Finished";
  if (status === "NEXT") return "Next Race";
  if (status === "LOCKED") return "Locked";
  if (status === "CANCELLED") return "Cancelled";
  return "Upcoming";
}

function statusDotClass(status: RoundStatus) {
  if (status === "FINISHED") return "bg-[#006d5b]";
  if (status === "NEXT") return "bg-amber-500";
  if (status === "LOCKED") return "bg-slate-400";
  if (status === "CANCELLED") return "bg-red-500";
  return "bg-blue-500";
}

function relativeRaceDay(date: string) {
  const raceDate = new Date(`${date}T00:00:00`);
  const dayDiff = Math.ceil((raceDate.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) return "Completed";
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  return `In ${dayDiff} days`;
}

function dayOfMonth(date: string) {
  return Number(date.split("-")[2] ?? "0");
}

export function JockeySchedulePage() {
  useDocumentTitle("Jockey schedule");

  const [view, setView] = useState<ScheduleView>("timeline");
  const [championshipId, setChampionshipId] = useState(jockeyChampionships[0]?.id ?? "");
  const [selectedRound, setSelectedRound] = useState<JockeyRound | null>(null);

  const championship = jockeyChampionships.find((item) => item.id === championshipId) ?? jockeyChampionships[0];
  const rounds = useMemo(() => getRoundsForChampionship(championship.id), [championship.id]);
  const completedRounds = rounds.filter((round) => round.status === "FINISHED");

  return (
    <JockeyLayout>
      <section aria-labelledby="schedule-title" className="space-y-6">
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 id="schedule-title" className="text-4xl font-black tracking-tight text-slate-950">
              Schedule
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              View championship rounds, upcoming races, and official results.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="text-sm font-black text-slate-700">
              <span className="sr-only">Select schedule championship</span>
              <select
                aria-label="Select schedule championship"
                className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-black text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#006d5b]"
                onChange={(event) => setChampionshipId(event.target.value)}
                value={championship.id}
              >
                {jockeyChampionships.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
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
        </div>

        {view === "timeline" && (
          <section aria-labelledby="schedule-timeline-title" className="space-y-3">
            <div>
              <h2 id="schedule-timeline-title" className="text-2xl font-black text-slate-950">
                {championship.name}
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">Default championship view for the season.</p>
            </div>
            <ChampionshipTimeline
              label="Schedule championship timeline"
              onSelectRound={setSelectedRound}
              rounds={rounds}
            />
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
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <h2 className="text-2xl font-black text-slate-950">June 2026</h2>
                  <button
                    aria-label="Next month"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
                    type="button"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#006d5b]">
                    Month
                  </span>
                </div>
                <p className="mt-2 text-sm font-black text-slate-600">
                  {championship.name} - {championship.rounds} rounds - Rank {championship.rank}
                </p>
              </div>
              <div aria-label="Calendar status legend" className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                {(["FINISHED", "NEXT", "UPCOMING", "LOCKED"] as RoundStatus[]).map((status) => (
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
              {Array.from({ length: 35 }, (_, index) => index + 1).map((day) => {
                const dayRounds = rounds.filter((round) => dayOfMonth(round.date) === day);
                const isToday = day === TODAY_DAY;
                return (
                  <div
                    className={[
                      "min-h-32 border-b border-r border-slate-200 p-2",
                      isToday ? "bg-emerald-50/45 ring-1 ring-inset ring-[#006d5b]/25" : "bg-white",
                    ].join(" ")}
                    key={day}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-700">{day}</p>
                      {isToday && (
                        <span
                          aria-label="Today June 2"
                          className="rounded-md bg-[#006d5b] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                          role="status"
                        >
                          Today
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-2">
                      {dayRounds.slice(0, 2).map((round) => (
                        <button
                          aria-label={`Round ${round.roundNumber} ${round.raceName} ${statusLabel(round.status)}`}
                          className={[
                            "relative w-full rounded-md border text-left text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                            round.status === "NEXT" ? "p-3 shadow-sm shadow-amber-200/60" : "p-2",
                            statusClass(round.status),
                          ].join(" ")}
                          key={round.id}
                          onClick={() => setSelectedRound(round)}
                          type="button"
                        >
                          {round.status === "NEXT" && (
                            <span className="mb-1 inline-flex rounded bg-amber-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                              Next Race
                            </span>
                          )}
                          <span className="block font-black">Round {round.roundNumber}</span>
                          <span className="block truncate">{round.raceName}</span>
                          <span className="mt-1 block">
                            {relativeRaceDay(round.date)} - {round.time}
                          </span>
                          <span className="mt-1 block truncate text-[11px] opacity-80">Your ride: {round.horse}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {view === "list" && (
          <section className="space-y-3" aria-label="Schedule list">
            {rounds.map((round) => (
              <button
                className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#006d5b]/40 md:flex-row md:items-center md:justify-between"
                key={round.id}
                onClick={() => setSelectedRound(round)}
                type="button"
              >
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Round {round.roundNumber}</p>
                  <p className="mt-1 text-lg font-black text-slate-950">{round.raceName}</p>
                  <p className="text-sm font-bold text-slate-500">{round.date} at {round.time}</p>
                </div>
                <span className={`rounded-md border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClass(round.status)}`}>
                  {round.status === "NEXT" ? "Next Race" : round.status}
                </span>
              </button>
            ))}
          </section>
        )}

        {view === "completed" && (
          <section className="space-y-3" aria-label="Completed results">
            {completedRounds.map((round) => (
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={round.id}>
                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#006d5b]">Round {round.roundNumber}</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{round.raceName}</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {round.position} - {round.points} pts - {round.horse}
                </p>
              </article>
            ))}
          </section>
        )}
      </section>

      <RaceDetailDrawer onClose={() => setSelectedRound(null)} round={selectedRound} totalRounds={championship.rounds} />
    </JockeyLayout>
  );
}
