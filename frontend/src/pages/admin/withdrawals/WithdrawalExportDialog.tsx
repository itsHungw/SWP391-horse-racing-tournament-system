import { AlertTriangle, Download, FileSpreadsheet, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { adminWalletApi } from "../../../api/adminWalletApi";
import type { WithdrawalExportFilters, WithdrawalExportPreview } from "../../../types/wallet";

export function WithdrawalExportDialog({
  open,
  filters,
  onClose,
}: {
  open: boolean;
  filters: WithdrawalExportFilters;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<WithdrawalExportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const downloadingRef = useRef(false);
  downloadingRef.current = downloading;

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setAck(false);
    setError(null);
    setLoading(true);
    adminWalletApi.getExportPreview(filters)
      .then(setPreview)
      .catch(() => setError("Export preview could not be loaded."))
      .finally(() => setLoading(false));
  }, [filters, open]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !downloadingRef.current) {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])',
      )];
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
      document.body.style.overflow = priorOverflow;
      previousFocus.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  async function download() {
    setDownloading(true);
    setError(null);
    try {
      const result = await adminWalletApi.downloadExport(filters);
      if (typeof URL.createObjectURL === "function") {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch {
      setError("Download failed. The preview is still available; try again.");
    } finally {
      setDownloading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close export dialog"
        onClick={() => { if (!downloading) onClose(); }}
        className="absolute inset-0 bg-slate-950/70"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-export-title"
        className="relative w-full max-w-lg border-t-4 border-[#b3193a] bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <FileSpreadsheet className="h-7 w-7 text-[#b3193a]" aria-hidden="true" />
            <h2 id="withdrawal-export-title" className="mt-3 text-2xl font-black text-[#070f4f]">
              Export settlement workbook
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Three focused sheets separate payment work, paid evidence and the masked operations archive.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={downloading}
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <p role="status" className="mt-8 flex items-center gap-2 font-bold text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Preparing preview…
          </p>
        ) : preview ? (
          <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            <PreviewRow
              label="Payment queue"
              value={preview.paymentQueueRows}
              description="Approved payouts with full transfer details"
            />
            <PreviewRow
              label="Paid reconciliation"
              value={preview.paidReconciliationRows}
              description="Paid payouts with receipt links and references"
            />
            <PreviewRow
              label="Operations archive"
              value={preview.operationsRows}
              description="All matching statuses with masked destinations"
            />
          </dl>
        ) : null}

        {preview?.containsSensitiveData ? (
          <>
            <div className="mt-5 flex gap-3 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                <strong>Contains full bank account details.</strong> Store and share the first two sheets only through approved finance channels.
              </p>
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm font-bold text-slate-800">
              <input
                type="checkbox"
                checked={ack}
                onChange={(event) => setAck(event.target.checked)}
                className="mt-0.5 h-5 w-5"
              />
              I understand this export contains sensitive data.
            </label>
          </>
        ) : null}

        {error ? <p role="alert" className="mt-5 text-sm font-bold text-rose-700">{error}</p> : null}
        <button
          type="button"
          onClick={() => void download()}
          disabled={!preview || downloading || Boolean(preview.containsSensitiveData && !ack)}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#070f4f] px-4 text-sm font-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f] disabled:bg-slate-300"
        >
          {downloading ? (
            <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {downloading ? "Generating workbook…" : error ? "Retry download" : "Download workbook"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

function PreviewRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
      <div>
        <dt className="text-sm font-black text-slate-900">{label}</dt>
        <dd className="mt-0.5 text-xs leading-5 text-slate-500">{description}</dd>
      </div>
      <dd className="font-mono text-xl font-black tabular-nums text-[#070f4f]">{value}</dd>
    </div>
  );
}
