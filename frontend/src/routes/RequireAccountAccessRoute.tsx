import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useClientSession } from "../hooks/useClientSession";

export function RequireAccountAccessRoute({ children }: { children: ReactNode }) {
  const { session } = useClientSession();
  const location = useLocation();
  if (session?.accountStatus === "BANNED") {
    return <Navigate to="/account-restricted" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
