import { CalendarDays, Flag, MapPin, Timer, Trophy, X } from "lucide-react";

import type { JockeyRound } from "../jockeyWorkspaceData";

type RaceDetailDrawerProps = {
  round: JockeyRound | null;
  totalRounds: number;
  onClose: () => void;
};

function resultLabel(round: JockeyRound) {
  if (round.status !== "FINISHED") {
    return "Result TBD";
  }
  return `${round.position ?? "Placed"} - ${round.points ?? 0} pts`;
}

function statusLabel(round: JockeyRound) {
  if (round.status === "NEXT") return "Next Race";
  if (round.status === "FINISHED") return "Finished";
  if (round.status === "LOCKED") return "Locked";
  if (round.status === "CANCELLED") return "Cancelled";
  return "Upcoming";
}

function statusClass(round: JockeyRound) {
  if (round.status === "NEXT") return "border-amber-300 bg-amber-50 text-amber-800";
  if (round.status === "FINISHED") return "border-emerald-200 bg-emerald-50 text-[#006d5b]";
  if (round.status === "LOCKED") return "border-slate-200 bg-slate-100 text-slate-500";
  if (round.status === "CANCELLED") return "border-red-200 bg-red-50 text-red-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function RaceDetailDrawer({ round, totalRounds, onClose }: RaceDetailDrawerProps) {
  if (!round) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-0 sm:p-4" role="presentation">
      <section
        aria-label="Race detail"
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl shadow-slate-950/20 sm:rounded-lg"
        role="dialog"
      >
        <header className="border-b border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b]">
                Round {round.roundNumber} of {totalRounds}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{round.raceName}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-slate-500">{round.championshipId === "summer-2026" ? "Summer Championship 2026" : "Autumn Cup 2026"}</p>
                <span className={`rounded-md border px-2 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClass(round)}`}>
                  {statusLabel(round)}
                </span>
              </div>
            </div>
            <button
              aria-label="Close race detail"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d5b]"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="space-y-6 p-5">
          <dl className="grid gap-3 text-sm">
            {[
              { label: "Date", value: round.date, icon: CalendarDays },
              { label: "Time", value: round.time, icon: Timer },
              { label: "Track", value: round.track, icon: MapPin },
              { label: "Distance", value: round.distance, icon: Flag },
              { label: "Purse", value: round.purse, icon: Trophy },
              { label: "Surface", value: round.surface, icon: Flag },
            ].map((item) => (
              <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 px-3 py-2" key={item.label}>
                <dt className="flex items-center gap-2 font-bold text-slate-500">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="text-right font-black text-slate-950">{item.value}</dd>
              </div>
            ))}
          </dl>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-labelledby="race-ride-title">
            <h3 id="race-ride-title" className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
              Your Ride
            </h3>
            <p className="mt-3 text-xl font-black text-slate-950">{round.horse}</p>
            <p className="mt-1 text-sm font-bold text-slate-600">Stable: {round.stable}</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4" aria-labelledby="race-status-title">
            <h3 id="race-status-title" className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
              Status
            </h3>
            <div className="mt-4 grid grid-cols-5 gap-2 text-center text-[11px] font-black text-slate-500">
              {["Enrolled", "Accepted", "Committed", "Race Day", "Result"].map((step, index) => (
                <div key={step}>
                  <span
                    className={[
                      "mx-auto flex h-8 w-8 items-center justify-center rounded-full border",
                      index <= 2 || round.status === "FINISHED"
                        ? "border-[#006d5b] bg-[#006d5b] text-white"
                        : round.status === "NEXT" && index === 3
                          ? "border-amber-300 bg-amber-100 text-amber-800"
                          : "border-slate-200 bg-slate-100 text-slate-400",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <p className="mt-1">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#006d5b]/20 bg-emerald-50 p-4" aria-labelledby="race-result-title">
            <h3 id="race-result-title" className="text-sm font-black uppercase tracking-[0.14em] text-[#006d5b]">
              Result
            </h3>
            <p className="mt-2 text-xl font-black text-slate-950">{resultLabel(round)}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{round.note}</p>
          </section>
        </div>
      </section>
    </div>
  );
}
