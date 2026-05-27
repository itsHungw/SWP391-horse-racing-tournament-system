import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useClientSession } from "../hooks/useClientSession";

type RequireRefereeRouteProps = {
  children: ReactNode;
};

export function RequireRefereeRoute({ children }: RequireRefereeRouteProps) {
  const { isAuthenticated, session } = useClientSession();

  if (!isAuthenticated || !session || !session.roles.includes("REFEREE")) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
