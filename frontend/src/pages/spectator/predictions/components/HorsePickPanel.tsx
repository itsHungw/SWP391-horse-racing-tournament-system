import { AlertCircle, X } from "lucide-react";
import type { PredictionOptions, PredictionType } from "../types/prediction.types";

export type Picks = {
  winnerId: number | null;
  secondId: number | null;
  thirdId: number | null;
};

export const EMPTY_PICKS: Picks = { winnerId: null, secondId: null, thirdId: null };

const SLOT_LABELS = ["1st", "2nd", "3rd"] as const;

function slotOf(picks: Picks, participantId: number): 0 | 1 | 2 | null {
  if (picks.winnerId === participantId) return 0;
  if (picks.secondId === participantId) return 1;
  if (picks.thirdId === participantId) return 2;
  return null;
}

function setSlot(picks: Picks, slot: 0 | 1 | 2, value: number | null): Picks {
  if (slot === 0) return { ...picks, winnerId: value };
  if (slot === 1) return { ...picks, secondId: value };
  return { ...picks, thirdId: value };
}

/** Step 2 — tactile horse selection.
    WINNER: tap a runner to choose it. TOP3: taps fill 1st → 2nd → 3rd; tap a
    picked runner (or its slot chip) to clear it. Pure controlled component. */
export function HorsePickPanel({
  options,
  predType,
  onPredType,
  picks,
  onPicksChange,
}: {
  options: PredictionOptions;
  predType: PredictionType;
  onPredType: (t: PredictionType) => void;
  picks: Picks;
  onPicksChange: (p: Picks) => void;
}) {
  const predictionOpen = options.predictionOpen;
  const slotValues = [picks.winnerId, picks.secondId, picks.thirdId] as const;

  const handleTap = (participantId: number) => {
    if (!predictionOpen) return;
    const existing = slotOf(picks, participantId);
    if (existing != null) {
      onPicksChange(setSlot(picks, existing, null));
      return;
    }
    if (predType === "WINNER") {
      onPicksChange({ ...EMPTY_PICKS, winnerId: participantId });
      return;
    }
    const firstEmpty = slotValues.findIndex((v) => v == null);
    if (firstEmpty === -1) return;
    onPicksChange(setSlot(picks, firstEmpty as 0 | 1 | 2, participantId));
  };

  const nameOf = (id: number | null) => {
    if (id == null) return null;
    const opt = options.options.find((o) => o.raceParticipantId === id);
    return opt ? `#${opt.startNumber ?? "—"} ${opt.horseName}` : null;
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-turf-900 p-6 md:p-7">
      <h2 className="eyebrow text-emerald-soft">Step 2 · Pick your horses</h2>

      {/* Type toggle */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-white/8 bg-turf-950 p-1.5">
        {(
          [
            { key: "WINNER" as const, label: "Winner Pick" },
            { key: "TOP3" as const, label: "Top 3 Pick" },
          ]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onPredType(t.key)}
            aria-pressed={predType === t.key}
            className={`cursor-pointer rounded-lg py-3 text-center text-sm font-bold transition-colors ${
              predType === t.key ? "bg-emerald-glow text-turf-950" : "text-ivory-dim hover:text-ivory"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reward explainer */}
      <div className="mt-4 rounded-xl border border-gold-600/25 bg-gold-400/5 px-4 py-3 text-xs font-semibold leading-relaxed text-ivory-dim">
        <p>
          <span className="font-data uppercase tracking-[0.12em] text-gold-300">Payout:</span> your stake × the odds
          shown, credited to your wallet if the prediction is correct.
        </p>
      </div>

      {!predictionOpen && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold-600/30 bg-gold-400/5 p-4 text-xs font-semibold text-gold-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-gold-300" />
          <div>
            <p className="font-data uppercase tracking-[0.14em] text-gold-300">Predictions Locked</p>
            <p className="mt-0.5 leading-relaxed text-ivory-dim">
              Predictions are closed — paddock checks have started or the race has finished.
            </p>
          </div>
        </div>
      )}

      {/* TOP3 slot chips */}
      {predType === "TOP3" && (
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {SLOT_LABELS.map((label, i) => {
            const value = slotValues[i];
            const name = nameOf(value);
            return (
              <div
                key={label}
                className={`rounded-xl border px-3 py-2.5 text-center ${
                  name ? "border-gold-400/50 bg-gold-400/10" : "border-dashed border-white/15 bg-turf-950"
                }`}
              >
                <p className="font-data text-[10px] uppercase tracking-[0.18em] text-gold-300">{label}</p>
                {name ? (
                  <button
                    type="button"
                    onClick={() => onPicksChange(setSlot(picks, i as 0 | 1 | 2, null))}
                    className="mt-1 inline-flex max-w-full cursor-pointer items-center gap-1 text-xs font-bold text-ivory hover:text-rose-300"
                    aria-label={`Clear ${label} selection ${name}`}
                  >
                    <span className="truncate">{name}</span>
                    <X size={11} className="shrink-0" />
                  </button>
                ) : (
                  <p className="mt-1 text-xs font-semibold text-ivory-faint">Tap a horse</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Runner grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2" role="listbox" aria-label="Runners">
        {options.options.map((opt) => {
          const slot = slotOf(picks, opt.raceParticipantId);
          const picked = slot != null;
          const shownSlot = predType === "TOP3" && picked ? SLOT_LABELS[slot] : null;
          return (
            <button
              key={opt.raceParticipantId}
              type="button"
              role="option"
              aria-selected={picked}
              disabled={!predictionOpen}
              onClick={() => handleTap(opt.raceParticipantId)}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                picked
                  ? "border-gold-400/70 bg-gradient-to-b from-turf-800 to-turf-950 shadow-[0_18px_46px_-22px_rgba(212,175,55,0.5)]"
                  : "border-white/10 bg-turf-950 hover:border-white/25"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border font-data text-base font-semibold ${
                  picked
                    ? "border-gold-400 bg-gold-400 text-turf-950"
                    : "border-gold-400/40 bg-gold-400/10 text-gold-200"
                }`}
              >
                {opt.startNumber ?? "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-lg font-medium text-ivory">{opt.horseName}</span>
                <span className="block truncate text-xs text-ivory-dim">{opt.jockeyName}</span>
              </span>
              {shownSlot ? (
                <span className="font-data shrink-0 rounded-full border border-gold-400/50 bg-gold-400/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-gold-200">
                  {shownSlot}
                </span>
              ) : picked ? (
                <span className="font-data shrink-0 rounded-full border border-gold-400/50 bg-gold-400/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-gold-200">
                  Pick
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
