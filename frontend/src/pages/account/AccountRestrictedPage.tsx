import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getAccountRestriction, type AccountRestriction } from "../../api/accountRestrictionApi";
import { useClientSession } from "../../hooks/useClientSession";

export function AccountRestrictedPage() {
  const { session, logout } = useClientSession();
  const [restriction, setRestriction] = useState<AccountRestriction | null>(null);

  useEffect(() => {
    if (session?.accountStatus !== "ACTIVE") {
      void getAccountRestriction().then(setRestriction).catch(() => undefined);
    }
  }, [session?.accountStatus]);

  if (!session) return <Navigate to="/login" replace />;
  if (session.accountStatus === "ACTIVE") return <Navigate to="/" replace />;

  const banned = session.accountStatus === "BANNED";
  return (
    <main className="mx-auto flex min-h-[75vh] max-w-4xl items-center px-5 py-16">
      <section className="w-full overflow-hidden rounded-[2rem] border border-amber-200 bg-white shadow-2xl shadow-amber-950/10">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-7 py-10 text-white md:px-12">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-amber-300">Account status</p>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">{banned ? "Account restricted" : "Account under review"}</h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            {banned ? "Your workspace access is restricted, but your balance and financial resolution remain available." : "You can review your data while business changes are temporarily paused."}
          </p>
        </div>
        <div className="grid gap-6 p-7 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="font-black text-slate-900">Decision details</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{restriction?.publicReason ?? "Contact platform support for decision details."}</p>
            {restriction?.effectiveAt && <p className="mt-3 text-xs text-slate-500">Effective {new Date(restriction.effectiveAt).toLocaleString()}</p>}
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm font-bold text-slate-900">Wallet: {restriction?.walletStatus ?? "Checking…"}</p>
            <p className="mt-2 text-sm text-slate-600">Race settlement and refunds are preserved. A locked wallet cannot start new money movements.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Link to="/wallet" className="rounded-full bg-amber-500 px-5 py-3 text-sm font-black text-slate-950">Wallet & withdrawals</Link>
            <button onClick={logout} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700">Log out</button>
          </div>
        </div>
      </section>
    </main>
  );
}
