import { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";

import { useClientSession } from "../hooks/useClientSession";

type RequireRoleRouteProps = {
  children: ReactNode;
  role: string;
  workspaceName: string;
};

export function RequireRoleRoute({ children, role, workspaceName }: RequireRoleRouteProps) {
  const { isAuthenticated, session, isInitializing } = useClientSession();

  if (isInitializing) {
    return <div className="p-8 text-center text-slate-500">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const roles = new Set((session?.roles ?? []).map((item) => item.toUpperCase()));
  if (!roles.has(role.toUpperCase())) {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-6 py-16">
        <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b3193a]">Workspace access</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{workspaceName} is not active</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This account does not have the active {role.replace("_", " ").toLowerCase()} role required for this
            workspace. If the role was just approved, sign out and sign in again so your session can refresh.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/my-role-requests"
              className="inline-flex min-h-10 items-center rounded-md bg-[#b3193a] px-4 text-sm font-black text-white hover:bg-[#92122d]"
            >
              Review Role Requests
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Back Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
