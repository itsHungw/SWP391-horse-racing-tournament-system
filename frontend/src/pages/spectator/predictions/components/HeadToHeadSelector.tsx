import React from "react";
import { Check } from "lucide-react";
import type { HeadToHeadMatchup, ParticipantOption } from "../types/prediction.types";
import { formatBib, getBibClass } from "../predictionCockpitUtils";

interface Props {
  matchups: HeadToHeadMatchup[];
  participants: ParticipantOption[];
  selectedWinnerId: number | null;
  onSelectWinner: (horseId: number) => void;
  disabled?: boolean;
}

export function HeadToHeadSelector({ matchups, participants, selectedWinnerId, onSelectWinner, disabled }: Props) {
  if (!matchups || matchups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-ivory-dim border border-turf-800 rounded-lg bg-turf-900/50">
        <p>No Head-to-Head matchups available for this race.</p>
      </div>
    );
  }

  const getParticipant = (id: number) => participants.find((p) => p.raceParticipantId === id);

  return (
    <div className="space-y-4 mt-4">
      {matchups.map((matchup, idx) => {
        const pA = getParticipant(matchup.participantAId);
        const pB = getParticipant(matchup.participantBId);
        if (!pA || !pB) return null;

        const isASelected = selectedWinnerId === pA.raceParticipantId;
        const isBSelected = selectedWinnerId === pB.raceParticipantId;

        return (
          <div key={idx} className="bg-turf-900 rounded-lg border border-turf-800 overflow-hidden shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]">
            <div className="px-4 py-2.5 flex justify-between items-center text-[11px] text-turf-950 font-extrabold tracking-[0.16em] uppercase bg-[linear-gradient(90deg,#b8912b_0%,#e8cd7e_25%,#f5edc6_50%,#e8cd7e_75%,#b8912b_100%)] bg-[length:200%_auto] animate-[foil-pan_4s_linear_infinite_reverse] border-b border-[#8f6f1f] shadow-inner">
              <span>Matchup #{idx + 1}</span>
              <span>H2H Handicap</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-turf-800">
              {/* Participant A */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectWinner(pA.raceParticipantId)}
                className={`p-4 flex flex-col transition-colors text-left relative group ${
                  isASelected
                    ? "bg-gold-400/10 hover:bg-gold-400/20"
                    : "hover:bg-turf-850"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {isASelected && (
                  <div className="absolute top-4 right-4 text-gold-400">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`grid w-8 h-8 place-items-center rounded-sm font-data text-sm font-bold shadow-md ${getBibClass(formatBib(pA.startNumber, pA.laneNumber))}`}>
                    {formatBib(pA.startNumber, pA.laneNumber)}
                  </div>
                  <div>
                    <h4 className={`font-semibold flex items-center gap-2 ${isASelected ? 'text-gold-300' : 'text-ivory'}`}>
                      {pA.horseName}
                    </h4>
                    <p className="text-xs text-ivory-dim">{pA.jockeyName}</p>
                  </div>
                </div>
                <div className="mt-auto pt-2 flex justify-between items-end w-full">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-ivory-faint">HDP</span>
                    <span className={`font-data text-sm font-bold ${matchup.handicapSeconds > 0 ? 'text-rose-400' : matchup.handicapSeconds < 0 ? 'text-emerald-soft' : 'text-ivory-dim'}`}>
                      {matchup.handicapSeconds === 0 ? "0" : matchup.handicapSeconds > 0 ? `-${matchup.handicapSeconds.toFixed(2)}` : `+${(-matchup.handicapSeconds).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-ivory-faint">Odds</span>
                    <span className={`text-lg font-data font-extrabold ${isASelected ? 'text-gold-300' : 'text-emerald-soft'}`}>
                      {matchup.oddsA.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>

              {/* Participant B */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectWinner(pB.raceParticipantId)}
                className={`p-4 flex flex-col transition-colors text-left relative group ${
                  isBSelected
                    ? "bg-gold-400/10 hover:bg-gold-400/20"
                    : "hover:bg-turf-850"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {isBSelected && (
                  <div className="absolute top-4 right-4 text-gold-400">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`grid w-8 h-8 place-items-center rounded-sm font-data text-sm font-bold shadow-md ${getBibClass(formatBib(pB.startNumber, pB.laneNumber))}`}>
                    {formatBib(pB.startNumber, pB.laneNumber)}
                  </div>
                  <div>
                    <h4 className={`font-semibold flex items-center gap-2 ${isBSelected ? 'text-gold-300' : 'text-ivory'}`}>
                      {pB.horseName}
                    </h4>
                    <p className="text-xs text-ivory-dim">{pB.jockeyName}</p>
                  </div>
                </div>
                <div className="mt-auto pt-2 flex justify-between items-end w-full">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-ivory-faint">HDP</span>
                    <span className={`font-data text-sm font-bold ${matchup.handicapSeconds < 0 ? 'text-rose-400' : matchup.handicapSeconds > 0 ? 'text-emerald-soft' : 'text-ivory-dim'}`}>
                      {matchup.handicapSeconds === 0 ? "0" : matchup.handicapSeconds < 0 ? `-${(-matchup.handicapSeconds).toFixed(2)}` : `+${matchup.handicapSeconds.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-ivory-faint">Odds</span>
                    <span className={`text-lg font-data font-extrabold ${isBSelected ? 'text-gold-300' : 'text-emerald-soft'}`}>
                      {matchup.oddsB.toFixed(2)}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
