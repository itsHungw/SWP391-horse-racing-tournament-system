import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOwnerHorses, getOwnerTournamentRegistrations, getPublicTournaments } from "../../api/racingApi";
import { OwnerDashboardPage } from "./OwnerDashboardPage";

vi.mock("../../api/racingApi", () => ({
  getOwnerHorses: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  getPublicTournaments: vi.fn(),
}));

describe("OwnerDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOwnerHorses).mockResolvedValue([
      { id: 1, name: "Nova", gender: "FEMALE", status: "APPROVED" },
      { id: 2, name: "Storm", gender: "MALE", status: "PENDING" },
      { id: 3, name: "Comet", gender: "MALE", status: "REJECTED", rejectionReason: "Missing evidence" },
    ]);
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([
      {
        id: 9,
        tournamentId: 4,
        tournamentName: "Spring Cup",
        horseId: 1,
        horseName: "Nova",
        status: "PENDING",
      },
    ]);
    vi.mocked(getPublicTournaments).mockResolvedValue([
      { id: 4, name: "Spring Cup", location: "Saigon Track", status: "OPEN_REGISTRATION" },
    ]);
  });

  it("shows owner KPI summary, next actions, alerts, and open tournaments", async () => {
    render(
      <MemoryRouter>
        <OwnerDashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /owner dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add horse/i })).toHaveAttribute("href", "/owner/horses");
    expect(screen.getByRole("link", { name: /register tournament/i })).toHaveAttribute(
      "href",
      "/owner/registrations",
    );

    const stats = screen.getByLabelText(/owner stable summary/i);
    expect(within(stats).getByText("3")).toBeInTheDocument();
    expect(within(stats).getByText(/approved horses/i)).toBeInTheDocument();
    expect(screen.getByText(/missing evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/spring cup/i)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /horse name/i })).not.toBeInTheDocument();
  });
});
