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
    <div className="mt-6 border-t border-white/10 pt-6">
      <h4 className="eyebrow text-emerald-soft">Community Choices · {isWinner ? "Winner Pick" : "Top 3 Pick"}</h4>
      <div className="mt-4 space-y-3">
        {sortedOptions.map((opt) => {
          const rate = isWinner ? opt.communityWinnerRate : opt.communityTop3Rate;
          if (rate === undefined || rate === null) return null;
          const percent = Math.round(rate * 100);

          return (
            <div key={opt.raceParticipantId} className="text-xs font-semibold text-ivory-dim">
              <div className="mb-1.5 flex items-center justify-between">
                <span>
                  <span className="font-data text-gold-300">#{opt.startNumber}</span> {opt.horseName}{" "}
                  <span className="text-ivory-faint">({opt.jockeyName})</span>
                </span>
                <span className="font-data font-semibold text-ivory">{percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-glow to-emerald-soft transition-all duration-500"
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
