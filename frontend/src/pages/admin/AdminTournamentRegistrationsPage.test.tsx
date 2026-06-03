import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveAdminTournamentRegistration,
  getAdminTournamentRegistrations,
  rejectAdminTournamentRegistration,
} from "../../api/racingApi";
import { AdminTournamentRegistrationsPage } from "./AdminTournamentRegistrationsPage";

vi.mock("../../api/racingApi", () => ({
  approveAdminHorse: vi.fn(),
  approveAdminTournamentRegistration: vi.fn(),
  getAdminHorses: vi.fn(),
  getAdminTournamentRegistrations: vi.fn(),
  rejectAdminHorse: vi.fn(),
  rejectAdminTournamentRegistration: vi.fn(),
}));

describe("AdminTournamentRegistrationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminTournamentRegistrations).mockResolvedValue([
      {
        id: 11,
        tournamentId: 2,
        tournamentName: "Spring Cup",
        horseId: 8,
        horseName: "Storm Signal",
        ownerId: 5,
        ownerName: "Linh Tran",
        status: "PENDING",
        note: "Ready for review",
      },
    ]);
    vi.mocked(approveAdminTournamentRegistration).mockResolvedValue({
      id: 11,
      tournamentId: 2,
      tournamentName: "Spring Cup",
      horseId: 8,
      horseName: "Storm Signal",
      status: "APPROVED",
    });
    vi.mocked(rejectAdminTournamentRegistration).mockResolvedValue({
      id: 11,
      tournamentId: 2,
      tournamentName: "Spring Cup",
      horseId: 8,
      horseName: "Storm Signal",
      status: "REJECTED",
    });
  });

  it("loads pending tournament registrations and approves one", async () => {
    render(
      <MemoryRouter>
        <AdminTournamentRegistrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /tournament registrations/i })).toBeInTheDocument();
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getByText("Storm Signal")).toBeInTheDocument();
    expect(screen.getByText("Linh Tran")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /approve spring cup registration/i }));

    await waitFor(() => {
      expect(approveAdminTournamentRegistration).toHaveBeenCalledWith(11);
    });
  });
});
