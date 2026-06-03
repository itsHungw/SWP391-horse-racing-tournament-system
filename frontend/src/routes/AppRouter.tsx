import { Navigate, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";

import { AppLayout } from "../layouts/AppLayout";
import { RoleDashboardPage } from "../pages/RoleDashboardPage";
import { HomePage } from "../pages/public/HomePage";
import { JoinUsPage } from "../pages/public/JoinUsPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { ProfilePage } from "../pages/user/ProfilePage";
import { MyRoleRequestsPage } from "../pages/user/MyRoleRequestsPage";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminRoleRequestsWorkspace } from "../pages/admin/AdminRoleRequestsWorkspace";
import { AdminPlaceholderPage } from "../pages/admin/AdminPlaceholderPage";
import { RequireAdminRoute } from "./RequireAdminRoute";
import { RequireAuthRoute } from "./RequireAuthRoute";
import { RequireRefereeRoute } from "./RequireRefereeRoute";
import { RefereeLayout } from "../layouts/RefereeLayout";
import { RefereeOverviewPage } from "../pages/referee/RefereeOverviewPage";
import { PreRaceCheckPage } from "../pages/referee/PreRaceCheckPage";
import { SubmitResultsPage } from "../pages/referee/SubmitResultsPage";
import { IncidentReportsPage } from "../pages/referee/IncidentReportsPage";
import { RefereeOfficiatePage } from "../pages/referee/RefereeOfficiatePage";
import { RefereeResultHistoryPage } from "../pages/referee/RefereeResultHistoryPage";
import { RefereeProfileDashboardPage } from "../pages/referee/RefereeProfileDashboardPage";


function adminRoute(element: ReactNode) {
  return <RequireAdminRoute>{element}</RequireAdminRoute>;
}

function authRoute(element: ReactNode) {
  return <RequireAuthRoute>{element}</RequireAuthRoute>;
}

function refereeRoute(element: ReactNode) {
  return <RequireRefereeRoute>{element}</RequireRefereeRoute>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="join-us" element={<JoinUsPage />} />
        
        {/* Authentication routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        
        {/* User profile & roles routes */}
        <Route path="profile" element={authRoute(<ProfilePage />)} />
        <Route path="my-role-requests" element={authRoute(<MyRoleRequestsPage />)} />

        <Route
          path="spectator"
          element={<RoleDashboardPage role="Spectator" />}
        />
        <Route path="owner" element={<RoleDashboardPage role="Owner" />} />
        <Route path="jockey" element={<RoleDashboardPage role="Jockey" />} />
        <Route path="referee" element={refereeRoute(<RefereeLayout />)}>
          <Route index element={<RefereeProfileDashboardPage />} />
          <Route path="assigned-races" element={<RefereeOverviewPage mode="all" />} />
          <Route path="result-history" element={<RefereeResultHistoryPage />} />
          <Route path="races/:id/check" element={<PreRaceCheckPage />} />
          <Route path="races/:id/results" element={<SubmitResultsPage />} />
          <Route path="races/:id/report" element={<IncidentReportsPage />} />
          <Route path="races/:id/officiate" element={<RefereeOfficiatePage />} />
        </Route>
        <Route path="admin" element={adminRoute(<AdminOverviewPage />)} />
        <Route path="admin/role-requests" element={adminRoute(<AdminRoleRequestsWorkspace />)} />
        <Route
          path="admin/users"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Users"
              description="Manage user records, verification state, and account readiness before assigning specialist roles."
            />
          )}
        />
        <Route
          path="admin/tournaments"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Tournaments"
              description="Prepare tournament schedules, registration windows, and operational checkpoints."
            />
          )}
        />
        <Route
          path="admin/races"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Races"
              description="Review race cards, results, participant readiness, and race-day operations."
            />
          )}
        />
        <Route
          path="admin/predictions"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Predictions"
              description="Monitor prediction features, moderation queues, and future point reward rules."
            />
          )}
        />
        <Route
          path="admin/blog"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Blog"
              description="Manage tournament posts, publishing state, and content reward eligibility."
            />
          )}
        />
        <Route
          path="admin/points"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Points"
              description="Audit virtual point activity and prepare reward rule controls."
            />
          )}
        />
        <Route
          path="admin/settings"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Settings"
              description="Configure admin workspace preferences and operational defaults."
            />
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
