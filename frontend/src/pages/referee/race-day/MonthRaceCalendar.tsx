import { AssignedRace } from "./refereeRaceDayModels";

export function MonthRaceCalendar({ races, referenceDate }: { races: AssignedRace[]; referenceDate: Date }) {
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
              {dayRaces.map((race) => (
                <p className="mt-2 rounded bg-[#e8fbf4] px-1.5 py-1 text-[10px] font-black text-[#007a68]" key={race.id}>
                  {race.code}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
