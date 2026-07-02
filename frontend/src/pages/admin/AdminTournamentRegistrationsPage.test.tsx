import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  approveAdminTournamentRegistration,
  getAdminTournamentRegistrations,
  rejectAdminTournamentRegistration,
} from "../../api/racingApi";
import { httpClient } from "../../api/httpClient";
import { AdminTournamentRegistrationsPage } from "./AdminTournamentRegistrationsPage";

vi.mock("../../api/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

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
        horseEvidenceUrl: "/api/v1/files/private/horse-evidence.pdf",
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

  it("opens private horse evidence through the authenticated file API", async () => {
    const popup = {
      close: vi.fn(),
      location: { href: "about:blank" },
      opener: window,
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { url: "https://s3.example.com/horse-evidence.pdf" },
    });

    render(
      <MemoryRouter>
        <AdminTournamentRegistrationsPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("link", { name: /evidence/i }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith("/files/private/horse-evidence.pdf");
      expect(popup.location.href).toBe("https://s3.example.com/horse-evidence.pdf");
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
