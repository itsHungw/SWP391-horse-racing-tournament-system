import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OpenRacePrediction } from "../types/prediction.types";
import { getRaceTimelineStatus } from "../predictionCockpitUtils";

interface RaceTimelineProps {
  races: OpenRacePrediction[];
  selectedRace: OpenRacePrediction | null;
  selectedPredictionOpen?: boolean;
  onSelectRace: (race: OpenRacePrediction) => void;
}

function formatRaceTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Time TBD";
  }

  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function RaceTimeline({ races, selectedRace, selectedPredictionOpen, onSelectRace }: RaceTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sortedRaces = [...races].sort((a, b) => new Date(a.raceAt).getTime() - new Date(b.raceAt).getTime());
  const scrollBy = (direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
  };

  return (
    <section aria-label="Race timeline" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-extrabold uppercase tracking-wide text-ivory">Today's Races</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="grid h-7 w-7 place-items-center rounded-full bg-turf-850 text-ivory-dim transition-colors hover:bg-turf-800 hover:text-ivory"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="grid h-7 w-7 place-items-center rounded-full bg-turf-850 text-ivory-dim transition-colors hover:bg-turf-800 hover:text-ivory"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sortedRaces.length === 0 ? (
        <div className="rounded-xl border border-turf-700 bg-turf-900 px-5 py-6 text-sm font-semibold text-ivory-dim">
          There are currently no races available for prediction.
        </div>
      ) : (
        <div className="relative rounded-xl border border-turf-800 bg-turf-900/50 p-1.5 backdrop-blur-sm">
          <div
            ref={scrollerRef}
            className="flex gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sortedRaces.map((race, index) => {
              const active = selectedRace?.raceId === race.raceId;
              const status = getRaceTimelineStatus(race, active ? selectedPredictionOpen : undefined);

              return (
                <button
                  key={race.raceId}
                  type="button"
                  onClick={() => onSelectRace(race)}
                  aria-current={active ? "true" : undefined}
                  aria-label={`${race.raceName} ${status.label} ${formatRaceTime(race.raceAt)}`}
                  className={`group relative min-w-[140px] shrink-0 rounded-lg p-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 ${
                    active
                      ? "border border-gold-400/40 bg-gradient-to-br from-[#d4af37]/15 to-[#ffd700]/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                      : "border border-transparent bg-turf-850 hover:bg-turf-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-[12px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                        active ? "text-gold-300" : "text-ivory-dim group-hover:text-ivory"
                      }`}
                    >
                      {race.raceName || `Race ${index + 1}`}
                    </span>
                    {(status.tone === "success" || status.tone === "warning") && (
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                            status.tone === "success" ? "bg-emerald-glow" : "bg-amber-400"
                          }`}
                        />
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${
                            status.tone === "success" ? "bg-emerald-soft" : "bg-amber-400"
                          }`}
                        />
                      </span>
                    )}
                  </div>

                  <div
                    className={`mt-2 flex items-center justify-between font-data text-[11px] font-semibold transition-colors ${
                      active ? "text-ivory" : "text-ivory-faint"
                    }`}
                  >
                    <span>{formatRaceTime(race.raceAt)}</span>
                    <span className="opacity-80">{status.label}</span>
                  </div>

                  {active && (
                    <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-lg bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-80" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
