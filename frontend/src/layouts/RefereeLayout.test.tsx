import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: "Referee Workspace" })).toBeInTheDocument();
    expect(screen.getByText("RACE OPERATIONS")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: /Search referee workspace/i })).toBeInTheDocument();
    expect(screen.getByText("Julian Sterling")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Profile|Assigned Races|Result History/i }).map((link) => link.textContent)).toEqual([
      "Profile",
      "Assigned Races",
      "Result History",
    ]);
    expect(screen.getByRole("link", { name: /Profile/i })).toHaveAttribute("href", "/referee");
    expect(screen.getByRole("link", { name: /Assigned Races/i })).toHaveAttribute(
      "href",
      "/referee/assigned-races"
    );
    expect(screen.getByRole("link", { name: /Result History/i })).toHaveAttribute("href", "/referee/result-history");
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

    expect(screen.getByRole("link", { name: /Assigned Races/i })).toHaveClass("bg-[#007a68]");
    expect(screen.getByRole("link", { name: /Profile/i })).not.toHaveClass("bg-[#007a68]");
  });
});
