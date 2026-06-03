import { Link } from "react-router-dom";
import { AssignedRace } from "./refereeRaceDayModels";
import { canOpenPreRaceCheck } from "./refereeRaceDayState";

export function RaceDetailDrawer({
  race,
  now,
  demoMode,
  onClose,
}: {
  race: AssignedRace;
  now: Date;
  demoMode: boolean;
  onClose?: () => void;
}) {
  const unlocked = canOpenPreRaceCheck(race.scheduledAt, now, demoMode);

  return (
    <aside aria-label="Race details" className="race-day-drawer-motion rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Selected assignment</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Race Details</h3>
        </div>
        {onClose ? (
          <button
            aria-label="Close race details"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : null}
      </div>
      <p className="mt-5 text-lg font-black leading-tight text-slate-950">{race.name}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{race.code}</p>

      <dl className="mt-6 space-y-3 border-y border-slate-100 py-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Venue</dt><dd className="font-black text-slate-800">{race.venue}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Distance</dt><dd className="font-black text-slate-800">{race.distanceMeters}m</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd className="font-black text-[#007a68]">{race.status}</dd></div>
      </dl>

      <Link
        aria-disabled={!unlocked}
        className={`mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f] ${
          unlocked
            ? "bg-[#007a68] text-white hover:bg-[#006f5f]"
            : "pointer-events-none bg-slate-200 text-slate-500"
        }`}
        tabIndex={unlocked ? 0 : -1}
        to={`/referee/races/${race.id}/officiate`}
      >
        Open Pre-Race Check
      </Link>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Production guard: available on race day within 60 minutes of the scheduled start.
      </p>
    </aside>
  );
}
