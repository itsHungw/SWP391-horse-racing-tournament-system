import { Navigate, Route, Routes } from "react-router-dom";
import { ReactNode } from "react";

import { AppLayout } from "../layouts/AppLayout";
import { HomePage } from "../pages/public/HomePage";
import { JoinUsPage } from "../pages/public/JoinUsPage";
import { SpectatorBlogListPage } from "../pages/public/SpectatorBlogListPage";
import { SpectatorBlogDetailPage } from "../pages/public/SpectatorBlogDetailPage";
import { ChampionshipsPage } from "../pages/public/ChampionshipsPage";
import { ChampionshipDetailPage } from "../pages/public/ChampionshipDetailPage";
import { RacesPage } from "../pages/public/RacesPage";
import { RaceDetailPage } from "../pages/public/RaceDetailPage";
import { LeaderboardPage } from "../pages/public/LeaderboardPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { VerifyEmailPage } from "../pages/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ProfilePage } from "../pages/user/ProfilePage";
import { WalletPage } from "../pages/wallet/WalletPage";
import { AdminWithdrawalsPage } from "../pages/admin/AdminWithdrawalsPage";
import { MyRoleRequestsPage } from "../pages/user/MyRoleRequestsPage";
import { OrganizerLayout } from "../layouts/OrganizerLayout";
import { OrganizerRegisterPage } from "../pages/organizer/OrganizerRegisterPage";
import { OrganizerDashboardPage } from "../pages/organizer/OrganizerDashboardPage";
import { OrganizerTournamentsPage } from "../pages/organizer/OrganizerTournamentsPage";
import { OrganizerTournamentFormPage } from "../pages/organizer/OrganizerTournamentFormPage";
import { OrganizerTournamentDetailPage } from "../pages/organizer/OrganizerTournamentDetailPage";
import { OrganizerOfficialsPage } from "../pages/organizer/OrganizerOfficialsPage";
import { OrganizerRegistrationsPage } from "../pages/organizer/OrganizerRegistrationsPage";
import { OrganizerSchedulePage } from "../pages/organizer/OrganizerSchedulePage";
import { OrganizerResultsPage } from "../pages/organizer/OrganizerResultsPage";
import { OrganizerProfilePage } from "../pages/organizer/OrganizerProfilePage";
import { OrganizerOrganizationPage } from "../pages/organizer/OrganizerOrganizationPage";
import { AdminOverviewPage } from "../pages/admin/AdminOverviewPage";
import { AdminRoleRequestsWorkspace } from "../pages/admin/AdminRoleRequestsWorkspace";
import { AdminOrganizationsPage } from "../pages/admin/AdminOrganizationsPage";
import { AdminPlaceholderPage } from "../pages/admin/AdminPlaceholderPage";
import { AdminUserListPage } from "../pages/admin/AdminUserListPage";
import { AdminUserDetailPage } from "../pages/admin/AdminUserDetailPage";
import { AdminHorsesPage } from "../pages/admin/AdminHorsesPage";
import { AdminTournamentRegistrationsPage } from "../pages/admin/AdminTournamentRegistrationsPage";
import { AdminTournamentListPage } from "../pages/admin/AdminTournamentListPage";
import { AdminTournamentDetailPage } from "../pages/admin/AdminTournamentDetailPage";
import { AdminBlogListPage } from "../pages/admin/AdminBlogListPage";
import { AdminBlogFormPage } from "../pages/admin/AdminBlogFormPage";
import { AdminPredictionsWorkspace } from "../pages/admin/AdminPredictionsWorkspace";
import { AdminRacePredictionDetailPage } from "../pages/admin/AdminRacePredictionDetailPage";
import { OwnerDashboardPage } from "../pages/owner/OwnerDashboardPage";
import { SpectatorPredictionsPage } from "../pages/spectator/predictions/SpectatorPredictionsPage";
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
import { RequireRoleRoute } from "./RequireRoleRoute";
import { RefereeLayout } from "../layouts/RefereeLayout";
import { RefereeOverviewPage } from "../pages/referee/RefereeOverviewPage";
import { PreRaceCheckPage } from "../pages/referee/PreRaceCheckPage";
import { SubmitResultsPage } from "../pages/referee/SubmitResultsPage";
import { IncidentReportsPage } from "../pages/referee/IncidentReportsPage";
import { RefereeOfficiatePage } from "../pages/referee/RefereeOfficiatePage";
import { RefereeResultHistoryPage } from "../pages/referee/RefereeResultHistoryPage";
import { RefereeDashboardPage } from "../pages/referee/RefereeDashboardPage";
import { RefereeProfileDashboardPage } from "../pages/referee/RefereeProfileDashboardPage";
import { RefereeContractsPage } from "../pages/referee/RefereeContractsPage";

function adminRoute(element: ReactNode) {
  return <RequireAdminRoute>{element}</RequireAdminRoute>;
}

function authRoute(element: ReactNode) {
  return <RequireAuthRoute>{element}</RequireAuthRoute>;
}

function jockeyRoute(element: ReactNode) {
  return (
    <RequireRoleRoute role="JOCKEY" workspaceName="Jockey Workspace">
      {element}
    </RequireRoleRoute>
  );
}

function refereeRoute(element: ReactNode) {
  return (
    <RequireRoleRoute role="REFEREE" workspaceName="Referee Workspace">
      {element}
    </RequireRoleRoute>
  );
}

function organizerRoute(element: ReactNode) {
  return (
    <RequireRoleRoute role="ORGANIZER" workspaceName="Organizer Workspace">
      {element}
    </RequireRoleRoute>
  );
}

function ownerRoute(element: ReactNode) {
  return (
    <RequireRoleRoute role="HORSE_OWNER" workspaceName="Owner Workspace">
      {element}
    </RequireRoleRoute>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="join-us" element={<JoinUsPage />} />
        <Route path="championships" element={<ChampionshipsPage />} />
        <Route path="championships/:id" element={<ChampionshipDetailPage />} />
        <Route path="races" element={<RacesPage />} />
        <Route path="races/:id" element={<RaceDetailPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="blogs" element={<SpectatorBlogListPage />} />
        <Route path="blogs/:slug" element={<SpectatorBlogDetailPage />} />
        
        {/* Authentication routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        
        {/* User profile & roles routes */}
        <Route path="profile" element={authRoute(<ProfilePage />)} />
        <Route path="wallet" element={authRoute(<WalletPage />)} />
        <Route path="my-role-requests" element={authRoute(<MyRoleRequestsPage />)} />
        <Route path="organizer/register" element={authRoute(<OrganizerRegisterPage />)} />
        <Route path="organizer" element={organizerRoute(<OrganizerLayout />)}>
          <Route index element={<OrganizerDashboardPage />} />
          <Route path="tournaments" element={<OrganizerTournamentsPage />} />
          <Route path="tournaments/new" element={<OrganizerTournamentFormPage />} />
          <Route path="tournaments/:id" element={<OrganizerTournamentDetailPage />} />
          <Route path="registrations" element={<OrganizerRegistrationsPage />} />
          <Route path="schedule" element={<OrganizerSchedulePage />} />
          <Route path="officials" element={<OrganizerOfficialsPage />} />
          <Route path="results" element={<OrganizerResultsPage />} />
          <Route path="profile" element={<OrganizerProfilePage />} />
          <Route path="organization" element={<OrganizerOrganizationPage />} />
        </Route>


<Route path="owner" element={ownerRoute(<Navigate to="/owner/dashboard" replace />)} />
<Route path="owner/dashboard" element={ownerRoute(<OwnerDashboardPage />)} />
<Route path="owner/horses" element={ownerRoute(<OwnerHorsesPage />)} />
<Route path="owner/horses/:horseId" element={ownerRoute(<OwnerHorseProfilePage />)} />
<Route path="owner/profile" element={ownerRoute(<OwnerProfilePage />)} />
<Route path="owner/registrations" element={ownerRoute(<OwnerTournamentRegistrationsPage />)} />

<Route path="jockey" element={jockeyRoute(<Navigate to="/jockey/dashboard" replace />)} />
<Route path="jockey/dashboard" element={jockeyRoute(<JockeyDashboardPage />)} />
<Route path="jockey/championships" element={jockeyRoute(<JockeyChampionshipsPage />)} />
<Route path="jockey/contracts" element={jockeyRoute(<JockeyContractsPage />)} />
<Route path="jockey/schedule" element={jockeyRoute(<JockeySchedulePage />)} />
<Route path="jockey/profile" element={jockeyRoute(<JockeyProfilePage />)} />
<Route path="jockey/invitations" element={jockeyRoute(<Navigate to="/jockey/contracts" replace />)} />
<Route path="jockey/races" element={jockeyRoute(<Navigate to="/jockey/schedule" replace />)} />

<Route path="referee" element={refereeRoute(<RefereeLayout />)}>
  <Route index element={<Navigate to="/referee/dashboard" replace />} />
  <Route path="dashboard" element={<RefereeDashboardPage />} />
  <Route path="assigned-races" element={<RefereeOverviewPage mode="all" />} />
  <Route path="race-control" element={<RefereeOverviewPage mode="check" />} />
  <Route path="result-history" element={<RefereeResultHistoryPage />} />
  <Route path="contracts" element={<RefereeContractsPage />} />
  <Route path="profile" element={<RefereeProfileDashboardPage />} />
  <Route path="races/:id/check" element={<PreRaceCheckPage />} />
  <Route path="races/:id/results" element={<SubmitResultsPage />} />
  <Route path="races/:id/report" element={<IncidentReportsPage />} />
  <Route path="races/:id/officiate" element={<RefereeOfficiatePage />} />
</Route>

        <Route path="spectator" element={<Navigate to="/spectator/predictions" replace />} />
        <Route path="spectator/dashboard" element={<Navigate to="/spectator/predictions" replace />} />
        <Route path="spectator/predictions" element={authRoute(<SpectatorPredictionsPage />)} />
       
        <Route path="admin" element={adminRoute(<AdminOverviewPage />)} />
        <Route path="admin/role-requests" element={adminRoute(<AdminRoleRequestsWorkspace />)} />
        <Route path="admin/organizations" element={adminRoute(<AdminOrganizationsPage />)} />
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

        <Route path="admin/blog" element={adminRoute(<AdminBlogListPage />)} />
        <Route path="admin/blog/new" element={adminRoute(<AdminBlogFormPage />)} />
        <Route path="admin/blog/edit/:id" element={adminRoute(<AdminBlogFormPage />)} />

        <Route path="admin/predictions" element={adminRoute(<AdminPredictionsWorkspace />)} />
        <Route path="admin/predictions/races/:raceId" element={adminRoute(<AdminRacePredictionDetailPage />)} />
        <Route path="admin/withdrawals" element={adminRoute(<AdminWithdrawalsPage />)} />
        

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
