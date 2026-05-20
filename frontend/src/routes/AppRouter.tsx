import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { RoleDashboardPage } from "../pages/RoleDashboardPage";
import { HomePage } from "../pages/public/HomePage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="spectator"
          element={<RoleDashboardPage role="Spectator" />}
        />
        <Route path="owner" element={<RoleDashboardPage role="Owner" />} />
        <Route path="jockey" element={<RoleDashboardPage role="Jockey" />} />
        <Route path="referee" element={<RoleDashboardPage role="Referee" />} />
        <Route path="admin" element={<RoleDashboardPage role="Admin" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
