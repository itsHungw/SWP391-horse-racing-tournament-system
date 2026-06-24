import { type ReactNode, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Centered, accessible modal shell (overlay + ESC + scroll-lock + focus dialog).
 * Children own the header/body/footer; give the body `flex-1 overflow-y-auto`
 * for a sticky-header/footer scroll. Use the slide-over sheets for long flows.
 */
export function Modal({
  open,
  onClose,
  label,
  panelClassName = "max-w-md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`client-theme relative flex max-h-[88vh] w-full ${panelClassName} flex-col overflow-hidden rounded-2xl border border-white/10 bg-turf-900 text-ivory shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]`}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
