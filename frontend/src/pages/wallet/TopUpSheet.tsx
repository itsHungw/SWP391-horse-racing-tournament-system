import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Plus, ShieldCheck, X } from "lucide-react";

import { walletApi } from "../../api/walletApi";

const vnd = new Intl.NumberFormat("en-US");
const PRESETS = [50000, 100000, 200000, 500000];
const TOPUP_MAX = 50000000;

export function TopUpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setError(null);
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

  const amountValue = Number(amount);
  const amountValid = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= TOPUP_MAX;

  function setDigits(raw: string) {
    setAmount(raw.replace(/[^\d]/g, ""));
  }

  async function handleSubmit() {
    if (!amountValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const { paymentUrl } = await walletApi.createTopUp(amountValue);
      window.location.href = paymentUrl;
    } catch {
      setError("Could not start the top-up. VNPay may not be configured. Check .env.");
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            className="client-theme absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-turf-900 text-ivory shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.6)]"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Add money"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/8 bg-turf-900/95 px-6 pb-4 pt-5 backdrop-blur">
              <div>
                <p className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300">VNPay top-up</p>
                <h2 className="mt-1 font-display text-2xl font-medium text-ivory">Add money</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ivory-dim transition-colors hover:bg-white/5 hover:text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 px-6 py-6">
              <label htmlFor="topup-amount" className="font-data text-[11px] uppercase tracking-[0.2em] text-ivory-faint">
                Amount
              </label>
              <div className="relative mt-3">
                <input
                  id="topup-amount"
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setDigits(e.target.value)}
                  placeholder="0"
                  aria-label="Top-up amount"
                  className="min-h-20 w-full rounded-2xl border border-white/10 bg-turf-950 pl-4 pr-20 font-data text-4xl font-bold text-ivory placeholder:text-ivory-faint/50 focus:border-gold-400 focus:outline-none"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-data text-xs uppercase tracking-[0.16em] text-ivory-faint">
                  VND
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className={`min-h-12 rounded-xl border font-data text-sm font-bold transition-colors ${
                      amount === String(preset)
                        ? "border-gold-400 bg-gold-400/10 text-gold-200"
                        : "border-white/10 bg-white/[0.03] text-ivory-dim hover:border-gold-400/40 hover:text-gold-200"
                    }`}
                  >
                    +{vnd.format(preset)}
                  </button>
                ))}
              </div>

              {amount && !amountValid ? (
                <p role="alert" className="mt-3 text-sm font-semibold text-rose-300">
                  {amountValue > TOPUP_MAX ? `Top-up is capped at ${vnd.format(TOPUP_MAX)} VND.` : "Enter a valid amount."}
                </p>
              ) : null}

              {error ? (
                <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm font-semibold text-rose-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : null}
            </div>

            <div className="sticky bottom-0 border-t border-white/8 bg-turf-900/95 px-6 py-4 backdrop-blur">
              <p className="mb-3 flex items-start gap-2 text-[12px] leading-relaxed text-ivory-faint">
                <ShieldCheck size={15} className="mt-px shrink-0 text-emerald-soft" />
                You'll be redirected to VNPay to complete payment securely.
              </p>
              <button
                type="button"
                disabled={!amountValid || submitting}
                onClick={handleSubmit}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold-400 px-5 text-[13px] font-bold uppercase tracking-[0.14em] text-turf-950 transition-colors hover:bg-gold-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint"
              >
                <Plus size={16} />
                {submitting ? "Redirecting..." : amountValid ? `Top up ${vnd.format(amountValue)} VND` : "Top up"}
              </button>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
