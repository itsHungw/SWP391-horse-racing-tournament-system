import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { blogApi } from "./api/blogApi";
import { walletApi } from "./api/walletApi";
import App from "./App";
import { clearClientSession, getClientSession, setClientSession } from "./utils/authSession";
import { setWalletBalance } from "./hooks/useWalletBalance";

vi.mock("./api/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api/authApi")>();

  return {
    ...actual,
    logoutRemote: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./api/adminUserApi", () => ({
  createAdminUser: vi.fn(),
  getAdminUsers: vi.fn().mockResolvedValue({
    content: [],
    totalPages: 0,
    totalElements: 0,
  }),
}));

vi.mock("./api/adminDashboardApi", () => ({
  adminDashboardApi: {
    getDashboardData: vi.fn().mockResolvedValue({
      metrics: {
        pendingRoleRequests: 0,
        pendingRoleRequestsDetail: "No pending requests",
        upcomingTournaments: 0,
        upcomingTournamentsDetail: "No upcoming tournaments",
        activeUsers: 0,
        activeUsersDetail: "No active users",
        blogDrafts: 0,
        blogDraftsDetail: "No blog drafts",
      },
      queueRows: [],
      alerts: [],
    }),
  },
}));


vi.mock("./api/racingApi", () => ({
  applyToJockeyChampionship: vi.fn(),
  approveAdminHorse: vi.fn(),
  approveAdminJockeyPoolApplication: vi.fn(),
  approveAdminTournamentRegistration: vi.fn(),
  createOwnerHorse: vi.fn(),
  createOwnerTournamentRegistration: vi.fn(),

  getAdminJockeyPoolApplications: vi.fn().mockResolvedValue([]),
  getAdminHorses: vi.fn().mockResolvedValue({
    content: [],
    number: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
  }),
  getAdminTournamentRegistrations: vi.fn().mockResolvedValue({
    content: [],
    number: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
  }),
  getJockeyChampionships: vi.fn().mockResolvedValue([]),
  getJockeyPoolApplications: vi.fn().mockResolvedValue([]),

  getOwnerHorses: vi.fn(),
  getOwnerHorsesPage: vi.fn(),
  getOwnerAvailableJockeys: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  getOwnerTournamentRegistrationsPage: vi.fn().mockResolvedValue({
    content: [],
    number: 0,
    size: 8,
    totalElements: 0,
    totalPages: 1,
  }),
  getPublicRacingSummary: vi.fn().mockResolvedValue({
    raceCount: 0,
    raceDayCount: 0,
    championshipCount: 0,
    seasonFinale: null,
  }),
  getPublicTournaments: vi.fn(),
  rejectAdminHorse: vi.fn(),
  rejectAdminJockeyPoolApplication: vi.fn(),
  rejectAdminTournamentRegistration: vi.fn(),
  searchPublicRaces: vi.fn().mockResolvedValue({
    content: [],
    number: 0,
    size: 3,
    totalElements: 0,
    totalPages: 0,
  }),
  withdrawOwnerTournamentRegistration: vi.fn(),
}));

vi.mock("./api/blogApi", () => ({
  blogApi: {
    getPublishedBlogs: vi.fn(),
  },
}));

vi.mock("./api/walletApi", () => ({
  walletApi: {
    getMyWallet: vi.fn(),
  },
}));

const emptyBlogPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  size: 3,
  number: 0,
};

function createTokenWithRoles(roles: string[], exp = Math.floor(Date.now() / 1000) + 60 * 15) {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ exp, roles })}.signature`;
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    clearClientSession({ notify: false });
    setWalletBalance(null);
    window.history.pushState({}, "", "/");
    vi.mocked(blogApi.getPublishedBlogs).mockResolvedValue(emptyBlogPage);
    vi.mocked(walletApi.getMyWallet).mockResolvedValue({
      userId: 1,
      balance: 19000000,
      status: "ACTIVE",
    });
  });

  it("renders the cinematic public home page foundation", async () => {
    render(<App />);

    await waitFor(() => {
      expect(blogApi.getPublishedBlogs).toHaveBeenCalledWith(undefined, 0, 3);
    });

    expect(screen.getByRole("banner")).toBeInTheDocument();
    const primaryNav = screen.getByRole("navigation", { name: /primary/i });
    expect(
      screen.getByRole("heading", { name: /night at the/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^log in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /^join now$/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.queryByRole("link", { name: /^dashboard$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^profile$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^logout$/i })).not.toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: /^championships$/i })).toHaveAttribute(
      "href",
      "/championships",
    );
    expect(within(primaryNav).getByRole("link", { name: /^races$/i })).toHaveAttribute(
      "href",
      "/races",
    );
    expect(within(primaryNav).getByRole("link", { name: /^predictions$/i })).toHaveAttribute(
      "href",
      "/spectator/predictions",
    );
    expect(within(primaryNav).getByRole("link", { name: /^newsroom$/i })).toHaveAttribute(
      "href",
      "/blogs",
    );
    expect(within(primaryNav).getByRole("link", { name: /^leaderboard$/i })).toHaveAttribute(
      "href",
      "/leaderboard",
    );
    expect(within(primaryNav).getByRole("link", { name: /^join us$/i })).toHaveAttribute(
      "href",
      "/join-us",
    );
    expect(
      within(primaryNav).queryByRole("link", { name: /^admin$/i }),
    ).not.toBeInTheDocument();
    expect(
      within(primaryNav).queryByRole("link", { name: /^dashboard$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /from the championship desk/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /read the race/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /join the/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );
  });


  it("renders authenticated client header links and logs out", async () => {
    setClientSession(createTokenWithRoles(["SPECTATOR"]), "Nguyen Van A", "member@example.com");

    render(<App />);

    await waitFor(() => {
      expect(blogApi.getPublishedBlogs).toHaveBeenCalledWith(undefined, 0, 3);
    });

    const primaryNav = screen.getByRole("navigation", { name: /primary/i });

    fireEvent.click(screen.getByRole("button", { name: /account/i }));

    expect(await screen.findAllByText(/19,000,000/)).not.toHaveLength(0);
    expect(screen.queryByText(/public workspace/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change dashboard workspace/i })).toHaveTextContent(/spectator mode/i);
    expect(screen.getByRole("link", { name: /^profile$/i })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("button", { name: /^logout$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^log in$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^join now$/i })).not.toBeInTheDocument();
    expect(within(primaryNav).getByRole("link", { name: /^join us$/i })).toHaveAttribute(
      "href",
      "/join-us",
    );
    expect(
      screen.getByRole("heading", { name: /from the championship desk/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^logout$/i }));

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(getClientSession().accessToken).toBeNull();
    expect(screen.getByRole("link", { name: /^log in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("renders auth routes without nested main landmarks", () => {
    window.history.pushState({}, "", "/register");

    render(<App />);

    expect(screen.getByRole("heading", { name: /join the circuit/i })).toBeInTheDocument();
    expect(document.querySelectorAll("main")).toHaveLength(1);
  });

  it("renders the Join Us paddock page with application path", () => {
    window.history.pushState({}, "", "/join-us");

    render(<App />);

    expect(screen.getByRole("heading", { name: /join the/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^jockey$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^owner$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^referee$/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /create account/i })[0]).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: /view application flow/i })).toHaveAttribute(
      "href",
      "#application-flow",
    );
  });

  it("redirects unauthenticated admin visitors to login", () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("redirects unauthenticated profile visitors to login", () => {
    window.history.pushState({}, "", "/profile");

    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("redirects unauthenticated role application visitors to login", () => {
    window.history.pushState({}, "", "/my-role-requests");

    render(<App />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });


  it("keeps an expired access token session visible so refresh can recover it", async () => {
    setClientSession(createTokenWithRoles(["SPECTATOR"], 1), "Nguyen Van A", "member@example.com");


    render(<App />);

    await waitFor(() => {
      expect(blogApi.getPublishedBlogs).toHaveBeenCalledWith(undefined, 0, 3);
    });

    fireEvent.click(screen.getByRole("button", { name: /account/i }));

    expect(screen.getByRole("button", { name: /change dashboard workspace/i })).toHaveTextContent(/spectator mode/i);
    expect(getClientSession().accessToken).not.toBeNull();
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("routes horse owner dashboard selection to the owner workspace", () => {
    setClientSession(createTokenWithRoles(["HORSE_OWNER"]), "Owner User", "owner@example.com");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /account/i }));
    fireEvent.click(screen.getByRole("button", { name: /change dashboard workspace/i }));

    expect(screen.getByRole("link", { name: /owner dashboard/i })).toHaveAttribute(
      "href",
      "/owner/dashboard",
    );
  });

  it("shows role dashboard targets from the authenticated profile pill", () => {
    setClientSession(
      createTokenWithRoles(["SPECTATOR", "HORSE_OWNER", "JOCKEY", "REFEREE", "ORGANIZER"]),
      "Multi Role",
      "multi@example.com",
    );

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /account/i }));

    expect(screen.getByText(/current dashboard/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change dashboard workspace/i })).toHaveTextContent(/spectator mode/i);
    expect(screen.queryByRole("link", { name: /owner dashboard/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /change dashboard workspace/i }));

    expect(screen.getByRole("link", { name: /owner dashboard/i })).toHaveAttribute(
      "href",
      "/owner/dashboard",
    );
    expect(screen.getByRole("link", { name: /jockey dashboard/i })).toHaveAttribute(
      "href",
      "/jockey/dashboard",
    );
    expect(screen.getByRole("link", { name: /referee dashboard/i })).toHaveAttribute(
      "href",
      "/referee/dashboard",
    );
    expect(screen.getByText(/personal dashboards/i)).toBeInTheDocument();
    expect(screen.getByText(/business workspace/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /organizer dashboard/i })).toHaveAttribute(
      "href",
      "/organizer",
    );
  });

  it("blocks owner dashboard for authenticated users without owner role", () => {
    window.history.pushState({}, "", "/owner/dashboard");
    setClientSession(createTokenWithRoles(["SPECTATOR"]), "Fan User", "fan@example.com");

    render(<App />);

    expect(screen.getByRole("heading", { name: /owner workspace is not active/i })).toBeInTheDocument();
  });

  it("redirects owner base route to owner dashboard for authenticated owners", async () => {
    window.history.pushState({}, "", "/owner");
    setClientSession(createTokenWithRoles(["HORSE_OWNER"]), "Owner User", "owner@example.com");

    render(<App />);

    expect(await screen.findByRole("heading", { name: /owner dashboard/i })).toBeInTheDocument();
  });

  it("renders a polished forbidden page for authenticated non-admin users", () => {
    window.history.pushState({}, "", "/admin");
    setClientSession(createTokenWithRoles(["SPECTATOR"]), "Nguyen Van A", "member@example.com");

    render(<App />);

    expect(screen.getByRole("heading", { name: /admin access required/i })).toBeInTheDocument();
    expect(screen.getByText(/your account is signed in/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return home/i })).toHaveAttribute("href", "/");
  });

  it("renders the admin operations foundation route for admin users", async () => {
    window.history.pushState({}, "", "/admin");
    setClientSession(createTokenWithRoles(["ADMIN"]), "Admin Operator", "admin@example.com");

    render(<App />);

    expect(
      screen.getByRole("banner", { name: /admin operations header/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /admin workspace/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /admin operations/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", {
        name: /search admin workspace/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /role requests/i }),
    ).toHaveAttribute("href", "/admin/role-requests");
    expect(screen.getByText("OPERATIONS")).toBeInTheDocument();
    expect(screen.getByText("PEOPLE")).toBeInTheDocument();
    expect(screen.getByText("ENGAGEMENT")).toBeInTheDocument();
    expect(screen.getByText("FINANCE")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^championships$/i })).toHaveAttribute(
      "href",
      "/admin/tournaments",
    );
    expect(screen.getByRole("link", { name: /horse approvals/i })).toHaveAttribute(
      "href",
      "/admin/horses",
    );
    expect(screen.queryByRole("link", { name: /^participants$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^races$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^registrations$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^standings$/i })).not.toBeInTheDocument();
  });

  it("keeps admin user management inside the admin shell", async () => {
    window.history.pushState({}, "", "/admin/users");
    setClientSession(createTokenWithRoles(["ADMIN"]), "Admin Operator", "admin@example.com");

    render(<App />);

    expect(
      screen.getByRole("banner", { name: /admin operations header/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /user management/i })).toBeInTheDocument();
    expect(screen.getByText(/manage accounts/i)).toBeInTheDocument();
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });

  it("keeps admin horse approvals inside the admin shell", async () => {
    window.history.pushState({}, "", "/admin/horses");
    setClientSession(createTokenWithRoles(["ADMIN"]), "Admin Operator", "admin@example.com");

    render(<App />);

    expect(screen.getByRole("banner", { name: /admin operations header/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /horse approvals/i })).toBeInTheDocument();
    expect(await screen.findByText(/no horses matching the current filter/i)).toBeInTheDocument();
  });

  it("keeps admin tournament registrations inside the admin shell", async () => {
    window.history.pushState({}, "", "/admin/tournament-registrations");
    setClientSession(createTokenWithRoles(["ADMIN"]), "Admin Operator", "admin@example.com");

    render(<App />);

    expect(screen.getByRole("banner", { name: /admin operations header/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /tournament registrations/i })).toBeInTheDocument();
    expect(await screen.findByText(/no registrations match this filter/i)).toBeInTheDocument();
  });


  it("renders referee result packages as a read-only confirmed results archive", () => {
    window.history.pushState({}, "", "/referee/result-history");
    setClientSession(createTokenWithRoles(["REFEREE"]), "Julian Sterling", "referee@equine.com");

    render(<App />);

    expect(screen.getByRole("banner", { name: /referee workspace header/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /race reports/i })).toHaveAttribute(
      "href",
      "/referee/result-history",
    );
    expect(screen.getByRole("heading", { name: /confirmed race results/i })).toBeInTheDocument();
    const resultsContainer = screen.getByRole("region", { name: /published race results/i });
    expect(resultsContainer).toBeInTheDocument();
    expect(within(resultsContainer).getAllByText("PUBLISHED")).toHaveLength(2);
    expect(within(resultsContainer).getByText("June Stakes - Heat 2")).toBeInTheDocument();
    expect(within(resultsContainer).getByText(/Golden Arrow, Night Bloom, River Comet/i)).toBeInTheDocument();
    expect(within(resultsContainer).getByText(/Track Hazard - Caution Period Enabled/i)).toBeInTheDocument();
    expect(within(resultsContainer).getByText(/Warning: Lane drift/i)).toBeInTheDocument();
    expect(screen.queryByText("DRAFT")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /update|publish|save|edit/i })).not.toBeInTheDocument();

  });
});
