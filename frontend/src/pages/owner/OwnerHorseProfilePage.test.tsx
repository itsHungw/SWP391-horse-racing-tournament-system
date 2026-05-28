import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createOwnerHorseDocument,
  getOwnerHorse,
  getOwnerHorseDocuments,
  getOwnerTournamentRegistrations,
  withdrawOwnerTournamentRegistration,
} from "../../api/racingApi";
import { OwnerHorseProfilePage } from "./OwnerHorseProfilePage";

vi.mock("../../api/racingApi", () => ({
  createOwnerHorseDocument: vi.fn(),
  getOwnerHorse: vi.fn(),
  getOwnerHorseDocuments: vi.fn(),
  getOwnerTournamentRegistrations: vi.fn(),
  withdrawOwnerTournamentRegistration: vi.fn(),
}));

function renderProfile(path = "/owner/horses/1") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/owner/horses/:horseId" element={<OwnerHorseProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OwnerHorseProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOwnerHorse).mockResolvedValue({
      id: 1,
      name: "Nova",
      breed: "Thoroughbred",
      color: "Bay",
      registrationCode: "NOVA-1",
      gender: "FEMALE",
      imageUrl: "/uploads/horses/images/nova.jpg",
      evidenceUrl: "/uploads/horses/evidence/nova.pdf",
      healthStatus: "Fit",
      medicalNote: "Annual health certificate uploaded.",
      status: "APPROVED",
    });
    vi.mocked(getOwnerTournamentRegistrations).mockResolvedValue([
      {
        id: 12,
        tournamentId: 4,
        tournamentName: "Spring Cup",
        horseId: 1,
        horseName: "Nova",
        status: "PENDING",
      },
    ]);
    vi.mocked(getOwnerHorseDocuments).mockResolvedValue([
      {
        id: 7,
        horseId: 1,
        horseName: "Nova",
        documentType: "HEALTH_CERTIFICATE",
        referenceNumber: "HC-2026-001",
        issueDate: "2026-05-01",
        expiryDate: "2027-05-01",
        issuer: "Saigon Equine Clinic",
        fileUrl: "/uploads/horses/documents/health.pdf",
      },
    ]);
    vi.mocked(createOwnerHorseDocument).mockResolvedValue({
      id: 8,
      horseId: 1,
      horseName: "Nova",
      documentType: "COGGINS",
      referenceNumber: "COG-2026-001",
      issueDate: "2026-05-01",
      expiryDate: "2027-05-01",
      issuer: "Saigon Equine Clinic",
      fileUrl: "/uploads/horses/documents/coggins.pdf",
    });
    vi.mocked(withdrawOwnerTournamentRegistration).mockResolvedValue({
      id: 12,
      tournamentId: 4,
      tournamentName: "Spring Cup",
      horseId: 1,
      horseName: "Nova",
      status: "WITHDRAWN",
    });
  });

  it("renders overview document status and approved registration CTA", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: /nova/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to roster/i })).toHaveAttribute("href", "/owner/horses");
    expect(screen.getByRole("link", { name: /^register tournament$/i })).toHaveAttribute("href", "/owner/registrations");
    expect(screen.queryByRole("button", { name: /^documents$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /medical documents status/i })).toBeInTheDocument();
    expect(screen.getByText(/health certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/HC-2026-001/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open health certificate/i })).toHaveAttribute(
      "href",
      "/uploads/horses/documents/health.pdf",
    );

    fireEvent.click(screen.getByRole("button", { name: /tournament registrations/i }));
    expect(screen.getByText(/spring cup/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register this horse/i })).toHaveAttribute("href", "/owner/registrations");

    fireEvent.click(screen.getByRole("button", { name: /health notes/i }));
    expect(screen.getByText(/annual health certificate uploaded/i)).toBeInTheDocument();
  });

  it("uploads a medical document from the overview modal", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: /nova/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add document/i }));

    const dialog = screen.getByRole("dialog", { name: /medical document/i });
    const documentFile = new File(["document"], "coggins.pdf", { type: "application/pdf" });
    fireEvent.change(within(dialog).getByLabelText(/document type/i), { target: { value: "COGGINS" } });
    fireEvent.change(within(dialog).getByLabelText(/id\/reference number/i), { target: { value: "COG-2026-001" } });
    fireEvent.change(within(dialog).getByLabelText(/issue date/i), { target: { value: "2026-05-01" } });
    fireEvent.change(within(dialog).getByLabelText(/expiry date/i), { target: { value: "2027-05-01" } });
    fireEvent.change(within(dialog).getByLabelText(/^issuer/i), { target: { value: "Saigon Equine Clinic" } });
    fireEvent.change(within(dialog).getByLabelText(/document attachment/i), { target: { files: [documentFile] } });
    fireEvent.change(within(dialog).getByLabelText(/notes/i), { target: { value: "Clear." } });
    fireEvent.submit(within(dialog).getByRole("button", { name: /save document/i }).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(createOwnerHorseDocument).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          documentType: "COGGINS",
          referenceNumber: "COG-2026-001",
          documentFile,
        }),
      );
    });
  });

  it("opens the add document modal with Coggins preselected from the Coggins card", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: /nova/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add coggins/i }));

    const dialog = screen.getByRole("dialog", { name: /medical document/i });
    expect(within(dialog).getByLabelText(/document type/i)).toHaveValue("COGGINS");
  });

  it("explains why pending horses cannot register", async () => {
    vi.mocked(getOwnerHorse).mockResolvedValueOnce({
      id: 2,
      name: "Storm",
      gender: "MALE",
      status: "PENDING",
    });

    renderProfile("/owner/horses/2");

    expect(await screen.findByRole("heading", { name: /storm/i })).toBeInTheDocument();
    expect(screen.getAllByText(/admin review is still pending/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /tournament registrations/i }));
    expect(screen.getAllByText(/admin review is still pending/i).length).toBeGreaterThan(0);
  });

  it("withdraws a pending registration from the profile", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: /nova/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /tournament registrations/i }));

    const table = screen.getByRole("table");
    fireEvent.click(within(table).getByRole("button", { name: /withdraw/i }));

    await waitFor(() => {
      expect(withdrawOwnerTournamentRegistration).toHaveBeenCalledWith(12);
    });
  });
});
