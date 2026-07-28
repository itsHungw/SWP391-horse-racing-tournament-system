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
    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-900">OCR result</p>
        <span className={`border px-2.5 py-1 text-xs font-bold ${
          extraction.confidence === "HIGH"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}>
          {extraction.confidence.toLowerCase()} confidence
        </span>
      </div>

      {extraction.referenceCandidates.length > 1 ? (
        <div>
          <p className="text-xs text-slate-500">Detected references</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {extraction.referenceCandidates.map((candidate) => (
              <button
                key={candidate.value}
                type="button"
                onClick={() => onReferenceChange(candidate.value)}
                className="min-h-11 border border-slate-300 px-3 font-mono text-xs text-slate-800 hover:border-[#070f4f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#070f4f]"
              >
                {candidate.value}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs font-semibold text-slate-600">Transaction reference</span>
        <input
          value={transferReference}
          onChange={(event) => onReferenceChange(event.target.value.toUpperCase())}
          maxLength={120}
          className="mt-1.5 min-h-11 w-full border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:border-[#070f4f] focus:outline-none focus:ring-2 focus:ring-[#070f4f]/15"
        />
      </label>

      <dl className="grid gap-2 sm:grid-cols-2">
        <MatchField label="Amount" value={extraction.amount == null ? "Not detected" : `${extraction.amount.toLocaleString("en-US")} VND`} match={comparison.amount} />
        <MatchField label="Transfer content" value={extraction.transferContent ?? "Not detected"} match={comparison.transferContent} />
      </dl>

      {mismatch ? (
        <div className="border border-amber-200 bg-amber-50 p-3">
          <label className="flex min-h-11 items-start gap-3 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={mismatchAcknowledged}
              onChange={(event) => onMismatchAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 accent-amber-700"
            />
            <span>I reviewed the mismatch and still want to confirm this payment.</span>
          </label>
          <label className="mt-3 block">
            <span className="text-xs font-semibold text-amber-900">Internal mismatch note</span>
            <textarea
              value={internalNote}
              onChange={(event) => onInternalNoteChange(event.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-1.5 w-full border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-700/15"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

function MatchField({ label, value, match }: { label: string; value: string; match: boolean | null }) {
  return (
    <div className="border border-slate-200 px-3 py-2.5">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
        <span className="truncate">{value}</span>
        <span className={match === false ? "text-rose-700" : match === true ? "text-emerald-700" : "text-slate-500"}>
          {match === false ? "Mismatch" : match === true ? "Match" : "Check manually"}
        </span>
      </dd>
    </div>
  );
}
