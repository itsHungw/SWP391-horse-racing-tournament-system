import { Navigate } from "react-router-dom";

import { AdminForbiddenPage } from "../pages/errors/AdminForbiddenPage";
import { useClientSession } from "../hooks/useClientSession";
import { ReactNode } from "react";

type RequireAdminRouteProps = {
  children: ReactNode;
};

export function RequireAdminRoute({ children }: RequireAdminRouteProps) {
  const { isAuthenticated, session } = useClientSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!session?.roles.includes("ADMIN")) {
    return <AdminForbiddenPage />;
  }

  return children;
}
