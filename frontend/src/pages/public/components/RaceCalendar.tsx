import { ChevronLeft, ChevronRight } from "lucide-react";

import type { RaceSummary } from "../../../types/racing";
import { racesByDay } from "../racingDiscovery";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function RaceCalendar({
  races,
  month,
  onMonthChange,
  onSelectDay,
}: {
  races: RaceSummary[];
  month: string;
  onMonthChange: (month: string) => void;
  onSelectDay: (day: string) => void;
}) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(year, monthNumber - 1, 1);
  const leading = (first.getDay() + 6) % 7;
  const start = new Date(year, monthNumber - 1, 1 - leading);
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const byDay = racesByDay(races);
  const changeMonth = (offset: number) => {
    const next = new Date(year, monthNumber - 1 + offset, 1);
    onMonthChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="flex h-11 w-11 items-center justify-center border border-white/15 text-ivory hover:border-gold-400/60">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-display text-3xl font-light text-ivory">
          {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(first)}
        </h2>
        <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="flex h-11 w-11 items-center justify-center border border-white/15 text-ivory hover:border-gold-400/60">
          <ChevronRight size={18} />
        </button>
      </div>
      <div role="grid" aria-label="Race calendar" className="grid grid-cols-7 overflow-hidden border-l border-t border-white/10">
        {WEEKDAYS.map((day) => (
          <div key={day} role="columnheader" className="border-b border-r border-white/10 bg-turf-950 px-2 py-3 text-center font-data text-[10px] uppercase tracking-[0.18em] text-ivory-faint">
            {day}
          </div>
        ))}
        {days.map((date) => {
          const key = dateKey(date);
          const dayRaces = byDay.get(key) ?? [];
          const inMonth = date.getMonth() === monthNumber - 1;
          return (
            <button
              type="button"
              role="gridcell"
              key={key}
              onClick={() => dayRaces.length && onSelectDay(key)}
              disabled={!dayRaces.length}
              aria-label={`${key}, ${dayRaces.length} races`}
              className={`min-h-28 border-b border-r border-white/10 p-2 text-left transition-colors md:min-h-36 ${inMonth ? "bg-turf-900" : "bg-turf-950 text-ivory-faint"} ${dayRaces.length ? "cursor-pointer hover:bg-turf-800" : "cursor-default"}`}
            >
              <span className="font-data text-xs text-ivory-dim">{date.getDate()}</span>
              <span className="mt-3 block space-y-1.5">
                {dayRaces.slice(0, 2).map((race) => (
                  <span key={race.id} className="block truncate border-l-2 border-gold-400/70 pl-2 text-[10px] leading-4 text-ivory">
                    {race.name}
                  </span>
                ))}
                {dayRaces.length > 2 ? (
                  <span className="block font-data text-[9px] uppercase tracking-[0.12em] text-gold-300">+{dayRaces.length - 2} races</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
