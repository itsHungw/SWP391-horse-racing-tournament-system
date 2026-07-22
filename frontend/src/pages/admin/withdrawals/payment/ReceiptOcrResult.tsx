import type { ReceiptExtraction } from "./receiptFieldExtractor";

export function ReceiptOcrResult({
  extraction,
  transferReference,
  onReferenceChange,
  comparison,
  mismatchAcknowledged,
  onMismatchAcknowledged,
  internalNote,
  onInternalNoteChange,
}: {
  extraction: ReceiptExtraction;
  transferReference: string;
  onReferenceChange: (value: string) => void;
  comparison: { amount: boolean | null; transferContent: boolean | null };
  mismatchAcknowledged: boolean;
  onMismatchAcknowledged: (value: boolean) => void;
  internalNote: string;
  onInternalNoteChange: (value: string) => void;
}) {
  const mismatch = comparison.amount === false || comparison.transferContent === false;

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ivory">OCR result</p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
          extraction.confidence === "HIGH"
            ? "bg-emerald-400/10 text-emerald-200"
            : "bg-amber-300/10 text-amber-100"
        }`}>
          {extraction.confidence.toLowerCase()} confidence
        </span>
      </div>

      {extraction.referenceCandidates.length > 1 ? (
        <div>
          <p className="text-xs text-ivory-faint">Detected references</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {extraction.referenceCandidates.map((candidate) => (
              <button
                key={candidate.value}
                type="button"
                onClick={() => onReferenceChange(candidate.value)}
                className="min-h-11 rounded-lg border border-white/10 px-3 font-data text-xs text-ivory hover:border-gold-400/50"
              >
                {candidate.value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs font-semibold text-ivory-dim">Transaction reference</span>
        <input
          value={transferReference}
          onChange={(event) => onReferenceChange(event.target.value.toUpperCase())}
          maxLength={120}
          className="mt-1.5 min-h-11 w-full rounded-lg border border-white/10 bg-turf-950 px-3 font-data text-sm text-ivory focus:border-gold-400 focus:outline-none"
        />
      </label>

      <dl className="grid gap-2 sm:grid-cols-2">
        <MatchField label="Amount" value={extraction.amount == null ? "Not detected" : `${extraction.amount.toLocaleString("en-US")} VND`} match={comparison.amount} />
        <MatchField label="Transfer content" value={extraction.transferContent ?? "Not detected"} match={comparison.transferContent} />
      </dl>

      {mismatch ? (
        <div className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3">
          <label className="flex min-h-11 items-start gap-3 text-sm text-amber-50">
            <input
              type="checkbox"
              checked={mismatchAcknowledged}
              onChange={(event) => onMismatchAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 accent-amber-300"
            />
            <span>I reviewed the mismatch and still want to confirm this payment.</span>
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-amber-100">Internal mismatch note</span>
            <textarea
              value={internalNote}
              onChange={(event) => onInternalNoteChange(event.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-1.5 w-full rounded-lg border border-amber-200/20 bg-turf-950 px-3 py-2 text-sm text-ivory focus:border-amber-300 focus:outline-none"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function MatchField({ label, value, match }: { label: string; value: string; match: boolean | null }) {
  return (
    <div className="rounded-lg border border-white/8 px-3 py-2.5">
      <dt className="text-xs text-ivory-faint">{label}</dt>
      <dd className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-ivory">
        <span className="truncate">{value}</span>
        <span className={match === false ? "text-rose-300" : match === true ? "text-emerald-200" : "text-ivory-faint"}>
          {match === false ? "Mismatch" : match === true ? "Match" : "Check manually"}
        </span>
      </dd>
    </div>
  );
}
