import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useClientSession } from "../hooks/useClientSession";

type RequireAuthRouteProps = {
  children: ReactNode;
};

export function RequireAuthRoute({ children }: RequireAuthRouteProps) {
  const { isAuthenticated, isInitializing } = useClientSession();
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

  return children;
}
