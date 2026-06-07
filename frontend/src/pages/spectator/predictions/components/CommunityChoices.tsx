import { ParticipantOption } from "../types/prediction.types";

interface CommunityChoicesProps {
  options: ParticipantOption[];
  predictionType: "WINNER" | "TOP3";
}

export function CommunityChoices({ options, predictionType }: CommunityChoicesProps) {
  const isWinner = predictionType === "WINNER";
  
  const sortedOptions = [...options].sort((a, b) => {
    const rateA = isWinner ? (a.communityWinnerRate ?? 0) : (a.communityTop3Rate ?? 0);
    const rateB = isWinner ? (b.communityWinnerRate ?? 0) : (b.communityTop3Rate ?? 0);
    return rateB - rateA;
  });

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <h4 className="text-xs font-black uppercase tracking-[0.16em] text-[#006d5b] mb-4">
        Community Choices ({isWinner ? "Winner Pick" : "Top 3 Pick"})
      </h4>
      <div className="space-y-3">
        {sortedOptions.map((opt) => {
          const rate = isWinner ? opt.communityWinnerRate : opt.communityTop3Rate;
          if (rate === undefined || rate === null) return null;
          const percent = Math.round(rate * 100);
          
          return (
            <div key={opt.raceParticipantId} className="text-xs font-bold text-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span>
                  #{opt.startNumber} {opt.horseName} ({opt.jockeyName})
                </span>
                <span className="font-black text-slate-900">{percent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#006d5b] to-[#004d3d] rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
