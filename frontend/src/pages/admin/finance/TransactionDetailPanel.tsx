import { useEffect, useRef } from "react";
import { ExternalLink, MessageSquareWarning, X } from "lucide-react";

import type { AdminFinanceTransaction } from "../../../types/adminFinance";

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function TransactionDetailPanel({ transaction, onClose }: { transaction: AdminFinanceTransaction; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    closeRef.current?.focus();
    return () => { if (dialog?.open && typeof dialog.close === "function") dialog.close(); };
  }, [onClose]);

  return (
      <dialog aria-labelledby="transaction-detail-title" className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-0 bg-white p-0 shadow-2xl backdrop:bg-[#070f4f]/70 backdrop:backdrop-blur-sm" onCancel={(event) => { event.preventDefault(); onClose(); }} ref={dialogRef}>
        <header className="flex items-start justify-between gap-4 bg-[#070f4f] p-5 text-white">
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-300">Immutable ledger entry</p><h2 className="mt-1 text-2xl font-black" id="transaction-detail-title">Transaction {transaction.id}</h2></div>
          <button aria-label="Close transaction details" className="grid h-11 w-11 place-items-center border border-white/25 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={onClose} ref={closeRef} type="button"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>
        <div className="grid gap-px bg-slate-200 sm:grid-cols-2">
          <Fact label="Amount" value={`${transaction.amount >= 0 ? "+" : ""}${vnd.format(transaction.amount)}`} tone={transaction.amount >= 0 ? "positive" : "negative"} />
          <Fact label="Type" value={transaction.transactionType.replaceAll("_", " ")} />
          <Fact label="Balance before" value={transaction.balanceBefore == null ? "—" : vnd.format(transaction.balanceBefore)} />
          <Fact label="Balance after" value={transaction.balanceAfter == null ? "—" : vnd.format(transaction.balanceAfter)} />
          <Fact label="Business reference" value={`${transaction.referenceType ?? "—"}${transaction.referenceId == null ? "" : ` #${transaction.referenceId}`}`} />
          <Fact label="Recorded at" value={new Date(transaction.createdAt).toLocaleString("vi-VN")} />
        </div>
        <div className="space-y-4 p-5">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Account</p><p className="mt-1 font-black text-slate-900">{transaction.userName}</p><p className="text-sm text-slate-500">{transaction.userEmail}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Description</p><p className="mt-1 text-sm leading-6 text-slate-700">{transaction.description ?? "No description recorded."}</p></div>
          {transaction.sourceTrace ? <div className="border-l-4 border-amber-400 bg-amber-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Source trace · {transaction.sourceStatus ?? "Unknown"}</p><p className="mt-1 font-mono text-xs font-semibold text-amber-950">{transaction.sourceTrace}</p></div> : null}
          <div className="flex flex-wrap gap-3"><a className="inline-flex min-h-11 items-center gap-2 bg-[#070f4f] px-4 py-3 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]" href={`/admin/users/${transaction.userId}`}>Open user <ExternalLink className="h-4 w-4" aria-hidden="true" /></a><a className="inline-flex min-h-11 items-center gap-2 border border-slate-300 px-4 py-3 text-sm font-black text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]" href={`/admin/disputes?transactionId=${transaction.id}`}><MessageSquareWarning className="h-4 w-4" aria-hidden="true" />Find related dispute</a></div>
        </div>
      </dialog>
  );
}

function Fact({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-[#b3193a]" : "text-slate-900";
  return <div className="bg-white p-5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 font-mono text-base font-black tabular-nums ${color}`}>{value}</p></div>;
}
