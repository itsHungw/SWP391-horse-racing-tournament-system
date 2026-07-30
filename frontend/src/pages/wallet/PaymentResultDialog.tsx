import { AlertTriangle, Check, Clock3, Loader2, ReceiptText, RefreshCw, X } from "lucide-react";
import type { TopUpReceipt } from "../../types/wallet";
import { Modal } from "./Modal";

export type PaymentResultState =
  | { kind: "loading"; txnRef: string }
  | { kind: "receipt"; receipt: TopUpReceipt }
  | { kind: "unavailable"; txnRef: string; message: string };

type Props = { state: PaymentResultState | null; canTopUp: boolean; onClose: () => void; onRetryReceipt: () => void; onTryAgain: () => void; onViewTransaction: (id: number) => void };
const vnd = new Intl.NumberFormat("en-US");

export function PaymentResultDialog({ state, canTopUp, onClose, onRetryReceipt, onTryAgain, onViewTransaction }: Props) {
  if (!state) return null;
  const receipt = state.kind === "receipt" ? state.receipt : null;
  const success = receipt?.status === "SUCCESS";
  const failed = receipt?.status === "FAILED";
  return (
    <Modal open onClose={onClose} label="Top-up result" panelClassName="max-w-lg">
      <div className="relative overflow-hidden border-b border-white/10 px-6 pb-6 pt-7 sm:px-8">
        <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${success ? "bg-emerald-soft" : failed ? "bg-rose-400" : "bg-gold-400"}`} />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-ivory-dim hover:bg-white/5 hover:text-ivory"><X className="h-5 w-5" /></button>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${success ? "bg-emerald-soft/15 text-emerald-soft" : failed ? "bg-rose-400/15 text-rose-300" : "bg-gold-400/15 text-gold-300"}`}>
          {state.kind === "loading" ? <Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" /> : success ? <Check className="h-6 w-6" /> : failed ? <AlertTriangle className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
        </div>
        <p className="mt-5 font-data text-[10px] font-black uppercase tracking-[0.22em] text-gold-300">Verified payment receipt</p>
        <h2 className="mt-2 font-display text-3xl text-ivory">{state.kind === "loading" ? "Checking your payment" : state.kind === "unavailable" ? "Receipt unavailable" : success ? "Money added" : failed ? "Top-up not completed" : "Payment pending"}</h2>
        <p className="mt-2 text-sm leading-6 text-ivory-dim">{state.kind === "loading" ? "We are matching the payment reference to your wallet ledger." : state.kind === "unavailable" ? state.message : success ? "The payment was verified and recorded in your wallet." : failed ? receipt?.failureReason || "No successful wallet credit was recorded for this payment." : "The gateway has not confirmed a final result yet. You can check again shortly."}</p>
      </div>
      {receipt && <div className="grid grid-cols-2 gap-px bg-white/10"><div className="bg-turf-900 px-6 py-5"><p className="font-data text-[10px] uppercase tracking-wider text-ivory-faint">Amount</p><p className="mt-2 font-data text-lg font-black text-ivory">{vnd.format(receipt.amount)} VND</p></div><div className="bg-turf-900 px-6 py-5"><p className="font-data text-[10px] uppercase tracking-wider text-ivory-faint">Balance after</p><p className="mt-2 font-data text-lg font-black text-ivory">{receipt.balanceAfter == null ? "—" : `${vnd.format(receipt.balanceAfter)} VND`}</p></div>{receipt.transactionNo && <div className="col-span-2 bg-turf-900 px-6 py-4"><p className="font-data text-[10px] uppercase tracking-wider text-ivory-faint">VNPay transaction no.</p><p className="mt-1 break-all font-data text-sm font-bold text-ivory">{receipt.transactionNo}</p></div>}<div className="col-span-2 bg-turf-900 px-6 py-4"><p className="font-data text-[10px] uppercase tracking-wider text-ivory-faint">Reference</p><p className="mt-1 break-all font-data text-xs text-ivory-dim">{receipt.txnRef}</p></div></div>}
      <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-white/15 px-5 text-sm font-bold text-ivory">Done</button>
        {(state.kind === "unavailable" || receipt?.status === "PENDING") && <button type="button" onClick={onRetryReceipt} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold-400/40 px-5 text-sm font-bold text-gold-200"><RefreshCw className="h-4 w-4" />Check again</button>}
        {failed && canTopUp && <button type="button" onClick={onTryAgain} className="min-h-11 rounded-full bg-gold-400 px-5 text-sm font-black text-turf-950">Try again</button>}
        {success && receipt?.walletTransactionId != null && <button type="button" onClick={() => onViewTransaction(receipt.walletTransactionId!)} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold-400 px-5 text-sm font-black text-turf-950"><ReceiptText className="h-4 w-4" />View transaction</button>}
      </div>
    </Modal>
  );
}
