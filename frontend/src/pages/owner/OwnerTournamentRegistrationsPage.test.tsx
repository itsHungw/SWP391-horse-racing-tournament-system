import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerTournamentRegistrations,
  getPublicTournaments,
} from "../../api/racingApi";
import { OwnerTournamentRegistrationsPage } from "./OwnerTournamentRegistrationsPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerTournamentRegistration: vi.fn(),
  getOwnerHorses: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  getPublicTournaments: vi.fn(),
  withdrawOwnerTournamentRegistration: vi.fn(),
}));

describe("OwnerTournamentRegistrationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicTournaments).mockResolvedValue([
      { id: 1, name: "Spring Cup", status: "OPEN_REGISTRATION" },
      { id: 2, name: "Closed Cup", status: "CLOSED_REGISTRATION" },
    ]);
    vi.mocked(getOwnerHorses).mockResolvedValue([
      { id: 3, name: "Approved Horse", gender: "MALE", status: "APPROVED" },
      { id: 4, name: "Pending Horse", gender: "FEMALE", status: "PENDING" },
    ]);
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([]);
    vi.mocked(createOwnerTournamentRegistration).mockResolvedValue({
      id: 8,
      tournamentId: 1,
      tournamentName: "Spring Cup",
      horseId: 3,
      horseName: "Approved Horse",
      status: "PENDING",
    });
  });

  it("submits an approved horse into an open tournament", async () => {
    render(
      <MemoryRouter>
        <OwnerTournamentRegistrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /tournament registrations/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /approved horse/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /pending horse/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^tournament$/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^horse$/i), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /submit registration/i }));

    await waitFor(() => {
      expect(createOwnerTournamentRegistration).toHaveBeenCalledWith({
        tournamentId: 1,
        horseId: 3,
        note: undefined,
      });
    });
  });
});
