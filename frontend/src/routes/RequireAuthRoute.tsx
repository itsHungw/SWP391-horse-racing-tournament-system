import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useClientSession } from "../hooks/useClientSession";

type RequireAuthRouteProps = {
  children: ReactNode;
};

export function RequireAuthRoute({ children }: RequireAuthRouteProps) {
  const { isAuthenticated, isInitializing } = useClientSession();

  if (isInitializing) {
    return <div className="p-8 text-center text-slate-500">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
