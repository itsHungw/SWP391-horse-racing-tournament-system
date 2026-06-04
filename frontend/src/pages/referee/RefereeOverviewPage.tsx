import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAssignedRaces } from "../../api/refereeApi";
import { AssignedRaceTimeline } from "./race-day/AssignedRaceTimeline";
import { MonthRaceCalendar } from "./race-day/MonthRaceCalendar";
import { RaceDetailDrawer } from "./race-day/RaceDetailDrawer";
import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
import { AssignedRace } from "./race-day/refereeRaceDayModels";
import { countRaceStatuses } from "./refereeUi";

interface RefereeOverviewPageProps {
  mode?: "all" | "check" | "results" | "reports";
  now?: Date;
}

const modeCopy = {
  all: ["Assigned races", "Race Desk"],
  check: ["Race control", "Active Operations"],
  results: ["Result packages", "Submit Results"],
  reports: ["Incident review", "Reports and Incidents"],
} as const;

export function RefereeOverviewPage({ mode = "all", now }: RefereeOverviewPageProps) {
  const referenceNow = useMemo(() => now ?? new Date(), [now]);
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<AssignedRace>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"queue" | "calendar">("queue");
  const raceIdParam = searchParams.get("raceId");
  const [queueLabel, title] = modeCopy[mode];
  const queue = countRaceStatuses(races);

  const loadRaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const data = await getAssignedRaces();
      setRaces(data.map((race) => normalizeAssignedRace(race, referenceNow)));
    } catch {
      setError("Unable to load assigned races.");
    } finally {
      setLoading(false);
    }
  }, [referenceNow]);

  useEffect(() => {
    void loadRaces();
  }, [loadRaces]);

  useEffect(() => {
    if (!raceIdParam || races.length === 0) {
      return;
    }

    const raceId = Number(raceIdParam);
    if (!Number.isFinite(raceId)) {
      return;
    }

    const matchingRace = races.find((race) => race.id === raceId);
    if (matchingRace) {
      setSelectedRace(matchingRace);
    }
  }, [raceIdParam, races]);

  const handleSelectRace = useCallback(
    (race: AssignedRace) => {
      setSelectedRace(race);
      if (raceIdParam) {
        setSearchParams({}, { replace: true });
      }
    },
    [raceIdParam, setSearchParams]
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedRace(undefined);
    if (raceIdParam) {
      setSearchParams({}, { replace: true });
    }
  }, [raceIdParam, setSearchParams]);

  if (loading) {
    return (
      <div className="max-w-[1486px]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006f5f]">Preparing steward assignments</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="h-16 rounded-lg bg-slate-100" />
            <div className="h-16 rounded-lg bg-slate-100" />
            <div className="h-16 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1486px] rounded-xl border border-rose-200 bg-rose-50 p-6" role="alert">
        <p className="font-black text-rose-800">{error}</p>
        <button className="mt-4 min-h-11 rounded-md bg-rose-700 px-5 text-sm font-black text-white" onClick={() => void loadRaces()} type="button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1486px]">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006f5f]">{queueLabel}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
            Work through assigned race cards as operational items. Open the race that needs checks, live control, results, or incident reporting.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            ["Checks", queue.checks],
            ["Ready", queue.ready],
            ["Live", queue.live],
            ["Results", queue.results],
            ["Review", queue.review],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-center shadow-sm sm:px-4" key={String(label)}>
              <p className="text-2xl font-black text-slate-950">{value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-950">Assigned Races View</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Use queue for work, calendar for date planning.</p>
        </div>
        <div className="grid w-full grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:inline-flex sm:w-auto">
          {[
            ["queue", "Work Queue"],
            ["calendar", "Calendar"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key as "queue" | "calendar")}
              className={`min-h-10 rounded-md px-4 text-sm font-black transition ${
                viewMode === key ? "bg-white text-[#007a68] shadow-sm" : "text-slate-600 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {viewMode === "queue" ? (
          <AssignedRaceTimeline races={races} now={referenceNow} onSelectRace={handleSelectRace} selectedRaceId={selectedRace?.id} />
        ) : (
          <MonthRaceCalendar races={races} referenceDate={referenceNow} onRaceSelect={handleSelectRace} />
        )}
        {selectedRace ? (
          <RaceDetailDrawer onClose={handleCloseDrawer} race={selectedRace} />
        ) : (
          <aside className="hidden rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-500 xl:block">
            Select a race card to inspect the assignment brief and continue the next officiating action.
          </aside>
        )}
      </div>
    </div>
  );
}
