import { Circle, Trophy, UsersRound, TrendingUp, Layers } from "lucide-react";
import type { PredictionOptions, PredictionType } from "../types/prediction.types";

interface PredictionModeSelectorProps {
  options: PredictionOptions | null;
  predType: PredictionType;
  onChange: (value: PredictionType) => void;
}

type VisualMode = "EXACT_POSITION" | "HEAD_TO_HEAD" | "WINNING_STREAK";

const modes: Array<{
  visualKey: VisualMode;
  value: PredictionType;
  label: string;
  description: string;
  ariaLabel: string;
  icon: typeof Trophy;
}> = [
  {
    visualKey: "EXACT_POSITION",
    value: "EXACT_POSITION",
    label: "Exact Position",
    description: "Pick any horse for any position",
    ariaLabel: "Exact Position Pick",
    icon: Trophy,
  },
  {
    visualKey: "HEAD_TO_HEAD",
    value: "HEAD_TO_HEAD",
    label: "Head-to-Head",
    description: "Pick the winner of a matchup",
    ariaLabel: "Head-to-Head Matchup Pick",
    icon: TrendingUp,
  },
  {
    visualKey: "WINNING_STREAK",
    value: "WINNING_STREAK",
    label: "Winning Streak",
    description: "Parlay multiple winners for massive multipliers",
    ariaLabel: "Winning Streak Pick",
    icon: Layers,
  },
];

function rewardForMode(options: PredictionOptions | null, visualKey: VisualMode): string {
  if (!options) return "Loading";

  if (visualKey === "EXACT_POSITION") {
    return "Dynamic Odds";
  }
  if (visualKey === "HEAD_TO_HEAD") {
    return "AMM Dynamic Odds";
  }
  if (visualKey === "WINNING_STREAK") {
    return "Multiplied Odds";
  }

  return "TBD";
}

export function PredictionModeSelector({ options, predType, onChange }: PredictionModeSelectorProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-turf-400">Choose Prediction Type</p>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3" role="group" aria-label="Prediction mode">
        {modes.map((mode) => {
          const active = predType === mode.value;
          const Icon = mode.icon;

          return (
            <button
              key={mode.visualKey}
              type="button"
              aria-label={mode.ariaLabel}
              aria-pressed={active}
              onClick={() => onChange(mode.value)}
              className={`group relative flex flex-col justify-between cursor-pointer rounded-xl border p-3 text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 ${
                active
                  ? "border-gold-400/50 bg-gradient-to-b from-gold-500/10 to-turf-900 shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-gold-400/50"
                  : "border-turf-800 bg-turf-900/60 hover:bg-turf-800/80 hover:border-turf-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] transition-all duration-300 ${
                    active ? "bg-gold-400 text-turf-950 shadow-[0_2px_12px_rgba(212,175,55,0.4)] scale-105" : "bg-turf-800 text-turf-400 group-hover:bg-turf-700 group-hover:text-ivory"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] font-black tracking-wide transition-colors ${active ? "text-gold-400" : "text-ivory group-hover:text-gold-100"}`}>{mode.label}</span>
                  <span className="block truncate text-[11px] font-medium text-turf-400">{mode.description}</span>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-[11px] font-bold border-t border-turf-800/60 pt-2.5">
                <span className="text-turf-500">Reward: <span className={`font-data ${active ? "text-gold-300" : "text-ivory-dim group-hover:text-ivory"}`}>{rewardForMode(options, mode.visualKey)}</span></span>
                {active ? (
                  <div className="relative grid h-3.5 w-3.5 place-items-center rounded-full bg-gold-400 text-turf-900 shadow-[0_0_8px_rgba(212,175,55,0.5)]">
                    <div className="absolute inset-0 rounded-full bg-gold-400 animate-ping opacity-60" />
                    <Circle className="relative h-1.5 w-1.5 fill-current" aria-hidden="true" />
                  </div>
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-turf-700 bg-turf-850 group-hover:border-turf-600 transition-colors" aria-hidden="true" />
                )}
              </div>

              {active && (
                <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-gold-400 to-transparent opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
