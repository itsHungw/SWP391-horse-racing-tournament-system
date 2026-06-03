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
import { AdminUserListPage } from "../pages/admin/AdminUserListPage";
import { AdminUserDetailPage } from "../pages/admin/AdminUserDetailPage";
import { AdminHorsesPage } from "../pages/admin/AdminHorsesPage";
import { AdminTournamentRegistrationsPage } from "../pages/admin/AdminTournamentRegistrationsPage";
import { AdminTournamentListPage } from "../pages/admin/AdminTournamentListPage";
import { AdminTournamentDetailPage } from "../pages/admin/AdminTournamentDetailPage";
import { OwnerDashboardPage } from "../pages/owner/OwnerDashboardPage";
import { OwnerHorseProfilePage } from "../pages/owner/OwnerHorseProfilePage";
import { OwnerHorsesPage } from "../pages/owner/OwnerHorsesPage";
import { OwnerProfilePage } from "../pages/owner/OwnerProfilePage";
import { OwnerTournamentRegistrationsPage } from "../pages/owner/OwnerTournamentRegistrationsPage";
import { JockeyChampionshipsPage } from "../pages/jockey/JockeyChampionshipsPage";
import { JockeyContractsPage } from "../pages/jockey/JockeyContractsPage";
import { JockeyDashboardPage } from "../pages/jockey/JockeyDashboardPage";
import { JockeyProfilePage } from "../pages/jockey/JockeyProfilePage";
import { JockeySchedulePage } from "../pages/jockey/JockeySchedulePage";
import { RequireAdminRoute } from "./RequireAdminRoute";
import { RequireAuthRoute } from "./RequireAuthRoute";

function adminRoute(element: ReactNode) {
  return <RequireAdminRoute>{element}</RequireAdminRoute>;
}

function authRoute(element: ReactNode) {
  return <RequireAuthRoute>{element}</RequireAuthRoute>;
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

        <Route path="spectator" element={<Navigate to="/spectator/dashboard" replace />} />
        <Route path="spectator/dashboard" element={<RoleDashboardPage role="Spectator" />} />
        <Route path="owner" element={authRoute(<Navigate to="/owner/dashboard" replace />)} />
        <Route path="owner/dashboard" element={authRoute(<OwnerDashboardPage />)} />
        <Route path="owner/horses" element={authRoute(<OwnerHorsesPage />)} />
        <Route path="owner/horses/:horseId" element={authRoute(<OwnerHorseProfilePage />)} />
        <Route path="owner/profile" element={authRoute(<OwnerProfilePage />)} />
        <Route path="owner/registrations" element={authRoute(<OwnerTournamentRegistrationsPage />)} />
        <Route path="jockey" element={authRoute(<Navigate to="/jockey/dashboard" replace />)} />
        <Route path="jockey/dashboard" element={authRoute(<JockeyDashboardPage />)} />
        <Route path="jockey/championships" element={authRoute(<JockeyChampionshipsPage />)} />
        <Route path="jockey/contracts" element={authRoute(<JockeyContractsPage />)} />
        <Route path="jockey/schedule" element={authRoute(<JockeySchedulePage />)} />
        <Route path="jockey/profile" element={authRoute(<JockeyProfilePage />)} />
        <Route path="jockey/invitations" element={authRoute(<Navigate to="/jockey/contracts" replace />)} />
        <Route path="jockey/races" element={authRoute(<Navigate to="/jockey/schedule" replace />)} />
        <Route path="referee" element={<Navigate to="/referee/dashboard" replace />} />
        <Route path="referee/dashboard" element={<RoleDashboardPage role="Referee" />} />
        <Route path="referee/races" element={<RoleDashboardPage role="Referee" />} />
        <Route path="referee/checks" element={<RoleDashboardPage role="Referee" />} />
        <Route path="referee/results" element={<RoleDashboardPage role="Referee" />} />
        <Route path="admin" element={adminRoute(<AdminOverviewPage />)} />
        <Route path="admin/role-requests" element={adminRoute(<AdminRoleRequestsWorkspace />)} />
        <Route path="admin/users" element={adminRoute(<AdminUserListPage />)} />
        <Route path="admin/users/:id" element={adminRoute(<AdminUserDetailPage />)} />
        <Route path="admin/horses" element={adminRoute(<AdminHorsesPage />)} />
        <Route path="admin/tournament-registrations" element={adminRoute(<AdminTournamentRegistrationsPage />)} />
        <Route path="admin/tournaments" element={adminRoute(<AdminTournamentListPage />)} />
        <Route path="admin/tournaments/:id" element={adminRoute(<AdminTournamentDetailPage />)} />
        <Route
          path="admin/participants"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Participants"
              description="Review horse and jockey pairings after registration, pool approval, and assignment contracts."
            />
          )}
        />
        <Route
          path="admin/standings"
          element={adminRoute(
            <AdminPlaceholderPage
              title="Standings"
              description="Monitor championship points after round results are published."
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
