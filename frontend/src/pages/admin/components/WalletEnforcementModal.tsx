import { useState } from "react";

export function WalletEnforcementModal({ action, busy, error, onClose, onSubmit }: {
  action: "lock" | "unlock";
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (value: { reason: string; internalNote?: string }) => void;
}) {
  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const locking = action === "lock";
  const title = locking ? "Freeze new withdrawals" : "Restore withdrawals";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ reason: reason.trim(), internalNote: internalNote.trim() || undefined });
      }}>
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {locking
            ? "The user cannot create new withdrawals. Existing requests remain reviewable, and system payouts or refunds continue to be credited."
            : "The wallet can create eligible withdrawals again. This does not restore a suspended or banned account."}
        </p>
        <label className="mt-5 block text-sm font-bold text-slate-700">Reason shown to the user</label>
        <textarea required maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3" />
        <label className="mt-4 block text-sm font-bold text-slate-700">Internal note (admin only)</label>
        <textarea maxLength={1000} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 p-3" />
        {error && <p className="mt-4 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={busy || !reason.trim()} className={`rounded-full px-5 py-2 text-sm font-black text-white disabled:opacity-50 ${locking ? "bg-orange-700" : "bg-emerald-700"}`}>{busy ? "Applying…" : title}</button>
        </div>
      </form>
    </div>
  );
}
