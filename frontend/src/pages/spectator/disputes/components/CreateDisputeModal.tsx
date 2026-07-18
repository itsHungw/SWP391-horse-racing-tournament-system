import { useState } from "react";
import { X, Upload, FileUp, AlertCircle, Loader2 } from "lucide-react";
import { disputeApi, DisputeCategory, DisputeReferenceType } from "../../../../api/disputeApi";

interface CreateDisputeModalProps {
  referenceType: DisputeReferenceType;
  referenceId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateDisputeModal({
  referenceType,
  referenceId,
  isOpen,
  onClose,
  onSuccess,
}: CreateDisputeModalProps) {
  const [category, setCategory] = useState<DisputeCategory>("FINANCE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and detailed description.");
      return;
    }

    try {
      setError(null);
      setUploading(true);
      
      const evidenceUrls: string[] = [];
      for (const file of files) {
        const { url } = await disputeApi.uploadEvidence(file);
        evidenceUrls.push(url);
      }
      setUploading(false);

      setSubmitting(true);
      await disputeApi.createSpectatorDispute({
        referenceType,
        referenceId,
        category,
        title,
        description,
        evidenceUrls,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit dispute. Please try again.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-turf-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <h2 className="text-lg font-bold text-ivory">Report an Issue</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ivory-dim transition-colors hover:bg-white/10 hover:text-ivory"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-200">
            <p className="flex items-center gap-2">
              <AlertCircle size={16} />
              You are submitting a dispute for {referenceType.replace("_", " ")} #{referenceId}.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ivory-dim">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                className="w-full rounded-lg border border-white/10 bg-turf-950 px-4 py-2.5 text-sm text-ivory outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50"
              >
                <option value="FINANCE">Finance (Balance, Transaction)</option>
                <option value="PREDICTION">Prediction (Wrong payout, Status error)</option>
                <option value="SYSTEM">System/Technical Issue</option>
                <option value="GENERAL">General Support</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ivory-dim">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className="w-full rounded-lg border border-white/10 bg-turf-950 px-4 py-2.5 text-sm text-ivory outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ivory-dim">Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                className="w-full resize-none rounded-lg border border-white/10 bg-turf-950 px-4 py-2.5 text-sm text-ivory outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ivory-dim">Evidence (Optional)</label>
              <div className="rounded-lg border border-dashed border-white/20 bg-turf-950 p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-ivory hover:bg-white/10"
                >
                  <Upload size={16} />
                  Select Images
                </label>
                <p className="mt-2 text-xs text-ivory-faint">You can upload multiple screenshots</p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm text-ivory">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileUp size={14} className="text-gold-400 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-ivory-faint hover:text-rose-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-ivory-dim transition-colors hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex items-center gap-2 rounded-lg bg-gold-400 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-turf-950 transition-colors hover:bg-gold-300 disabled:opacity-50"
              >
                {(submitting || uploading) && <Loader2 size={16} className="animate-spin" />}
                {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
