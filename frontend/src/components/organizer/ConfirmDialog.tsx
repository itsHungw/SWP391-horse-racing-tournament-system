import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

type Tone = "danger" | "primary";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Workspace-themed confirmation dialog for consequential / irreversible organizer
 * actions (lock roster, delete round). Replaces native window.confirm so the
 * confirmation surface matches the Race Office vocabulary and stays accessible.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-rose-700 text-white hover:bg-rose-800"
      : "bg-[#1c1816] text-[#f7f4ee] hover:bg-[#2a241f]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1c1816]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => !busy && onClose()}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-[#e7e0d3] bg-[#fdfbf6] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex gap-4 px-6 py-6">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === "danger" ? "bg-rose-100 text-rose-600" : "bg-[#f3ead6] text-[#8a6a1c]"
            }`}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-display text-xl font-light text-[#211d1a]">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6f665b]">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#efe9dd] bg-[#faf7f0] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-10 rounded-lg border border-[#ddd3c0] bg-white px-4 text-sm font-black text-[#3a342d] transition hover:bg-[#f3ead6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-black uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#bb8a3c] disabled:opacity-50 ${confirmClass}`}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
