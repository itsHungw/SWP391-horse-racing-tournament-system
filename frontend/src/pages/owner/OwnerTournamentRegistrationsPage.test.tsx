import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerTournamentRegistrations,
  getPublicTournaments,
  getOwnerHorseDocuments,
} from "../../api/racingApi";
import { OwnerTournamentRegistrationsPage } from "./OwnerTournamentRegistrationsPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerTournamentRegistration: vi.fn(),
  getOwnerHorses: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  getPublicTournaments: vi.fn(),
  getOwnerHorseDocuments: vi.fn(),
  withdrawOwnerTournamentRegistration: vi.fn(),
}));

describe("OwnerTournamentRegistrationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicTournaments).mockResolvedValue([
      { id: 1, name: "Spring Cup", status: "OPEN_REGISTRATION", endDate: "2026-06-01" },
      { id: 2, name: "Closed Cup", status: "CLOSED_REGISTRATION", endDate: "2026-07-01" },
    ]);
    vi.mocked(getOwnerHorses).mockResolvedValue([
      { id: 3, name: "Approved Horse", gender: "MALE", status: "APPROVED" },
      { id: 4, name: "Pending Horse", gender: "FEMALE", status: "PENDING" },
    ]);
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([]);
    vi.mocked(getOwnerHorseDocuments).mockResolvedValue([
      { id: 10, horseId: 3, documentType: "COGGINS", referenceNumber: "COG123", expiryDate: "2026-09-01", fileUrl: "url", issueDate: "2026-01-01", issuer: "Vet" },
      { id: 11, horseId: 3, documentType: "HEALTH_CERTIFICATE", referenceNumber: "HEA123", expiryDate: "2026-09-01", fileUrl: "url", issueDate: "2026-01-01", issuer: "Vet" },
    ]);
    vi.mocked(createOwnerTournamentRegistration).mockResolvedValue({
      id: 8,
      tournamentId: 1,
      tournamentName: "Spring Cup",
      horseId: 3,
      horseName: "Approved Horse",
      status: "PENDING",
    });
  });

  it("runs through the 3-step wizard registration with document validation", async () => {
    render(
      <MemoryRouter>
        <OwnerTournamentRegistrationsPage />
      </MemoryRouter>,
    );

    // --- STEP 1: Select Tournament ---
    expect(await screen.findByRole("heading", { name: /tournament registrations/i })).toBeInTheDocument();
    const registerButton = await screen.findByRole("button", { name: /register for this tournament/i });
    fireEvent.click(registerButton);

    // --- STEP 2: Select Horse ---
    expect(await screen.findByText(/Step 2: Select Horse/i)).toBeInTheDocument();
    const selectHorse = screen.getByRole("combobox");
    fireEvent.change(selectHorse, { target: { value: "3" } });

    // Verify medical documents are fetched
    await waitFor(() => {
      expect(getOwnerHorseDocuments).toHaveBeenCalledWith(3);
    });
    const validBadges = await screen.findAllByText(/✓ Valid/i);
    expect(validBadges).toHaveLength(2);

    const nextButton = screen.getByRole("button", { name: /continue →/i });
    fireEvent.click(nextButton);

    // --- STEP 3: Confirm ---
    expect(await screen.findByText(/Step 3: Confirm Registration/i)).toBeInTheDocument();
    const noteInput = screen.getByPlaceholderText(/e\.g\. special transportation/i);
    fireEvent.change(noteInput, { target: { value: "Special transport needed" } });

    const confirmButton = screen.getByRole("button", { name: /confirm registration/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(createOwnerTournamentRegistration).toHaveBeenCalledWith({
        tournamentId: 1,
        horseId: 3,
        note: "Special transport needed",
      });
    });
  });
});
