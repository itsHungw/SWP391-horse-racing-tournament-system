import { useState, useRef } from "react";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import type { WithdrawalPaymentInstruction } from "../../../../types/wallet";

export function VietQrCard({
  instruction,
  withdrawalId,
}: {
  instruction: WithdrawalPaymentInstruction;
  withdrawalId: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string | null) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  function downloadQr() {
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `withdrawal-${withdrawalId}-vietqr.png`;
    anchor.click();
  }

  const fields = [
    { label: "Account number", value: instruction.accountNumber },
    { label: "Account holder", value: instruction.accountHolder },
    { label: "Transfer content", value: instruction.transferContent },
  ];

  return (
    <section aria-labelledby="payment-details-heading" className="rounded-2xl border border-white/10 bg-[#071a15] p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400/10 text-gold-300">
          <QrCode className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 id="payment-details-heading" className="font-semibold text-ivory">Payment details</h3>
          <p className="text-xs text-ivory-faint">Generated from the approved destination snapshot.</p>
        </div>
      </div>

      {instruction.available && instruction.payload ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-white p-4 text-turf-950">
          <QRCodeCanvas
            ref={canvasRef}
            value={instruction.payload}
            size={232}
            level="M"
            marginSize={4}
            aria-label={`VietQR for withdrawal ${withdrawalId}`}
          />
          <button
            type="button"
            onClick={downloadQr}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-turf-950/15 px-4 text-xs font-bold uppercase tracking-[0.1em]"
          >
            <Download size={15} aria-hidden="true" /> Download QR
          </button>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
          <p className="font-semibold text-amber-100">QR unavailable</p>
          <p className="mt-1 text-sm text-amber-100/70">Use the verified transfer details below.</p>
        </div>
      )}

      <dl className="mt-4 space-y-2.5">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-black/10 px-3 py-2.5">
          <div><dt className="text-xs text-ivory-faint">Bank</dt><dd className="text-sm font-semibold text-ivory">{instruction.bankName ?? instruction.bankCode ?? "—"}</dd></div>
        </div>
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-black/10 px-3 py-2.5">
            <div className="min-w-0">
              <dt className="text-xs text-ivory-faint">{field.label}</dt>
              <dd className="truncate font-data text-sm font-semibold text-ivory">{field.value ?? "—"}</dd>
            </div>
            <button
              type="button"
              disabled={!field.value}
              onClick={() => copy(field.label, field.value)}
              aria-label={`Copy ${field.label.toLowerCase()}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ivory-dim hover:bg-white/5 hover:text-ivory disabled:opacity-40"
            >
              {copied === field.label ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            </button>
          </div>
        ))}
      </dl>
      <p role="status" aria-live="polite" className="sr-only">{copied ? `${copied} copied` : ""}</p>
    </section>
  );
}
