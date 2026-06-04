import { AssignedRace } from "./refereeRaceDayModels";

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

  return (
    <section aria-label="Month calendar" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Assignment calendar</p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">{monthName} {year} Calendar</h3>
      <div className="mt-6 grid grid-cols-7 gap-2">
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dayRaces = races.filter((race) => {
            const scheduledAt = new Date(race.scheduledAt);
            return scheduledAt.getFullYear() === year && scheduledAt.getMonth() === month && scheduledAt.getDate() === day;
          });

          return (
            <div className="min-h-20 rounded-lg border border-slate-200 bg-[#fbfdfe] p-2" key={day}>
              <span className="text-xs font-black text-slate-500">{day}</span>
              <div className="mt-2 flex flex-col gap-1.5">
                {dayRaces.map((race) =>
                  onRaceSelect ? (
                    <button
                      aria-label={`Open ${race.code} ${race.name}`}
                      className="min-h-11 rounded bg-[#e8fbf4] px-2 py-2 text-left text-[10px] font-black text-[#007a68] transition hover:bg-[#d7f7ed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
                      key={race.id}
                      onClick={() => onRaceSelect(race)}
                      type="button"
                    >
                      {race.code}
                    </button>
                  ) : (
                    <p className="min-h-6 rounded bg-[#e8fbf4] px-1.5 py-1 text-[10px] font-black text-[#007a68]" key={race.id}>
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
