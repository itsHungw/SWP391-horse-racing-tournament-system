import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "../../api/httpClient";
import type { TournamentRegistration } from "../../types/racing";
import { RegistrationDetailDrawer } from "./RegistrationDetailDrawer";

vi.mock("../../api/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe("RegistrationDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens private horse papers through the authenticated file API", async () => {
    const popup = {
      close: vi.fn(),
      location: { href: "about:blank" },
      opener: window,
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { url: "https://s3.example.com/horse-paper.pdf" },
    });

    const registration: TournamentRegistration = {
      id: 11,
      tournamentId: 2,
      tournamentName: "Spring Cup",
      horseId: 8,
      horseName: "Storm Signal",
      horseEvidenceUrl: "/api/v1/files/private/horse-paper.pdf",
      ownerId: 5,
      ownerName: "Linh Tran",
      status: "PENDING",
      createdAt: "2026-06-29T10:00:00",
    };

    render(
      <RegistrationDetailDrawer
        busy={false}
        entry={{ kind: "horses", data: registration }}
        onApprove={vi.fn()}
        onClose={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: /view submitted document/i }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith("/files/private/horse-paper.pdf");
      expect(popup.location.href).toBe("https://s3.example.com/horse-paper.pdf");
    });
  });
});
