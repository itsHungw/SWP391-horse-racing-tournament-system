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
      
      if (hours > 0) {
        setTimeLeft(`Closes in ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`Closes in ${minutes}m`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-bold text-amber-700">{timeLeft}</span>;
}

export function ActiveRacesList({ races, selectedRace, onSelectRace }: ActiveRacesListProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b] mb-4">
        Open Races
      </h2>
      {races.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 font-bold">
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
              className={`w-full text-left rounded-lg border p-5 transition shadow-sm bg-white cursor-pointer ${
                isSelected 
                  ? "border-[#006d5b] ring-2 ring-[#006d5b]/10" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider">
                  {race.roundName || "Qualifiers"}
                </span>
                {userPredicted && (
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider">
                    Submitted
                  </span>
                )}
              </div>
              
              <h3 className="mt-3 text-lg font-black text-slate-950">{race.raceName}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">
                {race.tournamentName}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 opacity-60" />
                  {new Date(race.raceAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })} · {new Date(race.raceAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  })}
                </p>
                <p className="flex items-center gap-1.5 text-right justify-end">
                  <Users className="h-3.5 w-3.5 opacity-60" />
                  {race.totalPredictions} predictions
                </p>
              </div>
              
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded px-3 py-1.5 text-[11px] flex justify-between items-center">
                <span className="font-black text-amber-800 uppercase tracking-wide">Prediction Open</span>
                <CountdownText targetDate={race.raceAt} />
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
