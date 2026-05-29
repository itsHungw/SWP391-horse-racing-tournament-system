import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import { RefereeOverviewPage } from "./RefereeOverviewPage";
import * as refereeApi from "../../api/refereeApi";

vi.mock("../../api/refereeApi");

const mockRaces = [
  {
    id: 1,
    name: "Royal Ascot Gold Cup - Qualifiers A",
    code: "R-2026-001",
    distanceMeters: 1600,
    status: "ACTIVE",
  },
];

describe("RefereeOverviewPage", () => {
  it("renders list of assigned races, details, and action links", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    render(
      <MemoryRouter>
        <RefereeOverviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Preparing steward assignments/i)).toBeInTheDocument();
    expect(await screen.findByText("Assigned Race Desk")).toBeInTheDocument();
    expect(screen.getByText("REFEREE DESK")).toBeInTheDocument();
    expect(screen.getByText("Royal Ascot Gold Cup - Qualifiers A")).toBeInTheDocument();
    expect(screen.getByText("R-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Step 1: Select a Race Task")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Pre-Check/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Record Results/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /File Incident/i })).toBeInTheDocument();
  });

  it("filters action buttons when in specific modes", async () => {
    vi.spyOn(refereeApi, "getAssignedRaces").mockResolvedValue(mockRaces);

    const { rerender } = render(
      <MemoryRouter>
        <RefereeOverviewPage mode="check" />
      </MemoryRouter>
    );

    expect(await screen.findByText("Pre-Race Checks")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Pre-Check/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Record Results/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /File Incident/i })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <RefereeOverviewPage mode="results" />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Submit Results" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open Pre-Check/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Record Results/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /File Incident/i })).not.toBeInTheDocument();
  });
});
