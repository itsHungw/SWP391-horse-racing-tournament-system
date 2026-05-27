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

    expect(await screen.findByText("Assigned Races")).toBeInTheDocument();
    expect(screen.getByText("Royal Ascot Gold Cup - Qualifiers A")).toBeInTheDocument();
    expect(screen.getByText("R-2026-001")).toBeInTheDocument();
    expect(screen.getByText(/Verify Pre-check/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Results/i)).toBeInTheDocument();
  });
});
