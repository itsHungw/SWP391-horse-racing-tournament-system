import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

const SIZE: Record<"md" | "lg" | "xl", string> = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

/**
 * Workspace detail drawer — the shared shell behind every "open a row → review → act" surface
 * (registrations, officials, schedule, results). Bottom-sheet on mobile, centred panel on ≥sm;
 * charcoal header with eyebrow/title/close, scrollable body, optional sticky footer. Escape and
 * backdrop close (disabled while `busy`). Callers supply only the content, not the chrome.
 */
export function Drawer({
  onClose,
  title,
  eyebrow,
  visual,
  headerMeta,
  footer,
  children,
  size = "lg",
  busy = false,
  labelledById = "drawer-title",
}: {
  onClose: () => void;
  title: ReactNode;
  eyebrow?: string;
  /** Left-of-title visual: an image, avatar, or initials chip. */
  visual?: ReactNode;
  /** Sub-line under the title — typically a <StatusPill> or meta row. */
  headerMeta?: ReactNode;
  /** Footer content; the bar (border, surface, padding) is provided. */
  footer?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  busy?: boolean;
  labelledById?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-office-charcoal/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !busy && onClose()}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full ${SIZE[size]} flex-col overflow-hidden rounded-t-2xl border border-office-line bg-office-panel shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-office-line-soft bg-office-charcoal px-6 py-5 text-office-bg">
          <div className="flex min-w-0 items-center gap-4">
            {visual}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-office-brass-bright">{eyebrow}</p>
              )}
              <h2 id={labelledById} className="mt-1 truncate font-display text-2xl font-light">
                {title}
              </h2>
              {headerMeta && <div className="mt-1.5">{headerMeta}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-office-brass-bright"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="border-t border-office-line-soft bg-office-bg-soft px-6 py-4">{footer}</div>}
      </section>
    </div>
  );
}
