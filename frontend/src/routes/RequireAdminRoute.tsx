import { ReactNode } from "react";

import { RequireRoleRoute } from "./RequireRoleRoute";

type RequireAdminRouteProps = {
  children: ReactNode;
};

export function RequireAdminRoute({ children }: RequireAdminRouteProps) {
  return (
    <RequireRoleRoute role="ADMIN" workspaceName="Admin Operations">
      {children}
    </RequireRoleRoute>
  );
}
