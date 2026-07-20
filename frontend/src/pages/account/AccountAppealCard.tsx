import { CheckCircle2, Clock3, FileSearch, MessageSquareWarning } from "lucide-react";
import type { AccountAppeal } from "../../api/accountAppealApi";

type Props = { data: AccountAppeal; onAppeal: () => void };

export function AccountAppealCard({ data, onAppeal }: Props) {
  const appeal = data.appeal;
  const reviewing = appeal && ["OPEN", "IN_PROGRESS", "ESCALATED"].includes(appeal.status);
  const resolved = appeal?.status === "RESOLVED";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-35px_rgba(15,23,42,.65)] md:p-7">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-400 to-red-700" />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-red-800">
            <MessageSquareWarning className="h-4 w-4" aria-hidden="true" /> Decision appeal
          </p>
          {!appeal && (
            <>
              <h2 className="mt-3 text-xl font-black text-slate-950">Think this decision needs another look?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Send one clear appeal for this decision. Include context and evidence that helps the review team verify your case.</p>
            </>
          )}
          {reviewing && (
            <>
              <h2 className="mt-3 flex items-center gap-2 text-xl font-black text-slate-950"><Clock3 className="h-5 w-5 text-amber-600" aria-hidden="true" /> Under review</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Your appeal was received on {new Date(appeal.createdAt).toLocaleString()}. You do not need to submit it again.</p>
            </>
          )}
          {appeal && !reviewing && (
            <>
              <h2 className="mt-3 flex items-center gap-2 text-xl font-black text-slate-950">{resolved ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <FileSearch className="h-5 w-5 text-red-700" aria-hidden="true" />} Appeal {resolved ? "resolved" : "closed"}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{appeal.resolutionNote || "The review is complete. Contact support if you need clarification about the outcome."}</p>
            </>
          )}
        </div>
        {!appeal && <button type="button" onClick={onAppeal} className="min-h-11 shrink-0 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 motion-reduce:transform-none">Submit an appeal</button>}
      </div>
      <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">An appeal starts a review; it does not automatically restore account or wallet access.</p>
    </section>
  );
}
