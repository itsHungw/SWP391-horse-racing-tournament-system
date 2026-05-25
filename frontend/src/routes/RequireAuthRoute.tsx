import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useClientSession } from "../hooks/useClientSession";

type RequireAuthRouteProps = {
  children: ReactNode;
};

export function RequireAuthRoute({ children }: RequireAuthRouteProps) {
  const { isAuthenticated } = useClientSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
