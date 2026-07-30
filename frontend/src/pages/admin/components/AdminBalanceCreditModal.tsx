import { useState } from "react";
import { formatVnd } from "../../../utils/money";

const amountFormatter = new Intl.NumberFormat("en-US");

export function AdminBalanceCreditModal({
  currentBalance,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  currentBalance: number;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (value: { amount: number; reason: string }) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const parsedAmount = Number(amount);
  const validAmount = Number.isInteger(parsedAmount) && parsedAmount > 0 && parsedAmount <= 50_000_000;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="credit-wallet-title">
      <form
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (validAmount && reason.trim()) onSubmit({ amount: parsedAmount, reason: reason.trim() });
        }}
      >
        <h2 id="credit-wallet-title" className="text-xl font-black text-slate-950">Add Balance</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This creates an immutable admin adjustment in the user's wallet history.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Current balance</p>
            <p className="mt-1 font-black text-slate-950">{formatVnd(currentBalance)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">After credit</p>
            <p className="mt-1 font-black text-emerald-700">
              {formatVnd(currentBalance + (validAmount ? parsedAmount : 0))}
            </p>
          </div>
        </div>

        <label htmlFor="admin-credit-amount" className="mt-5 block text-sm font-bold text-slate-700">Amount (VND)</label>
        <input
          id="admin-credit-amount"
          autoFocus
          required
          type="number"
          min={1}
          max={50_000_000}
          step={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
        />
        <p className="mt-1 text-xs text-slate-500">Maximum 50,000,000 VND per transaction.</p>

        <label htmlFor="admin-credit-reason" className="mt-4 block text-sm font-bold text-slate-700">Internal reason</label>
        <textarea
          id="admin-credit-reason"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
        />
        <p className="mt-1 text-xs text-slate-500">Admins see this audit reason. The user sees “Admin transferred money”.</p>

        {error && <p className="mt-4 text-sm font-semibold text-rose-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={busy || !validAmount || !reason.trim()} className="min-h-11 rounded-full bg-[#070f4f] px-5 text-sm font-black text-white disabled:opacity-50">
            {busy ? "Adding…" : validAmount ? `Add ${amountFormatter.format(parsedAmount)} VND` : "Add Balance"}
          </button>
        </div>
      </form>
    </div>
  );
}
