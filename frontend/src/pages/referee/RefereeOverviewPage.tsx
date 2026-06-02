import { useCallback, useEffect, useMemo, useState } from "react";
import { getAssignedRaces } from "../../api/refereeApi";
import { AssignedRaceTimeline } from "./race-day/AssignedRaceTimeline";
import { MonthRaceCalendar } from "./race-day/MonthRaceCalendar";
import { RaceDetailDrawer } from "./race-day/RaceDetailDrawer";
import { normalizeAssignedRace } from "./race-day/refereeRaceDayAdapter";
import { AssignedRace } from "./race-day/refereeRaceDayModels";

interface RefereeOverviewPageProps {
  mode?: "all" | "check" | "results" | "reports";
  now?: Date;
}

const modeCopy = {
  all: ["Assigned Race Desk", "Race-Day Operations"],
  check: ["Pre-Race Verification", "Pre-Race Checks"],
  results: ["Results Desk", "Submit Results"],
  reports: ["Incident Review", "Reports & Violations"],
} as const;

export function RefereeOverviewPage({ mode = "all", now }: RefereeOverviewPageProps) {
  const referenceNow = useMemo(() => now ?? new Date(), [now]);
  const [races, setRaces] = useState<AssignedRace[]>([]);
  const [selectedRace, setSelectedRace] = useState<AssignedRace>();
  const [view, setView] = useState<"timeline" | "month">("timeline");
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [queueLabel, title] = modeCopy[mode];

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
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Track today&apos;s assignments, inspect race cards, and open the safety workflow when its operational guard allows.
          </p>
        </div>

        <label className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-xs font-black ${
          demoMode ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600"
        }`}>
          <span>{demoMode ? "Demo Mode Active - Time Guard Bypassed" : "Production Mode"}</span>
          <button
            aria-checked={demoMode}
            aria-label="Demo mode"
            className={`relative h-7 w-12 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f] ${
              demoMode ? "bg-amber-500" : "bg-slate-300"
            }`}
            onClick={() => setDemoMode((value) => !value)}
            role="switch"
            type="button"
          >
            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${demoMode ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </label>
      </header>

      <div className="mt-7 flex flex-wrap gap-2">
        <button
          aria-pressed={view === "timeline"}
          className={`min-h-11 rounded-md px-4 text-sm font-black ${view === "timeline" ? "bg-[#007a68] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          onClick={() => setView("timeline")}
          type="button"
        >
          Day timeline
        </button>
        <button
          aria-pressed={view === "month"}
          className={`min-h-11 rounded-md px-4 text-sm font-black ${view === "month" ? "bg-[#007a68] text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          onClick={() => setView("month")}
          type="button"
        >
          Month calendar
        </button>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {view === "timeline" ? (
          <AssignedRaceTimeline races={races} now={referenceNow} onSelectRace={setSelectedRace} selectedRaceId={selectedRace?.id} />
        ) : (
          <MonthRaceCalendar races={races} referenceDate={referenceNow} />
        )}
        {selectedRace ? (
          <RaceDetailDrawer demoMode={demoMode} now={referenceNow} race={selectedRace} />
        ) : (
          <aside className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-500">
            Select a timeline card to inspect the assigned race and check its pre-race activation guard.
          </aside>
        )}
      </div>
    </div>
  );
}
