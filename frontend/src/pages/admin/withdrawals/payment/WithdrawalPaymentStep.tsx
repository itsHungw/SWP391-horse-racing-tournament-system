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
      <div role="alert" className="border border-rose-200 bg-rose-50 p-5 text-rose-800">
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

        <section aria-labelledby="receipt-confirmation-heading" className="border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 id="receipt-confirmation-heading" className="font-black text-[#070f4f]">Receipt and confirmation</h3>
              <p className="mt-0.5 text-xs text-slate-500">Upload the successful receipt before marking this request paid.</p>
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
            <div role="status" aria-live="polite" className="mt-4 border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between text-sm text-blue-900">
                <span>Reading receipt locally...</span>
                <span className="font-mono">{Math.round(payment.progress * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden bg-blue-100">
                <div className="h-full bg-[#070f4f] transition-[width] motion-reduce:transition-none" style={{ width: `${payment.progress * 100}%` }} />
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

          {payment.error ? <p role="alert" className="mt-4 text-sm text-rose-700">{payment.error}</p> : null}

          <button
            type="button"
            disabled={!canConfirm || payment.busy !== "IDLE"}
            onClick={payment.confirmPaid}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center bg-[#070f4f] px-5 text-sm font-black text-white hover:bg-[#111d69] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {confirming ? "Confirming..." : "Confirm paid"}
          </button>
        </section>
      </div>

      <section className="border border-slate-200 bg-white px-5 py-3">
        <button
          type="button"
          aria-expanded={payment.rejectOpen}
          onClick={() => payment.setRejectOpen(!payment.rejectOpen)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-700 hover:text-[#070f4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#070f4f]"
        >
          <span className="flex items-center gap-2 text-rose-700"><AlertTriangle size={17} aria-hidden="true" /> Cannot complete payment</span>
          <span aria-hidden="true">{payment.rejectOpen ? "−" : "+"}</span>
        </button>

        {payment.rejectOpen ? (
          <div className="mt-3 space-y-4 border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Use this only when the destination is permanently invalid and no bank transfer was made.
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Reason shown to user</span>
              <textarea
                value={payment.publicReason}
                onChange={(event) => payment.setPublicReason(event.target.value)}
                rows={3}
                maxLength={500}
                className="mt-1.5 w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-700/15"
              />
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={payment.noTransferConfirmed}
                onChange={(event) => payment.setNoTransferConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4 accent-rose-700"
              />
              <span>No transfer was made for this withdrawal.</span>
            </label>
            <button
              type="button"
              disabled={!payment.publicReason.trim() || !payment.noTransferConfirmed || payment.busy !== "IDLE"}
              onClick={payment.rejectAndRefund}
              className="inline-flex min-h-11 items-center gap-2 border border-rose-300 px-4 text-sm font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={15} aria-hidden="true" /> Reject & refund
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
