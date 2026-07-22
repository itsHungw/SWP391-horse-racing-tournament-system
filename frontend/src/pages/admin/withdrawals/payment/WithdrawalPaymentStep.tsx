import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";

import type { AdminWithdrawalReview } from "../../../../types/wallet";
import { ReceiptOcrResult } from "./ReceiptOcrResult";
import { ReceiptUploader } from "./ReceiptUploader";
import { useWithdrawalPayment, type PaymentStepState } from "./useWithdrawalPayment";
import { VietQrCard } from "./VietQrCard";

export function WithdrawalPaymentStep({
  review,
  onPaid,
  onStateChange,
  onConflict,
}: {
  review: AdminWithdrawalReview;
  onPaid: (review: AdminWithdrawalReview) => void;
  onStateChange: (state: PaymentStepState) => void;
  onConflict?: () => Promise<void>;
}) {
  const payment = useWithdrawalPayment(review, onPaid, onStateChange, onConflict);
  const instruction = review.paymentInstruction;

  if (!instruction) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5 text-rose-200">
        Payment instructions are unavailable. Reload this withdrawal before continuing.
      </div>
    );
  }

  const confirming = payment.busy === "CONFIRMING";
  const ocrBusy = payment.busy === "OCR";
  const canConfirm = Boolean(payment.receipt && payment.transferReference.trim())
    && (!payment.mismatch || (payment.mismatchAcknowledged && payment.internalNote.trim()));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)]">
        <VietQrCard instruction={instruction} withdrawalId={review.id} />

        <section className="rounded-2xl border border-white/10 bg-[#071a15] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-200">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold text-ivory">Confirm transfer</h3>
              <p className="text-xs text-ivory-faint">Upload the successful receipt before marking this request paid.</p>
            </div>
          </div>

          <div className="mt-5">
            <ReceiptUploader
              receipt={payment.receipt}
              disabled={payment.busy !== "IDLE"}
              onChange={payment.selectReceipt}
            />
          </div>

          {ocrBusy ? (
            <div role="status" aria-live="polite" className="mt-4 rounded-xl border border-gold-400/20 bg-gold-400/5 p-4">
              <div className="flex items-center justify-between text-sm text-gold-100">
                <span>Reading receipt locally...</span>
                <span className="font-data">{Math.round(payment.progress * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gold-300 transition-[width] motion-reduce:transition-none" style={{ width: `${payment.progress * 100}%` }} />
              </div>
            </div>
          ) : null}

          {payment.extraction ? (
            <ReceiptOcrResult
              extraction={payment.extraction}
              transferReference={payment.transferReference}
              onReferenceChange={payment.setTransferReference}
              comparison={payment.comparison}
              mismatchAcknowledged={payment.mismatchAcknowledged}
              onMismatchAcknowledged={payment.setMismatchAcknowledged}
              internalNote={payment.internalNote}
              onInternalNoteChange={payment.setInternalNote}
            />
          ) : null}

          {payment.error ? <p role="alert" className="mt-4 text-sm text-rose-300">{payment.error}</p> : null}

          <button
            type="button"
            disabled={!canConfirm || payment.busy !== "IDLE"}
            onClick={payment.confirmPaid}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-300 px-5 text-xs font-black uppercase tracking-[0.14em] text-turf-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ivory-faint"
          >
            {confirming ? "Confirming..." : "Confirm paid"}
          </button>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#071a15] p-5">
        <button
          type="button"
          aria-expanded={payment.rejectOpen}
          onClick={() => payment.setRejectOpen(!payment.rejectOpen)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-ivory-dim hover:text-ivory"
        >
          <span className="flex items-center gap-2"><AlertTriangle size={17} aria-hidden="true" /> Cannot complete payment</span>
          <span aria-hidden="true">{payment.rejectOpen ? "−" : "+"}</span>
        </button>

        {payment.rejectOpen ? (
          <div className="mt-4 space-y-4 border-t border-white/8 pt-4">
            <p className="text-sm text-ivory-faint">
              Use this only when the destination is permanently invalid and no bank transfer was made.
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-ivory-dim">Reason shown to user</span>
              <textarea
                value={payment.publicReason}
                onChange={(event) => payment.setPublicReason(event.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-turf-950 px-3 py-2 text-sm text-ivory focus:border-rose-300 focus:outline-none"
              />
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm text-ivory-dim">
              <input
                type="checkbox"
                checked={payment.noTransferConfirmed}
                onChange={(event) => payment.setNoTransferConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4 accent-rose-300"
              />
              <span>No transfer was made for this withdrawal.</span>
            </label>
            <button
              type="button"
              disabled={!payment.publicReason.trim() || !payment.noTransferConfirmed || payment.busy !== "IDLE"}
              onClick={payment.rejectAndRefund}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-300/40 px-4 text-xs font-bold uppercase tracking-[0.12em] text-rose-200 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={15} aria-hidden="true" /> Reject & refund
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
