import { Lock, Medal, Timer, Trophy } from "lucide-react";

import type { JockeyRound } from "../jockeyWorkspaceData";

type ChampionshipTimelineProps = {
  rounds: JockeyRound[];
  label: string;
  onSelectRound: (round: JockeyRound) => void;
};

function statusMeta(round: JockeyRound) {
  if (round.status === "FINISHED") {
    return {
      label: `${round.position ?? "Finished"} - ${round.points ?? 0} pts`,
      icon: Medal,
      className: "border-emerald-200 bg-emerald-50 text-[#006d5b]",
    };
  }
  if (round.status === "NEXT") {
    return {
      label: "Featured Round",
      icon: Trophy,
      className: "border-amber-300 bg-amber-50 text-amber-800",
    };
  }
  if (round.status === "LOCKED") {
    return {
      label: "Locked",
      icon: Lock,
      className: "border-slate-200 bg-slate-100 text-slate-500",
    };
  }
  return {
    label: "Upcoming",
    icon: Timer,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  };
}

export function ChampionshipTimeline({ rounds, label, onSelectRound }: ChampionshipTimelineProps) {
  return (
    <div aria-label={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rounds.map((round) => {
          const meta = statusMeta(round);
          const isFeatured = round.status === "NEXT";
          return (
            <button
              aria-label={`${isFeatured ? "Featured " : ""}Round ${round.roundNumber} ${round.raceName} ${meta.label}`}
              className={[
                "group rounded-lg border text-left transition hover:-translate-y-0.5 hover:border-[#006d5b]/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]",
                isFeatured ? "min-h-56 p-5 md:col-span-2 xl:col-span-2 xl:row-span-2" : "min-h-36 p-4",
                isFeatured
                  ? "border-amber-300 bg-[#fff8ed] text-amber-900 shadow-lg shadow-amber-950/10"
                  : meta.className,
              ].join(" ")}
              key={round.id}
              onClick={() => onSelectRound(round)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">
                    {isFeatured ? "Featured Round" : "Round"} {round.roundNumber}
                  </p>
                  <p className={isFeatured ? "mt-3 text-3xl font-black tracking-tight text-slate-950" : "mt-2 text-lg font-black text-slate-950"}>
                    {round.raceName}
                  </p>
                </div>
                <span className={isFeatured ? "rounded-md bg-amber-200 p-3 text-amber-900 shadow-sm" : "rounded-md bg-white/75 p-2 shadow-sm"}>
                  <meta.icon className={isFeatured ? "h-6 w-6" : "h-4 w-4"} aria-hidden="true" />
                </span>
              </div>
              <p className={isFeatured ? "mt-6 text-base font-black uppercase tracking-[0.12em]" : "mt-4 text-sm font-black"}>
                {meta.label}
              </p>
              <p className={isFeatured ? "mt-3 text-sm font-black text-slate-700" : "mt-2 text-xs font-bold text-slate-600"}>
                {round.date} at {round.time}
              </p>
              <p className={isFeatured ? "mt-2 text-sm font-black text-slate-700" : "mt-1 text-xs font-bold text-slate-600"}>
                Your Ride: {round.horse}
              </p>
              {isFeatured && (
                <p className="mt-4 max-w-md text-sm font-bold leading-6 text-slate-600">
                  {round.note}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
