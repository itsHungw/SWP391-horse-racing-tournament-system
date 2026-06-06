import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { RefereeLayout } from "./RefereeLayout";

vi.mock("../hooks/useClientSession", () => ({
  useClientSession: () => ({
    isAuthenticated: true,
    logout: () => {},
    session: {
      accessToken: "mock-token",
      email: "referee@equine.com",
      fullName: "Julian Sterling",
      roles: ["REFEREE"],
    },
  }),
}));

describe("RefereeLayout", () => {
  it("renders layout sidebar and header in english with light theme aesthetics", () => {
    render(
      <MemoryRouter>
        <RefereeLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole("banner", { name: /Referee workspace header/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Referee workspace/i })).toBeInTheDocument();
    expect(screen.getAllByText("Race Control").length).toBeGreaterThan(0);
    expect(screen.getByText("Referee Workspace")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search referee workspace/i })).toBeInTheDocument();
    expect(screen.getAllByText("Julian Sterling").length).toBeGreaterThan(0);
    expect(screen.getByText("Logout")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: /Referee workspace/i });
    expect(within(nav).getAllByRole("link", { name: /Dashboard|Today's Races|Race Reports|Profile/i }).map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Today's Races",
      "Race Reports",
      "Profile",
    ]);
    expect(within(nav).getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/referee/dashboard");
    expect(within(nav).getByRole("link", { name: /^Profile$/i })).toHaveAttribute("href", "/referee/profile");
    expect(within(nav).getByRole("link", { name: /Today's Races/i })).toHaveAttribute(
      "href",
      "/referee/assigned-races"
    );
    expect(within(nav).queryByRole("link", { name: /Race Control/i })).not.toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: /Race Reports/i })).toHaveAttribute("href", "/referee/result-history");
    expect(screen.queryByText(/Pre-Race Checks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Submit Results/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reports & Violations/i)).not.toBeInTheDocument();
  });

  it("marks Assigned Races active when opened with a raceId query param", () => {
    render(
      <MemoryRouter initialEntries={["/referee/assigned-races?raceId=1"]}>
        <RefereeLayout />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /Today's Races/i })).toHaveClass("bg-[#00806d]");
    expect(screen.getAllByRole("link", { name: /^Profile$/i })[0]).not.toHaveClass("bg-[#00806d]");
  });
});
