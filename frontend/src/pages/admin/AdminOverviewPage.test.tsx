import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { adminFinanceApi } from "../../api/adminFinanceApi";
import { AdminOverviewPage } from "./AdminOverviewPage";

vi.mock("./hooks/useAdminDashboard", () => ({
  useAdminDashboard: () => ({
    dashboard: {
      metrics: {
        pendingRoleRequests: 2,
        pendingRoleRequestsDetail: "Requires attention",
        upcomingTournaments: 3,
        upcomingTournamentsDetail: "Awaiting race days",
        activeUsers: 20,
        activeUsersDetail: "Active platform users",
        blogDrafts: 1,
        blogDraftsDetail: "Awaiting review",
      },
      queueRows: [],
      alerts: [],
    },
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../api/adminFinanceApi", () => ({
  adminFinanceApi: { getSummary: vi.fn() },
}));

describe("AdminOverviewPage finance pulse", () => {
  it("keeps finance reporting out of the cross-domain operations dashboard", () => {
    render(<MemoryRouter><AdminOverviewPage /></MemoryRouter>);

    expect(screen.queryByText("Finance pulse")).not.toBeInTheDocument();
    expect(adminFinanceApi.getSummary).not.toHaveBeenCalled();
  });
});
