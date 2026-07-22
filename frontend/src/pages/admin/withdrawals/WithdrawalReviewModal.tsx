import { ArrowLeft, CheckCircle2, LoaderCircle, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { adminWalletApi } from "../../../api/adminWalletApi";
import type { AdminWithdrawalReview } from "../../../types/wallet";
import { formatAdminDateTime, formatVnd, statusPresentation } from "./withdrawalViewModel";
import { WithdrawalRiskPanel } from "./WithdrawalRiskPanel";
import { WithdrawalTimeline } from "./WithdrawalTimeline";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"approve" | "reject" | "pay">("approve");
  const [internalNote, setInternalNote] = useState("");
  const [publicReason, setPublicReason] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dirtyRef = useRef(false);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    if (id === null) return;
    setLoading(true); setError(null);
    try { const data = await adminWalletApi.getReview(id); setReview(data); setMode(data.status === "APPROVED" ? "pay" : "approve"); }
    catch { setError("Review details could not be loaded."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { setReview(null); setInternalNote(""); setPublicReason(""); setTransferReference(""); setAcknowledged(false); setConfirmDiscard(false); if (id !== null) void load(); }, [id, load]);
  const dirty = Boolean(internalNote || publicReason || transferReference || acknowledged);
  dirtyRef.current = dirty;
  busyRef.current = busy;
  const requestClose = useCallback(() => { if (busyRef.current) return; if (dirtyRef.current) setConfirmDiscard(true); else onClose(); }, [onClose]);

  useEffect(() => {
    if (id === null) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("button, input, textarea")?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); requestClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href]')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", onKey); document.body.style.overflow = previousOverflow; previousFocus.current?.focus(); };
  }, [id, requestClose]);

  async function submit() {
    if (!review) return;
    setBusy(true); setError(null);
    try {
      let updated: AdminWithdrawalReview;
      if (mode === "approve") updated = await adminWalletApi.approve(review.id, { riskAcknowledged: acknowledged, internalNote: internalNote.trim() });
      else if (mode === "reject") updated = await adminWalletApi.reject(review.id, { publicReason: publicReason.trim(), internalNote: internalNote.trim() });
      else updated = await adminWalletApi.markPaid(review.id, { transferReference: transferReference.trim(), internalNote: internalNote.trim() });
      setReview(updated); setInternalNote(""); setPublicReason(""); setTransferReference(""); setAcknowledged(false); setMode(updated.status === "APPROVED" ? "pay" : "approve"); onUpdated();
    } catch (caught) {
      const status = (caught as { response?: { status?: number } }).response?.status;
      if (status === 409) { setError("This request changed while you were reviewing it. The latest state has been loaded."); await load(); onUpdated(); }
      else setError("The action could not be completed. Your notes are preserved.");
    } finally { setBusy(false); }
  }

  if (id === null) return null;
  const approveReady = review?.risk.level !== "HIGH" || (acknowledged && internalNote.trim().length > 0);
  const submitDisabled = busy || !review || (mode === "approve" && !approveReady) || (mode === "reject" && !publicReason.trim()) || (mode === "pay" && !transferReference.trim());

  return createPortal(<div className="fixed inset-0 z-[80] flex items-center justify-center p-0 sm:p-6"><button type="button" tabIndex={-1} data-testid="withdrawal-review-backdrop" aria-label="Close withdrawal review" onClick={requestClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" /><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="withdrawal-review-title" aria-describedby="withdrawal-review-description" className="relative flex h-full w-full flex-col overflow-hidden bg-[#f6f5f2] shadow-2xl sm:max-h-[88vh] sm:w-[min(1120px,calc(100vw-48px))] sm:border sm:border-white/20">
    <header className="flex items-start justify-between gap-5 border-b border-white/10 bg-[#070f4f] px-5 py-4 text-white sm:px-7"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-rose-300">Payout control · WD-{String(id).padStart(6, "0")}</p><h2 id="withdrawal-review-title" className="mt-1 text-2xl font-black">Withdrawal #{id} review</h2><p id="withdrawal-review-description" className="mt-1 text-sm text-blue-100/70">Evidence, destination and immutable decisions in one workspace.</p></div><button type="button" aria-label="Close review" onClick={requestClose} disabled={busy} className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40"><X className="h-5 w-5" /></button></header>
    <div className="min-h-0 flex-1 overflow-y-auto">{loading ? <div role="status" className="flex min-h-80 items-center justify-center gap-3 font-bold text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" /> Loading review…</div> : error && !review ? <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center"><p role="alert" className="font-bold text-rose-700">{error}</p><button type="button" onClick={() => void load()} className="mt-4 inline-flex min-h-11 items-center gap-2 bg-[#070f4f] px-4 text-sm font-black text-white"><RefreshCw className="h-4 w-4" /> Retry</button></div> : review ? <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.8fr)]"><main className="space-y-6"><section className="border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold text-slate-500">{review.user.email}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{review.user.name}</h3><p className="mt-2 text-sm text-slate-500">Requested {formatAdminDateTime(review.requestedAt)}</p></div><div className="text-right"><p className="text-3xl font-black tabular-nums text-[#070f4f]">{formatVnd(review.amount)}</p><span className={`mt-2 inline-flex border px-2 py-1 text-[10px] font-black uppercase ${statusPresentation[review.status].className}`}>{statusPresentation[review.status].label}</span></div></div><dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3"><Info label="Bank" value={`${review.destination.bankName ?? "Legacy"} ${review.destination.bankCode ? `(${review.destination.bankCode})` : ""}`} /><Info label="Account holder" value={review.destination.accountHolder ?? "Unavailable"} /><Info label="Account number" value={review.destination.accountNumber ?? "Legacy destination"} mono /></dl></section><WithdrawalRiskPanel risk={review.risk} /><section className="border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">User context</p><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="Wallet balance" value={formatVnd(review.wallet.balance)} /><Metric label="Requests" value={String(review.aggregates.requestCount)} /><Metric label="Paid" value={formatVnd(review.aggregates.totalPaid)} /><Metric label="Stopped" value={String(review.aggregates.rejectedOrCancelledCount)} /></div></section></main><aside className="space-y-6"><ActionPanel review={review} mode={mode} setMode={setMode} internalNote={internalNote} setInternalNote={setInternalNote} publicReason={publicReason} setPublicReason={setPublicReason} transferReference={transferReference} setTransferReference={setTransferReference} acknowledged={acknowledged} setAcknowledged={setAcknowledged} busy={busy} error={error} submitDisabled={submitDisabled} onSubmit={() => void submit()} /><div className="border border-slate-200 bg-white p-5"><WithdrawalTimeline actions={review.actions} /></div></aside></div> : null}</div>
    {confirmDiscard ? <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55 p-5"><div role="dialog" aria-modal="true" aria-label="Discard unsaved review changes" className="w-full max-w-sm bg-white p-6 shadow-2xl"><h3 className="text-xl font-black text-slate-950">Discard unsaved review changes?</h3><p className="mt-2 text-sm text-slate-600">Your action fields will be cleared.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmDiscard(false)} className="min-h-11 border border-slate-300 px-4 text-sm font-black">Keep reviewing</button><button type="button" onClick={onClose} className="min-h-11 bg-[#b3193a] px-4 text-sm font-black text-white">Discard</button></div></div></div> : null}
  </div></div>, document.body);
}

function ActionPanel(props: { review: AdminWithdrawalReview; mode: "approve" | "reject" | "pay"; setMode: (mode: "approve" | "reject" | "pay") => void; internalNote: string; setInternalNote: (value: string) => void; publicReason: string; setPublicReason: (value: string) => void; transferReference: string; setTransferReference: (value: string) => void; acknowledged: boolean; setAcknowledged: (value: boolean) => void; busy: boolean; error: string | null; submitDisabled: boolean; onSubmit: () => void }) {
  const { review, mode } = props; const terminal = ["PAID", "REJECTED", "CANCELLED"].includes(review.status);
  if (terminal) return <section className="border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="h-6 w-6 text-emerald-700" /><h3 className="mt-3 font-black text-emerald-950">Lifecycle complete</h3><p className="mt-1 text-sm text-emerald-800">This request is read-only. Its decision remains in the audit timeline.</p></section>;
  return <section className="border-t-4 border-[#b3193a] bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#b3193a]" /><h3 className="text-lg font-black text-[#070f4f]">Record a decision</h3></div>{review.status === "REQUESTED" ? <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => props.setMode("approve")} aria-pressed={mode === "approve"} className={`min-h-11 border px-3 text-xs font-black uppercase ${mode === "approve" ? "border-[#070f4f] bg-[#070f4f] text-white" : "border-slate-300"}`}>Approve</button><button type="button" onClick={() => props.setMode("reject")} aria-pressed={mode === "reject"} className={`min-h-11 border px-3 text-xs font-black uppercase ${mode === "reject" ? "border-[#b3193a] bg-[#b3193a] text-white" : "border-slate-300"}`}>Reject</button></div> : null}{mode === "reject" ? <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-600">Public reason<textarea value={props.publicReason} onChange={(e) => props.setPublicReason(e.target.value)} rows={3} className="mt-2 w-full border border-slate-300 p-3 text-sm font-normal normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b3193a]" /></label> : null}{mode === "pay" ? <label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-600">Bank transfer reference<input value={props.transferReference} onChange={(e) => props.setTransferReference(e.target.value)} className="mt-2 h-11 w-full border border-slate-300 px-3 font-mono text-sm font-normal normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#070f4f]" /></label> : null}<label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-600">Internal note<textarea value={props.internalNote} onChange={(e) => props.setInternalNote(e.target.value)} rows={3} className="mt-2 w-full border border-slate-300 p-3 text-sm font-normal normal-case tracking-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#070f4f]" /></label>{mode === "approve" && review.risk.level === "HIGH" ? <label className="mt-4 flex items-start gap-3 border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-900"><input type="checkbox" checked={props.acknowledged} onChange={(e) => props.setAcknowledged(e.target.checked)} className="mt-0.5 h-5 w-5" />I reviewed the risk flags and supporting evidence.</label> : null}{props.error ? <p role="alert" className="mt-4 text-sm font-bold text-rose-700">{props.error}</p> : null}<button type="button" disabled={props.submitDisabled} onClick={props.onSubmit} className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${mode === "reject" ? "bg-[#b3193a]" : "bg-[#070f4f]"}`}>{props.busy ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}{mode === "approve" ? "Approve withdrawal" : mode === "reject" ? "Reject withdrawal" : "Mark as paid"}</button></section>;
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div><dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</dt><dd className={`mt-1 text-sm font-bold text-slate-800 ${mono ? "font-mono" : ""}`}>{value}</dd></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-black tabular-nums text-slate-900">{value}</p></div>; }
