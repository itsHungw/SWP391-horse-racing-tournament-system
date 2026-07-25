import { Check, Copy, Download, QrCode } from "lucide-react";
import { useRef, useState } from "react";
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
    <section aria-labelledby="payment-details-heading" className="border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center bg-slate-100 text-[#070f4f]">
          <QrCode className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 id="payment-details-heading" className="font-black text-[#070f4f]">Transfer details</h3>
          <p className="mt-0.5 text-xs text-slate-500">Generated from the approved destination snapshot.</p>
        </div>
      </div>

      {instruction.available && instruction.payload ? (
        <div className="mt-5 flex flex-col items-center border border-slate-200 bg-[#fafaf8] p-4 text-slate-950">
          <div className="bg-white p-2">
            <QRCodeCanvas
              ref={canvasRef}
              value={instruction.payload}
              size={232}
              level="M"
              marginSize={4}
              aria-label={`VietQR for withdrawal ${withdrawalId}`}
            />
          </div>
          <p className="mt-3 text-sm font-black text-[#070f4f]">VietQR · NAPAS 247</p>
          <p className="mt-1 text-center text-xs text-slate-500">Scan with a supported banking app.</p>
          <button
            type="button"
            onClick={downloadQr}
            className="mt-3 inline-flex min-h-11 items-center gap-2 border border-slate-300 px-4 text-sm font-bold text-[#070f4f] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#070f4f]"
          >
            <Download size={15} aria-hidden="true" /> Download QR
          </button>
        </div>
      ) : (
        <div className="mt-5 border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900">QR unavailable</p>
          <p className="mt-1 text-sm text-amber-800">Use the verified transfer details below.</p>
        </div>
      )}

      <dl className="mt-4 space-y-2.5">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-1 py-2.5">
          <div>
            <dt className="text-xs text-slate-500">Bank</dt>
            <dd className="text-sm font-bold text-slate-900">{instruction.bankName ?? instruction.bankCode ?? "—"}</dd>
          </div>
        </div>
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between gap-4 border-b border-slate-200 px-1 py-2.5 last:border-b-0">
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{field.label}</dt>
              <dd className="truncate font-mono text-sm font-bold text-slate-900">{field.value ?? "—"}</dd>
            </div>
            <button
              type="button"
              disabled={!field.value}
              onClick={() => copy(field.label, field.value)}
              aria-label={`Copy ${field.label.toLowerCase()}`}
              className="grid h-11 w-11 shrink-0 place-items-center text-slate-500 hover:bg-slate-100 hover:text-[#070f4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#070f4f] disabled:opacity-40"
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
