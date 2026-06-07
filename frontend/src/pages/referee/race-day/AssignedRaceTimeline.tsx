import { AssignedRace } from "./refereeRaceDayModels";
import {
  formatRaceDate,
  formatRaceTime,
  getRaceAction,
  getRaceStatusMeta,
  statusChipClasses,
} from "../refereeUi";

type AssignedRaceTimelineProps = {
  races: AssignedRace[];
  now: Date;
  selectedRaceId?: number;
  onSelectRace: (race: AssignedRace) => void;
};

const actionStatuses = new Set(["CHECKING", "READY", "ONGOING", "FINISHED", "RESULT_SUBMITTED"]);
const completedStatuses = new Set(["RESULT_CONFIRMED", "PUBLISHED"]);

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function isTodayOrPast(scheduledAt: string, now: Date) {
  return startOfDay(new Date(scheduledAt)) <= startOfDay(now);
}

function formatNaturalSchedule(scheduledAt: string, now: Date) {
  const scheduledDate = new Date(scheduledAt);
  const dayDiff = Math.round((startOfDay(scheduledDate) - startOfDay(now)) / 86_400_000);
  const time = formatRaceTime(scheduledAt);

  if (dayDiff === 0) {
    return `Today at ${time}`;
  }

  if (dayDiff === 1) {
    return `Tomorrow at ${time}`;
  }

  if (dayDiff > 1 && dayDiff <= 6) {
    return `In ${dayDiff} days at ${time}`;
  }

  if (dayDiff === -1) {
    return `Yesterday at ${time}`;
  }

  if (dayDiff < -1) {
    return `${Math.abs(dayDiff)} days ago at ${time}`;
  }

  return `${formatRaceDate(scheduledAt)} at ${time}`;
}

function getDateToken(scheduledAt: string) {
  const date = new Date(scheduledAt);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
  };
}

function splitQueue(races: AssignedRace[], now: Date) {
  const needsAction = races.filter(
    (race) =>
      !completedStatuses.has(race.status) &&
      (actionStatuses.has(race.status) || (race.status === "SCHEDULED" && isTodayOrPast(race.scheduledAt, now)))
  );
  const completed = races.filter((race) => completedStatuses.has(race.status));
  const upcoming = races.filter((race) => !needsAction.includes(race) && !completed.includes(race));

  return [
    {
      title: "Needs action",
      helper: "Race cards that should be opened and worked next.",
      races: needsAction,
      empty: "No race card needs action right now.",
    },
    {
      title: "Upcoming",
      helper: "Assigned races scheduled for future race days.",
      races: upcoming,
      empty: "No upcoming assigned races.",
    },
    {
      title: "Completed",
      helper: "Confirmed races kept here for quick review.",
      races: completed,
      empty: "No confirmed race packages yet.",
    },
  ];
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
  const queueSections = splitQueue(sortedRaces, now);

  return (
    <section aria-label="Assigned race queue" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Operational queue</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Assigned race queue</h3>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Race assignments are grouped by operational state, not drawn as a single-day timeline.
          </p>
        </div>
        <p className="text-xs font-bold text-slate-500">{sortedRaces.length} assigned races</p>
      </div>

      <div className="mt-6 space-y-6">
        {queueSections.map((section) => (
          <div key={section.title}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">{section.title}</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">{section.helper}</p>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600">
                {section.races.length}
              </span>
            </div>

            {section.races.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                {section.empty}
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {section.races.map((race) => {
                  const meta = getRaceStatusMeta(race.status);
                  const action = getRaceAction(race);
                  const dateToken = getDateToken(race.scheduledAt);

                  return (
                    <button
                      aria-pressed={selectedRaceId === race.id}
                      className={`grid w-full gap-4 rounded-lg border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68] sm:grid-cols-[72px_minmax(0,1fr)] ${
                        selectedRaceId === race.id
                          ? "border-[#007a68] bg-[#eefbf7] shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                      key={race.id}
                      onClick={() => onSelectRace(race)}
                      type="button"
                    >
                      <div className="flex w-fit items-center gap-3 sm:block sm:w-auto">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{dateToken.month}</p>
                          <p className="text-2xl font-black leading-none text-slate-950">{dateToken.day}</p>
                        </div>
                        <p className="text-xs font-black text-slate-500 sm:mt-2 sm:text-center">{formatRaceTime(race.scheduledAt)}</p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm text-slate-950">{race.name}</strong>
                          <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase ${statusChipClasses(race.status)}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                          <span>{formatNaturalSchedule(race.scheduledAt, now)}</span>
                          <span>{race.venue}</span>
                          <span>{race.distanceMeters}m</span>
                        </div>
                        <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="text-xs font-black text-slate-950">{action.label}</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{action.helper}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
