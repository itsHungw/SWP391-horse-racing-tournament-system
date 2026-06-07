import { Link } from "react-router-dom";
import { AssignedRace } from "./refereeRaceDayModels";
import {
  formatRaceDate,
  formatRaceTime,
  getRaceAction,
  getRaceStatusMeta,
  statusChipClasses,
} from "../refereeUi";

export function RaceDetailDrawer({
  race,
  onClose,
}: {
  race: AssignedRace;
  onClose?: () => void;
}) {
  const action = getRaceAction(race);
  const meta = getRaceStatusMeta(race.status);
  const StatusIcon = meta.icon;

  return (
    <aside
      aria-label="Race details"
      className="race-day-drawer-motion fixed inset-x-3 bottom-24 top-20 z-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 xl:static xl:inset-auto xl:overflow-visible xl:rounded-xl xl:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Race day brief</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950 xl:text-xl">Race brief</h3>
        </div>
        {onClose ? (
          <button
            aria-label="Close race details"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true" className="text-lg leading-none">x</span>
          </button>
        ) : null}
      </div>
      <p className="mt-5 text-2xl font-black leading-tight text-slate-950 xl:text-lg">{race.name}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-black uppercase ${statusChipClasses(race.status)}`}>
          <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
          {meta.label}
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{race.code}</span>
      </div>

      <dl className="mt-6 space-y-3 border-y border-slate-100 py-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Date</dt><dd className="font-black text-slate-800">{formatRaceDate(race.scheduledAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Start time</dt><dd className="font-black text-slate-800">{formatRaceTime(race.scheduledAt)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Venue</dt><dd className="font-black text-slate-800">{race.venue}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Distance</dt><dd className="font-black text-slate-800">{race.distanceMeters}m</dd></div>
      </dl>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Next action</p>
        <p className="mt-2 text-base font-black text-slate-950">{action.label}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{action.helper}</p>
      </div>

      <Link
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#007a68] px-4 text-sm font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06145f]"
        to={action.to}
      >
        {action.label}
      </Link>
    </aside>
  );
}
