import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense, ReactNode } from "react";

import { AppLayout } from "../layouts/AppLayout";
import { RequireAdminRoute } from "./RequireAdminRoute";
import { RequireAuthRoute } from "./RequireAuthRoute";
import { RequireRoleRoute } from "./RequireRoleRoute";

// Public + auth pages stay eagerly imported: they are the first-paint surfaces, so
// code-splitting them would only add a Suspense flash on the most common entry points.
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

// Authenticated / role-gated workspaces are lazy-loaded so a public visitor never downloads
// the admin / organizer / owner / jockey / referee bundles (or heavy deps like lightweight-charts).
const ProfilePage = lazy(() => import("../pages/user/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const WalletPage = lazy(() => import("../pages/wallet/WalletPage").then((m) => ({ default: m.WalletPage })));
const MyRoleRequestsPage = lazy(() => import("../pages/user/MyRoleRequestsPage").then((m) => ({ default: m.MyRoleRequestsPage })));
const SpectatorPredictionsPage = lazy(() => import("../pages/spectator/predictions/SpectatorPredictionsPage").then((m) => ({ default: m.SpectatorPredictionsPage })));
const SpectatorDisputesPage = lazy(() => import("../pages/spectator/disputes/SpectatorDisputesPage").then((m) => ({ default: m.SpectatorDisputesPage })));

const OrganizerLayout = lazy(() => import("../layouts/OrganizerLayout").then((m) => ({ default: m.OrganizerLayout })));
const OrganizerRegisterPage = lazy(() => import("../pages/organizer/OrganizerRegisterPage").then((m) => ({ default: m.OrganizerRegisterPage })));
const OrganizerDashboardPage = lazy(() => import("../pages/organizer/OrganizerDashboardPage").then((m) => ({ default: m.OrganizerDashboardPage })));
const OrganizerTournamentsPage = lazy(() => import("../pages/organizer/OrganizerTournamentsPage").then((m) => ({ default: m.OrganizerTournamentsPage })));
const OrganizerTournamentFormPage = lazy(() => import("../pages/organizer/OrganizerTournamentFormPage").then((m) => ({ default: m.OrganizerTournamentFormPage })));
const OrganizerTournamentDetailPage = lazy(() => import("../pages/organizer/OrganizerTournamentDetailPage").then((m) => ({ default: m.OrganizerTournamentDetailPage })));
const OrganizerRegistrationsPage = lazy(() => import("../pages/organizer/OrganizerRegistrationsPage").then((m) => ({ default: m.OrganizerRegistrationsPage })));
const OrganizerSchedulePage = lazy(() => import("../pages/organizer/OrganizerSchedulePage").then((m) => ({ default: m.OrganizerSchedulePage })));
const OrganizerOfficialsPage = lazy(() => import("../pages/organizer/OrganizerOfficialsPage").then((m) => ({ default: m.OrganizerOfficialsPage })));
const OrganizerResultsPage = lazy(() => import("../pages/organizer/OrganizerResultsPage").then((m) => ({ default: m.OrganizerResultsPage })));
const OrganizerProfilePage = lazy(() => import("../pages/organizer/OrganizerProfilePage").then((m) => ({ default: m.OrganizerProfilePage })));
const OrganizerOrganizationPage = lazy(() => import("../pages/organizer/OrganizerOrganizationPage").then((m) => ({ default: m.OrganizerOrganizationPage })));

const AdminOverviewPage = lazy(() => import("../pages/admin/AdminOverviewPage").then((m) => ({ default: m.AdminOverviewPage })));
const AdminRoleRequestsWorkspace = lazy(() => import("../pages/admin/AdminRoleRequestsWorkspace").then((m) => ({ default: m.AdminRoleRequestsWorkspace })));
const AdminOrganizationsPage = lazy(() => import("../pages/admin/AdminOrganizationsPage").then((m) => ({ default: m.AdminOrganizationsPage })));
const AdminPlaceholderPage = lazy(() => import("../pages/admin/AdminPlaceholderPage").then((m) => ({ default: m.AdminPlaceholderPage })));
const AdminUserListPage = lazy(() => import("../pages/admin/AdminUserListPage").then((m) => ({ default: m.AdminUserListPage })));
const AdminUserDetailPage = lazy(() => import("../pages/admin/AdminUserDetailPage").then((m) => ({ default: m.AdminUserDetailPage })));
const AdminHorsesPage = lazy(() => import("../pages/admin/AdminHorsesPage").then((m) => ({ default: m.AdminHorsesPage })));
const AdminTournamentRegistrationsPage = lazy(() => import("../pages/admin/AdminTournamentRegistrationsPage").then((m) => ({ default: m.AdminTournamentRegistrationsPage })));
const AdminTournamentListPage = lazy(() => import("../pages/admin/AdminTournamentListPage").then((m) => ({ default: m.AdminTournamentListPage })));
const AdminTournamentDetailPage = lazy(() => import("../pages/admin/AdminTournamentDetailPage").then((m) => ({ default: m.AdminTournamentDetailPage })));
const AdminBlogListPage = lazy(() => import("../pages/admin/AdminBlogListPage").then((m) => ({ default: m.AdminBlogListPage })));
const AdminBlogFormPage = lazy(() => import("../pages/admin/AdminBlogFormPage").then((m) => ({ default: m.AdminBlogFormPage })));
const AdminPredictionsWorkspace = lazy(() => import("../pages/admin/AdminPredictionsWorkspace").then((m) => ({ default: m.AdminPredictionsWorkspace })));
const AdminRacePredictionDetailPage = lazy(() => import("../pages/admin/AdminRacePredictionDetailPage").then((m) => ({ default: m.AdminRacePredictionDetailPage })));
const AdminWithdrawalsPage = lazy(() => import("../pages/admin/AdminWithdrawalsPage").then((m) => ({ default: m.AdminWithdrawalsPage })));
const AdminDisputesWorkspace = lazy(() => import("../pages/admin/AdminDisputesWorkspace").then((m) => ({ default: m.AdminDisputesWorkspace })));

const OwnerDashboardPage = lazy(() => import("../pages/owner/OwnerDashboardPage").then((m) => ({ default: m.OwnerDashboardPage })));
const OwnerHorseProfilePage = lazy(() => import("../pages/owner/OwnerHorseProfilePage").then((m) => ({ default: m.OwnerHorseProfilePage })));
const OwnerHorsesPage = lazy(() => import("../pages/owner/OwnerHorsesPage").then((m) => ({ default: m.OwnerHorsesPage })));
const OwnerProfilePage = lazy(() => import("../pages/owner/OwnerProfilePage").then((m) => ({ default: m.OwnerProfilePage })));
const OwnerTournamentRegistrationsPage = lazy(() => import("../pages/owner/OwnerTournamentRegistrationsPage").then((m) => ({ default: m.OwnerTournamentRegistrationsPage })));
const OwnerJockeyInvitationsPage = lazy(() => import("../pages/owner/OwnerJockeyInvitationsPage").then((m) => ({ default: m.OwnerJockeyInvitationsPage })));

const JockeyChampionshipsPage = lazy(() => import("../pages/jockey/JockeyChampionshipsPage").then((m) => ({ default: m.JockeyChampionshipsPage })));
const JockeyContractsPage = lazy(() => import("../pages/jockey/JockeyContractsPage").then((m) => ({ default: m.JockeyContractsPage })));
const JockeyDashboardPage = lazy(() => import("../pages/jockey/JockeyDashboardPage").then((m) => ({ default: m.JockeyDashboardPage })));
const JockeyProfilePage = lazy(() => import("../pages/jockey/JockeyProfilePage").then((m) => ({ default: m.JockeyProfilePage })));
const JockeySchedulePage = lazy(() => import("../pages/jockey/JockeySchedulePage").then((m) => ({ default: m.JockeySchedulePage })));

const RefereeLayout = lazy(() => import("../layouts/RefereeLayout").then((m) => ({ default: m.RefereeLayout })));
const RefereeOverviewPage = lazy(() => import("../pages/referee/RefereeOverviewPage").then((m) => ({ default: m.RefereeOverviewPage })));
const PreRaceCheckPage = lazy(() => import("../pages/referee/PreRaceCheckPage").then((m) => ({ default: m.PreRaceCheckPage })));
const SubmitResultsPage = lazy(() => import("../pages/referee/SubmitResultsPage").then((m) => ({ default: m.SubmitResultsPage })));
const IncidentReportsPage = lazy(() => import("../pages/referee/IncidentReportsPage").then((m) => ({ default: m.IncidentReportsPage })));
const RefereeOfficiatePage = lazy(() => import("../pages/referee/RefereeOfficiatePage").then((m) => ({ default: m.RefereeOfficiatePage })));
const RefereeResultHistoryPage = lazy(() => import("../pages/referee/RefereeResultHistoryPage").then((m) => ({ default: m.RefereeResultHistoryPage })));
const RefereeDashboardPage = lazy(() => import("../pages/referee/RefereeDashboardPage").then((m) => ({ default: m.RefereeDashboardPage })));
const RefereeProfileDashboardPage = lazy(() => import("../pages/referee/RefereeProfileDashboardPage").then((m) => ({ default: m.RefereeProfileDashboardPage })));
const RefereeContractsPage = lazy(() => import("../pages/referee/RefereeContractsPage").then((m) => ({ default: m.RefereeContractsPage })));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent opacity-40" />
    </div>
  );
}

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
    <Suspense fallback={<RouteFallback />}>
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
        <Route path="owner/invitations" element={ownerRoute(<OwnerJockeyInvitationsPage />)} />

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
        <Route path="spectator/disputes" element={authRoute(<SpectatorDisputesPage />)} />

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
        <Route path="admin/disputes" element={adminRoute(<AdminDisputesWorkspace />)} />


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
    </Suspense>
  );
}
