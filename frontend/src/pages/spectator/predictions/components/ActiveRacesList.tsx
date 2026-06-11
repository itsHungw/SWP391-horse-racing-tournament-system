import { useEffect, useState } from "react";
import { Calendar, Users } from "lucide-react";
import { OpenRacePrediction } from "../types/prediction.types";

interface ActiveRacesListProps {
  races: OpenRacePrediction[];
  selectedRace: OpenRacePrediction | null;
  onSelectRace: (race: OpenRacePrediction) => void;
}

function CountdownText({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function updateCountdown() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Closed");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(hours > 0 ? `Closes in ${hours}h ${minutes}m` : `Closes in ${minutes}m`);
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-data font-semibold text-gold-300">{timeLeft}</span>;
}

export function ActiveRacesList({ races, selectedRace, onSelectRace }: ActiveRacesListProps) {
  return (
    <div className="space-y-4">
      <h2 className="eyebrow text-emerald-soft">Open Races</h2>
      {races.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-turf-900 p-8 text-center text-sm font-semibold text-ivory-dim">
          There are currently no races open for prediction.
        </div>
      ) : (
        races.map((race) => {
          const isSelected = selectedRace?.raceId === race.raceId;
          const userPredicted = race.predictedByUser.hasPredicted;
          return (
            <button
              key={race.raceId}
              onClick={() => onSelectRace(race)}
              className={`w-full cursor-pointer rounded-2xl border p-5 text-left transition-all duration-300 ${
                isSelected
                  ? "border-gold-400/60 bg-gradient-to-b from-turf-800 to-turf-950 shadow-[0_24px_60px_-30px_rgba(212,175,55,0.4)]"
                  : "border-white/8 bg-turf-900 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-data text-[10px] uppercase tracking-[0.16em] text-ivory-dim">
                  {race.roundName || "Qualifiers"}
                </span>
                {userPredicted && (
                  <span className="rounded-full border border-emerald-glow/40 bg-emerald-glow/10 px-2.5 py-0.5 font-data text-[10px] uppercase tracking-[0.16em] text-emerald-soft">
                    Submitted
                  </span>
                )}
              </div>

              <h3 className="mt-3 font-display text-xl font-medium tracking-tight text-ivory">{race.raceName}</h3>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ivory-faint">
                {race.tournamentName}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/8 pt-4 text-xs font-semibold text-ivory-dim">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gold-400/70" />
                  {new Date(race.raceAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {new Date(race.raceAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <p className="flex items-center justify-end gap-1.5 text-right">
                  <Users className="h-3.5 w-3.5 text-gold-400/70" />
                  {race.totalPredictions} predictions
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-gold-600/25 bg-gold-400/5 px-3 py-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 font-data uppercase tracking-[0.14em] text-gold-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-soft live-pulse" />
                  Prediction Open
                </span>
                <CountdownText targetDate={race.raceAt} />
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
