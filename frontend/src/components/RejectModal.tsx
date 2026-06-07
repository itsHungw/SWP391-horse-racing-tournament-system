import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
};

export function RejectModal({ isOpen, onClose, onConfirm, isSubmitting }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="reject-modal-title"
        className="w-full max-w-md rounded-lg border border-[#d8d8d8] bg-white p-6 shadow-xl"
        role="dialog"
      >
        <h2 id="reject-modal-title" className="text-xl font-black text-[#171717]">
          Reject Role Request
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add a clear reason so the user understands what to fix before submitting another request.
        </p>

        <form className="mt-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-xs font-black uppercase tracking-[0.14em] text-slate-600"
              htmlFor="reject-reason"
            >
              Rejection reason
            </label>
            <textarea
              className="mt-2 block w-full rounded-md border border-[#bdbdbd] px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-[#b3193a] focus:outline-none focus:ring-1 focus:ring-[#b3193a]"
              disabled={isSubmitting}
              id="reject-reason"
              onChange={(event) => {
                setReason(event.target.value);
                if (event.target.value.trim()) setError("");
              }}
              placeholder="Example: Resume document is missing or does not match the requested role."
              rows={4}
              value={reason}
            />
            {error && (
              <p className="mt-2 text-xs font-bold text-[#b3193a]" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              className="min-h-11 rounded-md border border-[#070f4f] bg-white px-4 text-sm font-black text-[#070f4f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a]"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-md bg-[#b3193a] px-4 text-sm font-black text-white hover:bg-[#8f1430] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3193a] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting..." : "Confirm Rejection"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
