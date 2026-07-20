import { useEffect, useState } from "react";
import {
  enforceAdminUserAccount,
  enforceAdminUserWallet,
  getAdminUserStatusHistory,
  getAdminUserWalletControl,
  getAdminUserWalletHistory,
} from "../../../api/adminUserApi";
import { StatusPill } from "../../../components/office/StatusPill";
import type {
  AccountEnforcementAction,
  AccountStatusHistoryItem,
  AdminUserDetail,
  WalletControl,
  WalletStatusHistoryItem,
} from "../../../types/adminUser";
import { AccountEnforcementModal } from "./AccountEnforcementModal";
import { WalletEnforcementModal } from "./WalletEnforcementModal";

function availableActions(status: string): AccountEnforcementAction[] {
  if (status === "ACTIVE") return ["suspend"];
  if (status === "SUSPENDED") return ["restore", "ban"];
  if (status === "BANNED") return ["reopen"];
  return [];
}

export function AccountEnforcementPanel({ user, isSelf, onChanged }: {
  user: AdminUserDetail;
  isSelf: boolean;
  onChanged: () => void;
}) {
  const [history, setHistory] = useState<AccountStatusHistoryItem[]>([]);
  const [wallet, setWallet] = useState<WalletControl | null>(null);
  const [walletHistory, setWalletHistory] = useState<WalletStatusHistoryItem[]>([]);
  const [action, setAction] = useState<AccountEnforcementAction | null>(null);
  const [walletAction, setWalletAction] = useState<"lock" | "unlock" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = async () => {
    const [control, timeline] = await Promise.all([
      getAdminUserWalletControl(user.id),
      getAdminUserWalletHistory(user.id),
    ]);
    setWallet(control);
    setWalletHistory(timeline);
  };

  useEffect(() => {
    void getAdminUserStatusHistory(user.id).then(setHistory).catch(() => setHistory([]));
    void loadWallet().catch(() => {
      setWallet(null);
      setWalletHistory([]);
    });
  }, [user.id, user.status]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Account enforcement</p>
          <div className="mt-2 flex items-center gap-3">
            <StatusPill status={user.status} />
            <span className="text-sm text-slate-600">Platform-level status</span>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-amber-800">
            Suspension does not disqualify the user, cancel an ongoing race, or rewrite results. Tournament discipline is a separate decision.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableActions(user.status).map((item) => (
            <button key={item} disabled={isSelf || (item === "suspend" && !wallet)} onClick={() => { setError(null); setAction(item); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black capitalize hover:bg-slate-50 disabled:opacity-40">
              {item}
            </button>
          ))}
        </div>
      </div>
      {isSelf && <p className="mt-3 text-xs font-semibold text-rose-600">Self-enforcement is disabled.</p>}

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black text-slate-900">Financial access</h3>
              {wallet && (
                <StatusPill
                  status={wallet.walletStatus}
                  label={wallet.canWithdraw ? "Withdrawals available" : "Withdrawals frozen"}
                  tone={wallet.canWithdraw ? "emerald" : "orange"}
                />
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              {wallet?.canWithdraw
                ? "Eligible withdrawals remain available. Account restrictions still block betting and top-ups."
                : "New withdrawals are blocked. Existing requests remain reviewable, and payout/refund credits are still recorded."}
            </p>
          </div>
          {wallet && (
            <button disabled={isSelf} onClick={() => { setError(null); setWalletAction(wallet.canWithdraw ? "lock" : "unlock"); }} className="shrink-0 rounded-full border border-slate-300 px-4 py-2 text-sm font-black hover:bg-slate-50 disabled:opacity-40">
              {wallet.canWithdraw ? "Freeze new withdrawals" : "Restore withdrawals"}
            </button>
          )}
        </div>
      </div>

      <Timeline title="Account status timeline" empty="No account enforcement decisions yet." items={history} />
      <Timeline title="Wallet status timeline" empty="No wallet restrictions yet." items={walletHistory} />

      {action && (
        <AccountEnforcementModal action={action} busy={busy} error={error} walletAlreadyLocked={wallet?.walletStatus === "LOCKED"} onClose={() => !busy && setAction(null)} onSubmit={async (data) => {
          setBusy(true);
          setError(null);
          try {
            await enforceAdminUserAccount(user.id, action, data);
            setAction(null);
            onChanged();
          } catch (cause: any) {
            setError(cause.response?.data?.message ?? "Unable to apply this decision");
          } finally {
            setBusy(false);
          }
        }} />
      )}

      {walletAction && (
        <WalletEnforcementModal action={walletAction} busy={busy} error={error} onClose={() => !busy && setWalletAction(null)} onSubmit={async (data) => {
          setBusy(true);
          setError(null);
          try {
            await enforceAdminUserWallet(user.id, walletAction, data);
            setWalletAction(null);
            await loadWallet();
          } catch (cause: any) {
            setError(cause.response?.data?.message ?? "Unable to update wallet access");
          } finally {
            setBusy(false);
          }
        }} />
      )}
    </section>
  );
}

function Timeline({ title, empty, items }: {
  title: string;
  empty: string;
  items: Array<AccountStatusHistoryItem | WalletStatusHistoryItem>;
}) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <strong>{item.oldStatus} → {item.newStatus}</strong>
              <span className="ml-2 text-slate-500">{new Date(item.changedAt).toLocaleString()}</span>
              <p className="mt-1 text-slate-700">{item.publicReason}</p>
              {item.internalNote && <p className="mt-1 text-xs text-slate-500">Internal: {item.internalNote}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
