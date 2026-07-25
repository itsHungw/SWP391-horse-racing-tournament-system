import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

const RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export function ReceiptUploader({
  receipt,
  disabled,
  onChange,
}: {
  receipt: File | null;
  disabled: boolean;
  onChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receipt || typeof URL.createObjectURL !== "function") {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(receipt);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);

  function select(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!RECEIPT_TYPES.has(file.type) || file.size > RECEIPT_MAX_BYTES) {
      setError("Choose a JPG, PNG or WebP image under 5 MB.");
      return;
    }
    onChange(file);
  }

  return (
    <section aria-labelledby="receipt-heading">
      <h4 id="receipt-heading" className="font-bold text-slate-900">Transfer receipt</h4>
      <p className="mt-1 text-xs text-slate-500">The image stays private. OCR runs in this browser.</p>

      {receipt ? (
        <div className="relative mt-4 overflow-hidden border border-slate-200 bg-slate-50 p-3">
          {preview ? <img src={preview} alt="Selected transfer receipt" className="max-h-52 w-full object-contain" /> : null}
          <p className="mt-2 truncate text-sm text-slate-600">{receipt.name}</p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(null)}
            aria-label="Remove receipt image"
            className="absolute right-2 top-2 grid h-11 w-11 place-items-center bg-slate-950/80 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-[#070f4f] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#070f4f]">
          <ImagePlus className="h-6 w-6 text-[#070f4f]" aria-hidden="true" />
          <span className="mt-2 text-sm font-bold text-slate-900">Choose receipt image</span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP · max 5 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Receipt image"
            disabled={disabled}
            onChange={(event) => select(event.target.files?.[0])}
            className="sr-only"
          />
        </label>
      )}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
