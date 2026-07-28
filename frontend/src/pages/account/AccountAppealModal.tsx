import { useEffect, useRef, useState } from "react";
import { AlertCircle, FileImage, Loader2, ShieldAlert, X } from "lucide-react";
import type { AccountAppeal } from "../../api/accountAppealApi";
import { disputeApi } from "../../api/disputeApi";

type Props = { data: AccountAppeal; onClose: () => void; onSubmit: (description: string, evidenceUrls: string[]) => Promise<void> };

export function AccountAppealModal({ data, onClose, onSubmit }: Props) {
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [busy, onClose]);

  const submit = async () => {
    if (!description.trim()) { setError("Explain why this decision should be reviewed."); return; }
    setBusy(true); setError("");
    try { await onSubmit(description.trim(), evidenceUrls); } catch { setError("We could not submit your appeal. Your explanation is still here—please try again."); setBusy(false); }
  };

  const upload = async (file?: File) => {
    if (!file || evidenceUrls.length >= 5) return;
    setUploading(true); setError("");
    try { const result = await disputeApi.uploadEvidence(file); setEvidenceUrls((urls) => [...urls, result.url]); }
    catch { setError("The evidence could not be uploaded. Try a different image."); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/75 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="appeal-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-xl sm:rounded-[2rem]">
        <header className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white sm:px-8">
          <div aria-hidden="true" className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[24px] border-amber-400/15" />
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-400">Independent review</p>
          <h2 id="appeal-title" className="mt-2 text-2xl font-black">Appeal this decision</h2>
          <button type="button" onClick={onClose} disabled={busy} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><X className="h-5 w-5" aria-hidden="true" /><span className="sr-only">Close appeal form</span></button>
        </header>
        <div className="space-y-5 p-6 sm:p-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Decision being appealed · {data.decisionStatus}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{data.decisionReason}</p>
            <p className="mt-2 text-xs text-slate-500">Effective {new Date(data.decisionAt).toLocaleString()}</p>
          </div>
          <label className="block"><span className="text-sm font-black text-slate-900">Your explanation</span><span className="ml-1 text-red-700" aria-hidden="true">*</span>
            <textarea ref={textAreaRef} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={6} placeholder="Describe what happened, why the decision should be reviewed, and any context the team should verify…" className="mt-2 w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100" />
            <span className="mt-1 block text-right text-xs text-slate-400">{description.length}/3000</span>
          </label>
          <div>
            <p className="text-sm font-black text-slate-900">Evidence <span className="font-normal text-slate-500">(optional, up to 5 images)</span></p>
            <label className="mt-2 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:border-amber-500 hover:bg-amber-50"><FileImage className="h-4 w-4" aria-hidden="true" />{uploading ? "Uploading…" : "Add supporting image"}<input type="file" accept="image/*" disabled={uploading || busy || evidenceUrls.length >= 5} onChange={(event) => void upload(event.target.files?.[0])} className="sr-only" /></label>
            {evidenceUrls.length > 0 && <p className="mt-2 text-xs font-semibold text-emerald-700">{evidenceUrls.length} image{evidenceUrls.length > 1 ? "s" : ""} attached</p>}
          </div>
          <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm leading-5 text-amber-950"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>Submitting starts a review. It does not automatically unlock your account or wallet.</p></div>
          {error && <p role="alert" className="flex gap-2 text-sm font-semibold text-red-700"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={busy} className="min-h-11 rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700">Cancel</button><button type="button" onClick={() => void submit()} disabled={busy || uploading} className="min-h-11 rounded-full bg-red-800 px-6 py-3 text-sm font-black text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60">{busy ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Submitting…</span> : "Submit appeal"}</button></div>
        </div>
      </section>
    </div>
  );
}
