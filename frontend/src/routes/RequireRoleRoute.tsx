import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useClientSession } from "../hooks/useClientSession";
import { AccessDeniedPage } from "../pages/errors/AccessDeniedPage";

type RequireRoleRouteProps = {
  children: ReactNode;
  role: string;
  workspaceName: string;
};

export function RequireRoleRoute({ children, role, workspaceName }: RequireRoleRouteProps) {
  const { isAuthenticated, session, isInitializing } = useClientSession();
  const { hash, pathname, search } = useLocation();

  if (isInitializing) {
    return <div className="p-8 text-center text-slate-500">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: `${pathname}${search}${hash}` }}
      />
    );
  }

  const roles = new Set((session?.roles ?? []).map((item) => item.toUpperCase()));
  if (!roles.has(role.toUpperCase())) {
    return (
      <AccessDeniedPage
        embedded
        requiredRole={role}
        workspaceName={workspaceName}
        email={session?.email}
      />
    );
  }

  return children;
}
