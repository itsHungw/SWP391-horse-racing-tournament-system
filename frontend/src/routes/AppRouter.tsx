import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { RoleDashboardPage } from "../pages/RoleDashboardPage";
import { HomePage } from "../pages/public/HomePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { ProfilePage } from "../pages/user/ProfilePage";
import { MyRoleRequestsPage } from "../pages/user/MyRoleRequestsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        
        {/* Authentication routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        
        {/* User profile & roles routes */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="my-role-requests" element={<MyRoleRequestsPage />} />

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
