import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { adminWalletApi } from "../../../api/adminWalletApi";
import type { AdminWithdrawalReview } from "../../../types/wallet";

export function WithdrawalDecisionPanel({
  review,
  onUpdated,
  onConflict,
  onStateChange,
}: {
  review: AdminWithdrawalReview;
  onUpdated: (review: AdminWithdrawalReview) => void;
  onConflict: () => Promise<void>;
  onStateChange: (state: { dirty: boolean; busy: boolean }) => void;
}) {
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const [internalNote, setInternalNote] = useState("");
  const [publicReason, setPublicReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = Boolean(internalNote || publicReason || acknowledged);

  useEffect(() => {
    onStateChange({ dirty, busy });
  }, [busy, dirty, onStateChange]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const updated = mode === "approve"
        ? await adminWalletApi.approve(review.id, {
            riskAcknowledged: acknowledged,
            internalNote: internalNote.trim(),
          })
        : await adminWalletApi.reject(review.id, {
            publicReason: publicReason.trim(),
            internalNote: internalNote.trim(),
            noTransferConfirmed: false,
          });
      onUpdated(updated);
    } catch (caught) {
      const status = (caught as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        setError("This request changed while you were reviewing it. The latest state has been loaded.");
        await onConflict();
      } else {
        setError("The decision could not be saved. Your notes are preserved.");
      }
    } finally {
      setBusy(false);
    }
  }

  const approveReady = review.risk.level !== "HIGH"
    || (acknowledged && internalNote.trim().length > 0);
  const disabled = busy
    || (mode === "approve" && !approveReady)
    || (mode === "reject" && !publicReason.trim());

  return (
    <section className="border-t-4 border-[#b3193a] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-[#b3193a]" aria-hidden="true" />
        <h3 className="text-lg font-black text-[#070f4f]">Record a decision</h3>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setMode("approve")} aria-pressed={mode === "approve"} className={`min-h-11 border px-3 text-xs font-black uppercase ${mode === "approve" ? "border-[#070f4f] bg-[#070f4f] text-white" : "border-slate-300"}`}>
          Approve
        </button>
        <button type="button" onClick={() => setMode("reject")} aria-pressed={mode === "reject"} className={`min-h-11 border px-3 text-xs font-black uppercase ${mode === "reject" ? "border-[#b3193a] bg-[#b3193a] text-white" : "border-slate-300"}`}>
          Reject
        </button>
      </div>

      {mode === "reject" ? (
        <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-600">
          Public reason
          <textarea value={publicReason} onChange={(event) => setPublicReason(event.target.value)} rows={3} maxLength={500} className="mt-2 w-full border border-slate-300 p-3 text-sm font-normal normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b3193a]" />
        </label>
      ) : null}

      <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-600">
        Internal note
        <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows={3} maxLength={1000} className="mt-2 w-full border border-slate-300 p-3 text-sm font-normal normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#070f4f]" />
      </label>

      {mode === "approve" && review.risk.level === "HIGH" ? (
        <label className="mt-4 flex min-h-11 items-start gap-3 border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-900">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-5 w-5" />
          I reviewed the risk flags and supporting evidence.
        </label>
      ) : null}

      {error ? <p role="alert" className="mt-4 text-sm font-bold text-rose-700">{error}</p> : null}
      <button type="button" disabled={disabled} onClick={() => void submit()} className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${mode === "reject" ? "bg-[#b3193a]" : "bg-[#070f4f]"}`}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
        {mode === "approve" ? "Approve & continue to payment" : "Reject & refund"}
      </button>
    </section>
  );
}
