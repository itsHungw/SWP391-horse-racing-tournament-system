import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Flag,
  Play,
  ShieldCheck,
  User,
} from "lucide-react";
import { AssignedRace } from "./refereeRaceDayModels";
import { countRaceStatuses, getNextRace } from "../refereeUi";

type StewardDeskPanelProps = {
  races: AssignedRace[];
  now: Date;
  onSelectRace: (race: AssignedRace | undefined) => void;
};

export function StewardDeskPanel({ races, now, onSelectRace }: StewardDeskPanelProps) {
  const queue = countRaceStatuses(races);
  const nextRace = getNextRace(races, now);

  const todayFormatted = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const progressItems = [
    { label: "Checks Needed", count: queue.checks, color: "text-amber-600 bg-amber-50 border-amber-100", icon: ClipboardCheck },
    { label: "Ready Field", count: queue.ready, color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle2 },
    { label: "Live Control", count: queue.live, color: "text-rose-600 bg-rose-50 border-rose-100", icon: Play },
    { label: "Record Results", count: queue.results, color: "text-slate-600 bg-slate-50 border-slate-100", icon: Flag },
    { label: "Under Review", count: queue.review, color: "text-blue-600 bg-blue-50 border-blue-100", icon: AlertTriangle },
  ];

  return (
    <aside className="sticky top-6 hidden xl:block w-[360px] shrink-0 space-y-5">
      {/* Steward Info Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#007a68]">Steward desk</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eefbf7] text-[#007a68]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-950">Jonathan Whitmore</h4>
            <p className="text-xs font-semibold text-slate-500">Race Day Official</p>
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-semibold text-slate-500">
          <span>Duty Date</span>
          <span className="font-bold text-slate-700">{todayFormatted}</span>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Officiating Progress</h4>
        <div className="mt-4 space-y-3">
          {progressItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-600">
                  <Icon className="h-4 w-4 text-slate-400" />
                  {item.label}
                </span>
                <span className={`inline-flex h-6 w-8 items-center justify-center rounded-md border text-center font-black ${item.color}`}>
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Up Quick Action */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Next Up</h4>
        {nextRace ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <span className="inline-flex rounded bg-[#eefbf7] px-1.5 py-0.5 text-[10px] font-black uppercase text-[#007a68]">
                {new Date(nextRace.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <p className="mt-2 text-sm font-black text-slate-950 line-clamp-1">{nextRace.name}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{nextRace.venue} · {nextRace.distanceMeters}m</p>
            </div>
            <button
              onClick={() => onSelectRace(nextRace)}
              type="button"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-[#007a68] px-4 text-xs font-black text-white transition hover:bg-[#006f5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007a68]"
            >
              Jump to Next Race
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold text-slate-500">All duties complete for today.</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Quick Desk Links</h4>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
          <Link
            to="/referee/result-history"
            className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50 hover:text-slate-950 transition"
          >
            <ShieldCheck className="h-4 w-4 text-slate-400" />
            Reports
          </Link>
          <Link
            to="/referee/contracts"
            className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:bg-slate-50 hover:text-slate-950 transition"
          >
            <FileText className="h-4 w-4 text-slate-400" />
            Contracts
          </Link>
        </div>
      </div>
    </aside>
  );
}
