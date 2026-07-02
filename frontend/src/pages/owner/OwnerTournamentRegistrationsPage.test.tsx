import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOwnerTournamentRegistration,
  getOwnerHorses,
  getOwnerAvailableJockeys,
  getOwnerTournamentRegistrationsPage,
  getPublicTournaments,
  getOwnerHorseDocuments,
  sendOwnerContract,
  uploadAgreementDocument,
} from "../../api/racingApi";
import { OwnerTournamentRegistrationsPage } from "./OwnerTournamentRegistrationsPage";
import { OwnerJockeyInvitationsPage } from "./OwnerJockeyInvitationsPage";

vi.mock("../../api/racingApi", () => ({
  createOwnerTournamentRegistration: vi.fn(),
  getOwnerHorses: vi.fn(),
  getOwnerAvailableJockeys: vi.fn(),
  getOwnerTournamentRegistrationsPage: vi.fn(),
  getPublicTournaments: vi.fn(),
  getOwnerHorseDocuments: vi.fn(),
  sendOwnerContract: vi.fn(),
  uploadAgreementDocument: vi.fn(),
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
    vi.mocked(getOwnerAvailableJockeys).mockResolvedValue([]);
    vi.mocked(getOwnerTournamentRegistrationsPage).mockResolvedValue(pageOf([]));
    vi.mocked(sendOwnerContract).mockResolvedValue({
      id: 99,
      championshipId: 1,
      championshipName: "Spring Cup",
      horseRegistrationId: 8,
      horseId: 3,
      horseName: "Approved Horse",
      ownerId: 2,
      ownerName: "Owner",
      jockeyId: 7,
      jockeyName: "Jockey",
      jockeyApplicationId: 5,
      status: "PENDING",
    });
    vi.mocked(getOwnerHorseDocuments).mockResolvedValue([
      {
        id: 10,
        horseId: 3,
        documentType: "COGGINS",
        referenceNumber: "COG123",
        issueDate: "2026-01-01",
        expiryDate: "2026-09-01",
        issuer: "Race Vet",
        fileUrl: "url",
      },
      {
        id: 11,
        horseId: 3,
        documentType: "HEALTH_CERTIFICATE",
        referenceNumber: "HEA123",
        issueDate: "2026-01-01",
        expiryDate: "2026-09-01",
        issuer: "Race Vet",
        fileUrl: "url",
      },
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
    await screen.findByText(/Coggins test certificate/i);
    expect(screen.getByText(/Health certificate/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ready/i)).toHaveLength(3);

    const nextButton = screen.getByRole("button", { name: /continue/i });
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

  it("paginates registration history", async () => {
    const registrations = Array.from({ length: 9 }, (_, index) => ({
        id: index + 1,
        tournamentId: index + 1,
        tournamentName: `Cup ${index + 1}`,
        horseId: 3,
        horseName: "Approved Horse",
        status: "PENDING" as const,
      }));
    vi.mocked(getOwnerTournamentRegistrationsPage).mockImplementation(({ page, size }) =>
      Promise.resolve(pageOf(registrations.slice(page * size, page * size + size), registrations.length, page, size)),
    );

    render(
      <MemoryRouter>
        <OwnerTournamentRegistrationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Cup 1")).toBeInTheDocument();
    expect(screen.queryByText("Cup 9")).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1-8 of 9/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));

    expect(await screen.findByText("Cup 9")).toBeInTheDocument();
    expect(screen.queryByText("Cup 1")).not.toBeInTheDocument();
  });

  it("uploads an agreement file before sending a jockey contract", async () => {
    vi.mocked(getOwnerTournamentRegistrationsPage).mockResolvedValue(
      pageOf([
        {
          id: 8,
          tournamentId: 1,
          tournamentName: "Spring Cup",
          horseId: 3,
          horseName: "Approved Horse",
          status: "APPROVED",
        },
      ]),
    );
    vi.mocked(getOwnerAvailableJockeys).mockResolvedValue([
      {
        id: 5,
        championshipId: 1,
        championshipName: "Spring Cup",
        jockeyId: 7,
        jockeyName: "Jockey",
        status: "APPROVED_FOR_POOL",
      },
    ]);
    vi.mocked(uploadAgreementDocument).mockResolvedValue({
      url: "/api/v1/files/download/agreement.pdf",
    });

    render(
      <MemoryRouter>
        <OwnerJockeyInvitationsPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /jockey pool/i }));
    const contractDialog = await screen.findByRole("dialog", { name: /send assignment contract/i });
    fireEvent.click(within(contractDialog).getByRole("button", { name: /jockey/i }));

    const agreementFile = new File(["agreement"], "agreement.pdf", { type: "application/pdf" });
    const fileInput = contractDialog.querySelector("input[type='file']");
    expect(fileInput).toBeInTheDocument();
    fireEvent.change(fileInput!, {
      target: { files: [agreementFile] },
    });
    expect(await screen.findByText("agreement.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /send contract/i }));

    await waitFor(() => {
      expect(uploadAgreementDocument).toHaveBeenCalledWith(agreementFile);
      expect(sendOwnerContract).toHaveBeenCalledWith(1, {
        horseRegistrationId: 8,
        jockeyApplicationId: 5,
        message: "We would like you to ride Approved Horse in Spring Cup.",
        agreementUrl: "/api/v1/files/download/agreement.pdf",
        agreementFileName: "agreement.pdf",
      });
    });
  });
});

function pageOf<T>(content: T[], totalElements = content.length, number = 0, size = 8) {
  return {
    content,
    number,
    size,
    totalElements,
    totalPages: Math.max(1, Math.ceil(totalElements / size)),
  };
}
