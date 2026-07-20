import { useState } from "react";
import type { AccountEnforcementAction } from "../../../types/adminUser";

const LABELS: Record<AccountEnforcementAction, string> = {
  suspend: "Suspend account",
  restore: "Restore account",
  ban: "Confirm permanent restriction",
  reopen: "Reopen for review",
};

export function AccountEnforcementModal({ action, busy, error, walletAlreadyLocked = false, onClose, onSubmit }: {
  action: AccountEnforcementAction;
  busy: boolean;
  error: string | null;
  walletAlreadyLocked?: boolean;
  onClose: () => void;
  onSubmit: (value: { reason: string; internalNote?: string; lockWallet?: boolean }) => void;
}) {
  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [lockWallet, setLockWallet] = useState(walletAlreadyLocked);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <form className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ reason: reason.trim(), internalNote: internalNote.trim() || undefined, ...(action === "suspend" ? { lockWallet } : {}) });
      }}>
        <h2 className="text-xl font-black text-slate-950">{LABELS[action]}</h2>
        {action === "ban" && <p className="mt-2 text-sm font-semibold text-rose-700">Ban is only valid after suspension. Existing race results and money owed are preserved.</p>}
        <label className="mt-5 block text-sm font-bold text-slate-700">Reason shown to the user</label>
        <textarea required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3" />
        <label className="mt-4 block text-sm font-bold text-slate-700">Internal note (admin only)</label>
        <textarea maxLength={1000} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="mt-2 min-h-20 w-full rounded-xl border border-slate-300 p-3" />
        {action === "suspend" && walletAlreadyLocked && (
          <div className="mt-5 rounded-xl border border-orange-300 bg-orange-50 p-4 text-sm text-orange-950">
            <strong>Withdrawals are already frozen.</strong>
            <p className="mt-1 text-orange-800">Suspending this account will keep the wallet locked. Restore wallet access separately after the financial review.</p>
          </div>
        )}
        {action === "suspend" && !walletAlreadyLocked && (
          <fieldset className="mt-5">
            <legend className="text-sm font-bold text-slate-700">Financial access</legend>
            <div className="mt-2 space-y-2">
              <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${!lockWallet ? "border-emerald-400 bg-emerald-50" : "border-slate-200"}`}>
                <input type="radio" name="walletAction" checked={!lockWallet} onChange={() => setLockWallet(false)} className="mt-1" />
                <span><strong>Keep withdrawals available</strong><br /><span className="text-slate-600">Recommended. Betting and top-ups are already blocked; the user can still withdraw eligible funds.</span></span>
              </label>
              <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${lockWallet ? "border-orange-400 bg-orange-50" : "border-slate-200"}`}>
                <input type="radio" name="walletAction" checked={lockWallet} onChange={() => setLockWallet(true)} className="mt-1" />
                <span><strong>Freeze new withdrawals</strong><br /><span className="text-slate-600">Use for financial risk. New withdrawals stop, while payout and refund credits remain recorded.</span></span>
              </label>
            </div>
          </fieldset>
        )}
        {error && <p className="mt-4 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border px-5 py-2 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={busy || !reason.trim()} className="rounded-full bg-slate-950 px-5 py-2 text-sm font-black text-white disabled:opacity-50">{busy ? "Applying…" : LABELS[action]}</button>
        </div>
      </form>
    </div>
  );
}
