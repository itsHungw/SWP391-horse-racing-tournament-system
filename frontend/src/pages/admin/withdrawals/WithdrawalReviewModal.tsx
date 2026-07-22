import { CheckCircle2, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { adminWalletApi } from "../../../api/adminWalletApi";
import { AuthenticatedImage } from "../../../components/AuthenticatedImage";
import type { AdminWithdrawalReview } from "../../../types/wallet";
import { WithdrawalDecisionPanel } from "./WithdrawalDecisionPanel";
import { WithdrawalPaymentStep } from "./payment/WithdrawalPaymentStep";
import type { PaymentStepState } from "./payment/useWithdrawalPayment";
import { WithdrawalCompactSummary } from "./WithdrawalCompactSummary";
import { formatAdminDateTime, formatVnd, statusPresentation } from "./withdrawalViewModel";
import { WithdrawalRiskPanel } from "./WithdrawalRiskPanel";
import { WithdrawalTimeline } from "./WithdrawalTimeline";
import { WithdrawalWizardStepper } from "./WithdrawalWizardStepper";

const IDLE_WORKFLOW: PaymentStepState = { dirty: false, busy: false };

export function WithdrawalReviewModal({
  id,
  onClose,
  onUpdated,
}: {
  id: number | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [review, setReview] = useState<AdminWithdrawalReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<PaymentStepState>(IDLE_WORKFLOW);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dirtyRef = useRef(false);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    setLoadError(null);
    try {
      setReview(await adminWalletApi.getReview(id));
      setWorkflow(IDLE_WORKFLOW);
    } catch {
      setLoadError("Review details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setReview(null);
    setLoadError(null);
    setWorkflow(IDLE_WORKFLOW);
    setConfirmDiscard(false);
    if (id !== null) void load();
  }, [id, load]);

  dirtyRef.current = workflow.dirty;
  busyRef.current = workflow.busy;

  const requestClose = useCallback(() => {
    if (busyRef.current) return;
    if (dirtyRef.current) setConfirmDiscard(true);
    else onClose();
  }, [onClose]);

  useEffect(() => {
    if (id === null) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("button, input, textarea")?.focus();
    }, 0);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [id, requestClose]);

  const handleStateChange = useCallback((state: PaymentStepState) => {
    setWorkflow((current) => current.dirty === state.dirty && current.busy === state.busy ? current : state);
  }, []);

  const handleUpdated = useCallback((updated: AdminWithdrawalReview) => {
    setReview(updated);
    setWorkflow(IDLE_WORKFLOW);
    onUpdated();
  }, [onUpdated]);

  const handleConflict = useCallback(async () => {
    await load();
    onUpdated();
  }, [load, onUpdated]);

  if (id === null) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-6">
      <button type="button" tabIndex={-1} data-testid="withdrawal-review-backdrop" aria-label="Close withdrawal review" onClick={requestClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="withdrawal-review-title" aria-describedby="withdrawal-review-description" className="relative flex h-full w-full flex-col overflow-hidden bg-[#f6f5f2] shadow-2xl sm:max-h-[92vh] sm:w-[min(1180px,calc(100vw-48px))] sm:border sm:border-white/20">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 bg-[#070f4f] px-5 py-4 text-white sm:px-7">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-rose-300">Payout control · WD-{String(id).padStart(6, "0")}</p>
            <h2 id="withdrawal-review-title" className="mt-1 text-2xl font-black">Withdrawal #{id} review</h2>
            <p id="withdrawal-review-description" className="mt-1 text-sm text-blue-100/70">Review, transfer and reconcile in one continuous flow.</p>
          </div>
          <button type="button" aria-label="Close review" onClick={requestClose} disabled={workflow.busy} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>

        {review ? <WithdrawalWizardStepper status={review.status} /> : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div role="status" className="flex min-h-80 items-center justify-center gap-3 font-bold text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading review…</div>
          ) : loadError && !review ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <p role="alert" className="font-bold text-rose-700">{loadError}</p>
              <button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 bg-[#070f4f] px-4 text-sm font-black text-white"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Retry</button>
            </div>
          ) : review ? (
            <ReviewWorkspace review={review} onUpdated={handleUpdated} onConflict={handleConflict} onStateChange={handleStateChange} />
          ) : null}
        </div>

        {confirmDiscard ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55 p-5">
            <div role="dialog" aria-modal="true" aria-label="Discard unsaved review changes" className="w-full max-w-sm bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-950">Discard unsaved review changes?</h3>
              <p className="mt-2 text-sm text-slate-600">The current notes or receipt selection will be cleared.</p>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDiscard(false)} className="min-h-11 border border-slate-300 px-4 text-sm font-black">Keep reviewing</button>
                <button type="button" onClick={onClose} className="min-h-11 bg-[#b3193a] px-4 text-sm font-black text-white">Discard</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function ReviewWorkspace({
  review,
  onUpdated,
  onConflict,
  onStateChange,
}: {
  review: AdminWithdrawalReview;
  onUpdated: (review: AdminWithdrawalReview) => void;
  onConflict: () => Promise<void>;
  onStateChange: (state: PaymentStepState) => void;
}) {
  if (review.status === "REQUESTED") {
    return (
      <RequestedReviewWorkspace
        review={review}
        onUpdated={onUpdated}
        onConflict={onConflict}
        onStateChange={onStateChange}
      />
    );
  }

  if (review.status === "APPROVED") {
    return (
      <main className="space-y-5 p-5 sm:p-7">
        <WithdrawalCompactSummary review={review} />
        <WithdrawalPaymentStep
          review={review}
          onPaid={onUpdated}
          onStateChange={onStateChange}
          onConflict={onConflict}
        />
      </main>
    );
  }

  return <CompletedWithdrawalWorkspace review={review} />;
}

function RequestedReviewWorkspace({
  review,
  onUpdated,
  onConflict,
  onStateChange,
}: {
  review: AdminWithdrawalReview;
  onUpdated: (review: AdminWithdrawalReview) => void;
  onConflict: () => Promise<void>;
  onStateChange: (state: PaymentStepState) => void;
}) {
  return (
    <main className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]">
      <div className="space-y-6">
        <WithdrawalOverview review={review} />
        <WithdrawalRiskPanel risk={review.risk} />
        <UserContext review={review} />
      </div>
      <aside className="space-y-6">
        <WithdrawalDecisionPanel
          review={review}
          onUpdated={onUpdated}
          onConflict={onConflict}
          onStateChange={onStateChange}
        />
        <div className="border border-slate-200 bg-white p-5">
          <WithdrawalTimeline actions={review.actions} />
        </div>
      </aside>
    </main>
  );
}

function CompletedWithdrawalWorkspace({ review }: { review: AdminWithdrawalReview }) {
  return (
    <main className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      <CompletedPanel review={review} />
      <div className="border border-slate-200 bg-white p-5">
        <WithdrawalTimeline actions={review.actions} />
      </div>
    </main>
  );
}

function WithdrawalOverview({ review }: { review: AdminWithdrawalReview }) {
  return (
    <section className="border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold text-slate-500">{review.user.email}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{review.user.name}</h3><p className="mt-2 text-sm text-slate-500">Requested {formatAdminDateTime(review.requestedAt)}</p></div>
        <div className="text-right"><p className="text-3xl font-black tabular-nums text-[#070f4f]">{formatVnd(review.amount)}</p><span className={`mt-2 inline-flex border px-2 py-1 text-[10px] font-black uppercase ${statusPresentation[review.status].className}`}>{statusPresentation[review.status].label}</span></div>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
        <Info label="Bank" value={`${review.destination.bankName ?? "Legacy"} ${review.destination.bankCode ? `(${review.destination.bankCode})` : ""}`} />
        <Info label="Account holder" value={review.destination.accountHolder ?? "Unavailable"} />
        <Info label="Account number" value={review.destination.accountNumber ?? "Legacy destination"} mono />
      </dl>
    </section>
  );
}

function UserContext({ review }: { review: AdminWithdrawalReview }) {
  return (
    <section className="border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User context</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Wallet balance" value={formatVnd(review.wallet.balance)} />
        <Metric label="Requests" value={String(review.aggregates.requestCount)} />
        <Metric label="Paid" value={formatVnd(review.aggregates.totalPaid)} />
        <Metric label="Stopped" value={String(review.aggregates.rejectedOrCancelledCount)} />
      </div>
    </section>
  );
}

function CompletedPanel({ review }: { review: AdminWithdrawalReview }) {
  const paid = review.status === "PAID";
  return (
    <section className={`border p-5 ${paid ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
      <CheckCircle2 className={`h-6 w-6 ${paid ? "text-emerald-700" : "text-slate-600"}`} aria-hidden="true" />
      <h3 className="mt-3 text-xl font-black text-slate-950">{paid ? "Payment complete" : "Request closed"}</h3>
      <p className="mt-1 text-sm text-slate-700">This request is read-only. Its full history remains in the audit timeline.</p>
      <p className="mt-5 text-3xl font-black tabular-nums text-[#070f4f]">{formatVnd(review.amount)}</p>
      {review.paymentEvidence ? (
        <div className="mt-5 border-t border-emerald-200 pt-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">Private payment receipt</p>
          <AuthenticatedImage src={review.paymentEvidence.receiptUrl} alt={`Payment receipt for withdrawal ${review.id}`} className="mt-3 max-h-64 w-full bg-white object-contain" />
          <dl className="mt-3 space-y-2 text-xs"><Info label="Transfer reference" value={review.paymentEvidence.transferReference} mono /><Info label="Paid at" value={formatAdminDateTime(review.paymentEvidence.paidAt)} /></dl>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</dt><dd className={`mt-1 text-sm font-bold text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</dd></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-black tabular-nums text-slate-900">{value}</p></div>;
}
