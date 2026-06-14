import { ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";

import type { RaceSummary } from "../../../types/racing";
import { groupRacesByTimeSlot } from "../racingDiscovery";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function RaceDayPanel({ day, races, onClose }: { day: string; races: RaceSummary[]; onClose: () => void }) {
  const groups = races.length > 8 ? groupRacesByTimeSlot(races) : [{ key: day, label: "Race Card", races }];
  return (
    <aside className="race-day-drawer-motion fixed inset-x-0 bottom-0 z-[70] max-h-[82vh] overflow-y-auto border-t border-gold-400/35 bg-turf-950 p-6 shadow-2xl md:inset-y-0 md:left-auto md:w-[440px] md:border-l md:border-t-0 md:p-8" aria-label={`Races on ${day}`}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="eyebrow text-gold-300">Selected Day</p>
          <h2 className="mt-3 font-display text-3xl font-light text-ivory">
            {new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${day}T12:00:00`))}
          </h2>
        </div>
        <button type="button" aria-label="Close day panel" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 text-ivory hover:border-gold-400/60">
          <X size={18} />
        </button>
      </div>
      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.key}>
            <h3 className="font-data text-[10px] uppercase tracking-[0.22em] text-ivory-faint">{group.label}</h3>
            <div className="mt-3 divide-y divide-white/10 border-y border-white/10">
              {group.races.map((race) => (
                <article key={race.id} className="py-4">
                  <p className="font-data text-xs text-gold-300">{formatTime(race.raceDateTime)}</p>
                  <h4 className="mt-1 font-display text-xl font-medium text-ivory">{race.name}</h4>
                  <p className="mt-1 text-xs text-ivory-faint">{race.tournamentName}</p>
                  <div className="mt-3 flex gap-4">
                    {race.predictionOpen ? <Link to={`/spectator/predictions?raceId=${race.id}`} className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-soft">Predict</Link> : null}
                    <Link to={`/races/${race.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-gold-300">Race Card <ArrowRight size={12} /></Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
