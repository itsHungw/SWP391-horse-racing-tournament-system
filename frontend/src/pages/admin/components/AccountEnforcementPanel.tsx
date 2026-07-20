import { useEffect, useState } from "react";
import { enforceAdminUserAccount, getAdminUserStatusHistory } from "../../../api/adminUserApi";
import type { AccountEnforcementAction, AccountStatusHistoryItem, AdminUserDetail } from "../../../types/adminUser";
import { AccountEnforcementModal } from "./AccountEnforcementModal";

function availableActions(status: string): AccountEnforcementAction[] {
  if (status === "ACTIVE") return ["suspend"];
  if (status === "SUSPENDED") return ["restore", "ban"];
  if (status === "BANNED") return ["reopen"];
  return [];
}

export function AccountEnforcementPanel({ user, isSelf, onChanged }: { user: AdminUserDetail; isSelf: boolean; onChanged: () => void }) {
  const [history, setHistory] = useState<AccountStatusHistoryItem[]>([]);
  const [action, setAction] = useState<AccountEnforcementAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void getAdminUserStatusHistory(user.id).then(setHistory).catch(() => setHistory([])); }, [user.id, user.status]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Account enforcement</p>
          <div className="mt-2 flex items-center gap-3"><span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{user.status}</span><span className="text-sm text-slate-600">Platform-level status</span></div>
          <p className="mt-3 max-w-2xl text-sm text-amber-800">Suspending an account does not disqualify the user, cancel an ongoing race, or rewrite results. Tournament discipline is a separate explicit decision.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableActions(user.status).map((item) => <button key={item} disabled={isSelf} onClick={() => { setError(null); setAction(item); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black capitalize hover:bg-slate-50 disabled:opacity-40">{item}</button>)}
        </div>
      </div>
      {isSelf && <p className="mt-3 text-xs font-semibold text-rose-600">Self-enforcement is disabled.</p>}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-black text-slate-900">Status timeline</h3>
        {history.length === 0 ? <p className="mt-2 text-sm text-slate-500">No enforcement decisions yet.</p> : <ol className="mt-3 space-y-3">{history.map((item) => <li key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{item.oldStatus} → {item.newStatus}</strong><span className="ml-2 text-slate-500">{new Date(item.changedAt).toLocaleString()}</span><p className="mt-1 text-slate-700">{item.publicReason}</p>{item.internalNote && <p className="mt-1 text-xs text-slate-500">Internal: {item.internalNote}</p>}</li>)}</ol>}
      </div>
      {action && <AccountEnforcementModal action={action} busy={busy} error={error} onClose={() => !busy && setAction(null)} onSubmit={async (data) => {
        setBusy(true); setError(null);
        try { await enforceAdminUserAccount(user.id, action, data); setAction(null); onChanged(); }
        catch (cause: any) { setError(cause.response?.data?.message ?? "Unable to apply this decision"); }
        finally { setBusy(false); }
      }} />}
    </section>
  );
}
