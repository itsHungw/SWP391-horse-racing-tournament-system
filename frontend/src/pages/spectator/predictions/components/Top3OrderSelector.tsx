import { X } from "lucide-react";
import type { PredictionOptions } from "../types/prediction.types";
import type { PickSlot, Picks } from "../predictionCockpitUtils";
import { formatRunnerName } from "../predictionCockpitUtils";

interface Top3OrderSelectorProps {
  options: PredictionOptions | null;
  picks: Picks;
  activeSlot: PickSlot | null;
  onActiveSlot: (slot: PickSlot) => void;
  onClearSlot: (slot: PickSlot) => void;
}

const slots: Array<{ slot: PickSlot; label: string; shortLabel: string }> = [
  { slot: "winnerId", label: "First", shortLabel: "1" },
  { slot: "secondId", label: "Second", shortLabel: "2" },
  { slot: "thirdId", label: "Third", shortLabel: "3" },
];

export function Top3OrderSelector({ options, picks, activeSlot, onActiveSlot, onClearSlot }: Top3OrderSelectorProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Top 3 order">
      {slots.map(({ slot, label, shortLabel }) => {
        const runnerId = picks[slot];
        const filled = runnerId != null;
        const active = activeSlot === slot;
        const formattedRunnerName = formatRunnerName(options, runnerId);
        const runnerName =
          filled && formattedRunnerName === "-"
            ? runnerId != null
              ? `Runner #${runnerId}`
              : "Selected runner"
            : formattedRunnerName;

        return (
          <div
            key={slot}
            className={`rounded-lg border p-2.5 transition-colors ${
              active
                ? "border-gold-400 bg-gold-400/12"
                : filled
                  ? "border-emerald-glow/40 bg-emerald-glow/10"
                  : "border-dashed border-turf-600 bg-turf-900"
            }`}
          >
            <button
              type="button"
              onClick={() => onActiveSlot(slot)}
              aria-pressed={active}
              className="min-h-12 w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
            >
              <span className="flex items-center gap-2">
                <span className={`grid h-6 w-6 place-items-center rounded-[5px] font-data text-xs font-extrabold ${
                  active ? "bg-gold-400 text-turf-900" : "bg-white/8 text-ivory-dim"
                }`}>
                  {shortLabel}
                </span>
                <span className="text-[12px] font-extrabold text-ivory">{label}</span>
              </span>
              <span className={`mt-2 block truncate text-[12px] font-semibold ${filled ? "text-ivory" : "text-ivory-faint"}`}>
                {filled ? runnerName : "Select a runner"}
              </span>
            </button>

            {filled ? (
              <button
                type="button"
                onClick={() => onClearSlot(slot)}
                className="mt-2 inline-flex min-h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-white/12 px-2 font-data text-[10px] uppercase tracking-[0.14em] text-ivory-dim transition-colors hover:border-rose-300/50 hover:text-rose-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                aria-label={`Clear ${label} selection ${runnerName}`}
              >
                <X className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
