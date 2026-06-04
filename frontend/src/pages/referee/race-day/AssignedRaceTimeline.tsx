import { AssignedRace } from "./refereeRaceDayModels";

type AssignedRaceTimelineProps = {
  races: AssignedRace[];
  now: Date;
  selectedRaceId?: number;
  onSelectRace: (race: AssignedRace) => void;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(scheduledAt: string, now: Date) {
  const minutes = Math.ceil((new Date(scheduledAt).getTime() - now.getTime()) / 60_000);

  if (minutes <= 0) {
    return "Race window active";
  }

  if (minutes < 60) {
    return `Starts in ${minutes}m`;
  }

  return `Starts in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function statusClasses(status: string) {
  if (status === "ONGOING") {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }

  if (status === "FINISHED" || status === "RESULT_SUBMITTED") {
    return "border-slate-200 bg-slate-100 text-slate-500";
  }

  return "border-sky-200 bg-sky-50 text-sky-800";
}

export function AssignedRaceTimeline({
  races,
  now,
  selectedRaceId,
  onSelectRace,
}: AssignedRaceTimelineProps) {
  const sortedRaces = [...races].sort(
    (left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()
  );

  return (
    <section aria-label="Assigned race timeline" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Daily steward schedule</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Today&apos;s Race Timeline</h3>
        </div>
        <p className="text-xs font-bold text-slate-500">{sortedRaces.length} assigned heats</p>
      </div>

      <div className="relative mt-6 space-y-4 pl-20 before:absolute before:bottom-2 before:left-[4.4rem] before:top-2 before:w-px before:bg-slate-200">
        <div aria-hidden="true" className="relative -ml-20 flex items-center gap-3 py-1">
          <span className="w-16 text-right text-[10px] font-black uppercase tracking-wider text-rose-600">Now</span>
          <span className="h-3 w-3 rounded-full border-2 border-white bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]" />
          <span className="h-px flex-1 bg-rose-300" />
        </div>

        {sortedRaces.map((race) => (
          <div className="relative" key={race.id}>
            <span className="absolute -left-20 top-4 w-14 text-right text-xs font-black text-slate-500">
              {formatTime(race.scheduledAt)}
            </span>
            <span className="absolute -left-[0.95rem] top-5 h-3 w-3 rounded-full border-2 border-white bg-[#007a68] shadow-[0_0_0_3px_rgba(0,122,104,0.16)]" />
            <button
              aria-pressed={selectedRaceId === race.id}
              className={`w-full rounded-xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] ${
                selectedRaceId === race.id
                  ? "border-[#007a68] bg-[#eefbf7] shadow-sm"
                  : "border-slate-200 bg-white"
              }`}
              onClick={() => onSelectRace(race)}
              type="button"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-slate-950">{race.name}</strong>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${statusClasses(race.status)}`}>
                  {race.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <span>{race.venue}</span>
                <span>{race.distanceMeters}m</span>
                <span className="text-[#007a68]">{formatCountdown(race.scheduledAt, now)}</span>
              </div>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
