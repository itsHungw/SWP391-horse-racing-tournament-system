import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, TriangleAlert, X } from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   Client toast — "Night at the Races"
   Fixed, self-dismissing feedback so an action's outcome is always
   visible, no matter where the user is scrolled. Themed for the dark
   cinematic surface (turf / gold / ivory), not the admin white toast.
   ════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const;
const AUTO_DISMISS_MS = { success: 4000, error: 6000 } as const;

export type ToastTone = "success" | "error";
export type ToastState = { id: number; text: string; tone: ToastTone } | null;

/** Owns toast state + auto-dismiss timing. One live toast at a time. */
export function useClientToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<number | undefined>(undefined);

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback((text: string, tone: ToastTone = "success") => {
    window.clearTimeout(timer.current);
    // Fresh id so re-showing the same text re-triggers the enter animation.
    setToast({ id: Date.now(), text, tone });
    timer.current = window.setTimeout(() => setToast(null), AUTO_DISMISS_MS[tone]);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, show, dismiss };
}

export type ToastVariant = "cinematic" | "workspace";

type ToneStyle = { label: string; ring: string; chip: string; labelText: string; Icon: typeof Check };
type VariantStyle = {
  wrapper: string;
  surface: string;
  labelFont: string;
  body: string;
  close: string;
  tones: Record<ToastTone, ToneStyle>;
};

const VARIANTS: Record<ToastVariant, VariantStyle> = {
  // Public "Night at the Races" — dark cinematic surface (turf / gold / ivory), sharp corners.
  cinematic: {
    wrapper: "client-theme",
    surface: "bg-turf-900/95 shadow-[0_12px_48px_-8px_rgba(0,0,0,0.65)] backdrop-blur-sm",
    labelFont: "font-data text-[10px] font-bold uppercase tracking-[0.16em]",
    body: "text-ivory-dim",
    close: "text-ivory-faint hover:text-ivory focus-visible:ring-gold-400/50",
    tones: {
      success: { label: "Saved", ring: "border-emerald-glow/30", chip: "border-emerald-glow/25 bg-emerald-glow/10 text-emerald-soft", labelText: "text-emerald-soft", Icon: Check },
      error: { label: "Heads up", ring: "border-nyraRed/40", chip: "border-nyraRed/30 bg-nyraRed/15 text-rose-300", labelText: "text-rose-300", Icon: TriangleAlert },
    },
  },
  // Owner / admin / referee workspaces — light "Race Office" surface, rounded.
  workspace: {
    wrapper: "",
    surface: "rounded-lg bg-white shadow-[0_12px_40px_-8px_rgba(15,23,42,0.28)]",
    labelFont: "text-[11px] font-black uppercase tracking-[0.14em]",
    body: "font-semibold text-slate-600",
    close: "text-slate-400 hover:text-slate-700 focus-visible:ring-emerald-600/40",
    tones: {
      success: { label: "Saved", ring: "border-emerald-200", chip: "border-emerald-200 bg-emerald-50 text-emerald-700", labelText: "text-emerald-700", Icon: Check },
      error: { label: "Heads up", ring: "border-red-200", chip: "border-red-200 bg-red-50 text-red-600", labelText: "text-red-700", Icon: TriangleAlert },
    },
  },
};

/**
 * Presentational toast. Drop once near the root of a page and drive it with
 * {@link useClientToast}. `position: fixed`, so it stays in view while the page
 * scrolls; anchored bottom-right on desktop (beside primary actions),
 * bottom-center on mobile for thumb reach. `variant` picks the theme:
 * "cinematic" (default, dark public site) or "workspace" (light owner/admin).
 */
export function ClientToast({
  toast,
  onDismiss,
  variant = "cinematic",
}: {
  toast: ToastState;
  onDismiss: () => void;
  variant?: ToastVariant;
}) {
  const reduce = useReducedMotion();
  const v = VARIANTS[variant];
  const tone = toast ? v.tones[toast.tone] : null;

  return (
    <div className={`${v.wrapper} pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-5 sm:pt-7`}>
      <AnimatePresence mode="wait">
        {toast && tone && (
          <motion.div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: EASE }}
            className={`pointer-events-auto flex w-[min(92vw,25rem)] items-start gap-3.5 border ${tone.ring} ${v.surface} px-4 py-3.5`}
          >
            <span aria-hidden="true" className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${tone.chip}`}>
              <tone.Icon size={15} strokeWidth={2.5} />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`${v.labelFont} ${tone.labelText}`}>{tone.label}</p>
              <p className={`mt-1 text-sm leading-snug ${v.body}`}>{toast.text}</p>
            </div>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className={`-mr-1 -mt-1 shrink-0 rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 ${v.close}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
