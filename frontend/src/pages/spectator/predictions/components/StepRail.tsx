import { Check } from "lucide-react";

const STEPS = ["Pick a race", "Pick your horses", "Review ticket"] as const;

/** Three-step progress rail for the prediction wizard. Completed steps are
    clickable so the player can walk back without losing choices. */
export function StepRail({
  current,
  onGo,
}: {
  current: 1 | 2 | 3;
  onGo: (step: 1 | 2 | 3) => void;
}) {
  return (
    <ol className="flex items-center gap-0" aria-label="Prediction steps">
      {STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <button
              type="button"
              disabled={!done}
              onClick={() => done && onGo(step)}
              aria-current={active ? "step" : undefined}
              className={`group flex items-center gap-3 ${done ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-data text-xs transition-colors ${
                  active
                    ? "border-emerald-glow bg-emerald-glow text-turf-950 shadow-[0_0_26px_-6px_rgba(31,157,118,0.9)]"
                    : done
                      ? "border-emerald-glow/50 bg-emerald-glow/15 text-emerald-soft group-hover:border-emerald-glow"
                      : "border-white/15 bg-turf-900 text-ivory-faint"
                }`}
              >
                {done ? <Check size={14} /> : step}
              </span>
              <span
                className={`hidden whitespace-nowrap font-data text-[10px] uppercase tracking-[0.18em] sm:inline ${
                  active ? "text-emerald-soft" : done ? "text-ivory-dim group-hover:text-ivory" : "text-ivory-faint"
                }`}
              >
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 ? (
              <span
                className={`mx-3 h-px flex-1 sm:mx-4 ${done ? "bg-emerald-glow/40" : "bg-white/10"}`}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
