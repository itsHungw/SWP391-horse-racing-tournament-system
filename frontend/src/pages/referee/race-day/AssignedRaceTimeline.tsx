import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
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
  onSelectRace: (race: AssignedRace | undefined) => void;
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
                    <div
                      key={race.id}
                      className={`grid w-full gap-4 rounded-lg border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                        selectedRaceId === race.id
                          ? "border-[#007a68] bg-[#eefbf7] shadow-sm"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left focus-visible:outline-none"
                        onClick={() => onSelectRace(selectedRaceId === race.id ? undefined : race)}
                        aria-expanded={selectedRaceId === race.id}
                        aria-controls={`race-detail-${race.id}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 min-w-0 flex-1">
                          {/* Date and time info section (left side) */}
                          <div className="flex w-fit items-center gap-3 sm:block sm:w-auto shrink-0">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{dateToken.month}</p>
                              <p className="text-2xl font-black leading-none text-slate-950">{dateToken.day}</p>
                            </div>
                            <p className="text-xs font-black text-slate-500 sm:mt-2 sm:text-center">{formatRaceTime(race.scheduledAt)}</p>
                          </div>

                          {/* Name and status chip (right side) */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="text-sm text-slate-950">{race.name}</strong>
                              <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase ${statusChipClasses(race.status)}`}>
                                {meta.label}
                              </span>
                            </div>
                            {/* Collapsed label for next action */}
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Next: <span className="font-black text-slate-700">{action.label}</span>
                            </p>
                          </div>
                        </div>

                        {/* Rotating ChevronDown icon */}
                        <ChevronDown
                          className={`h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                            selectedRaceId === race.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Collapsible details container */}
                      <div
                        id={`race-detail-${race.id}`}
                        role="region"
                        className={`accordion-wrapper overflow-hidden ${
                          selectedRaceId === race.id ? "expanded" : ""
                        }`}
                      >
                        {selectedRaceId === race.id && (
                          <div className="accordion-content">
                            <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
                              {/* Key-Value details grid (like the original drawer) */}
                              <dl className="grid grid-cols-2 gap-3 text-xs border-b border-slate-100 pb-4">
                                <div>
                                  <dt className="text-slate-500">Date</dt>
                                  <dd className="font-black text-slate-800">{formatRaceDate(race.scheduledAt)}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Start time</dt>
                                  <dd className="font-black text-slate-800">{formatRaceTime(race.scheduledAt)}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Venue</dt>
                                  <dd className="font-black text-slate-800">{race.venue}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Distance</dt>
                                  <dd className="font-black text-slate-800">{race.distanceMeters}m</dd>
                                </div>
                              </dl>

                              {/* Action brief details */}
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Next action</p>
                                <p className="mt-1 text-sm font-black text-slate-950">{action.label}</p>
                                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{action.helper}</p>
                              </div>

                              {/* Action link styled as button */}
                              <Link
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#007a68] px-4 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
                                to={action.to}
                              >
                                {action.label}
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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
