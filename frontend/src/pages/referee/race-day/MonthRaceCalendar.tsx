import { AssignedRace } from "./refereeRaceDayModels";
import { getRaceStatusMeta, statusChipClasses } from "../refereeUi";

type MonthRaceCalendarProps = {
  races: AssignedRace[];
  referenceDate: Date;
  onRaceSelect?: (race: AssignedRace) => void;
};

export function MonthRaceCalendar({ races, referenceDate, onRaceSelect }: MonthRaceCalendarProps) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = referenceDate.toLocaleDateString("en-US", { month: "long" });
  const today = new Date();

  return (
    <section aria-label="Month calendar" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Official calendar</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{monthName} {year}</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-500" /> Scheduled</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Checking</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Live</span>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-2">
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          const dayRaces = races.filter((race) => {
            const scheduledAt = new Date(race.scheduledAt);
            return scheduledAt.getFullYear() === year && scheduledAt.getMonth() === month && scheduledAt.getDate() === day;
          });

          return (
            <div className={`min-h-24 rounded-lg border p-2 ${isToday ? "border-[#007a68] bg-[#f0fbf7]" : "border-slate-200 bg-[#fbfdfe]"}`} key={day}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-600">{day}</span>
                {isToday ? (
                  <span className="rounded-md bg-[#007a68] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    Today
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {dayRaces.map((race) =>
                  onRaceSelect ? (
                    <button
                      aria-label={`Open ${race.code} ${race.name}`}
                      className={`min-h-11 rounded-md border px-2 py-2 text-left text-[10px] font-black transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] ${statusChipClasses(race.status)}`}
                      key={race.id}
                      onClick={() => onRaceSelect(race)}
                      type="button"
                    >
                      <span className="block">{race.code}</span>
                      <span className="mt-0.5 block font-bold normal-case tracking-normal">{getRaceStatusMeta(race.status).label}</span>
                    </button>
                  ) : (
                    <p className={`min-h-6 rounded-md border px-1.5 py-1 text-[10px] font-black ${statusChipClasses(race.status)}`} key={race.id}>
                      {race.code}
                    </p>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
