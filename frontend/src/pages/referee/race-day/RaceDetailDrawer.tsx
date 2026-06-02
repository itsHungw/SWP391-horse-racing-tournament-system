import { Link } from "react-router-dom";
import { AssignedRace } from "./refereeRaceDayModels";
import { canOpenPreRaceCheck } from "./refereeRaceDayState";

export function RaceDetailDrawer({ race, now, demoMode }: { race: AssignedRace; now: Date; demoMode: boolean }) {
  const unlocked = canOpenPreRaceCheck(race.scheduledAt, now, demoMode);

  return (
    <aside aria-label="Race details" className="race-day-drawer-motion rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Selected assignment</p>
      <h3 className="mt-2 text-xl font-black text-slate-950">Race Details</h3>
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
