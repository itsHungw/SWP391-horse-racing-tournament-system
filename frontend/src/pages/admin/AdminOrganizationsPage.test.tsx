import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminOrganizations } from "../../api/racingApi";
import { httpClient } from "../../api/httpClient";
import { AdminOrganizationsPage } from "./AdminOrganizationsPage";

vi.mock("../../api/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

vi.mock("../../api/racingApi", () => ({
  approveOrganization: vi.fn(),
  getAdminOrganizations: vi.fn(),
  reactivateOrganization: vi.fn(),
  rejectOrganization: vi.fn(),
  suspendOrganization: vi.fn(),
}));

describe("AdminOrganizationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminOrganizations).mockResolvedValue([
      {
        id: 21,
        code: "SGR",
        name: "Sai gon racing club",
        status: "PENDING",
        licenseNumber: "LIC-2026",
        evidenceUrl: "/api/v1/files/private/license.pdf",
        ownerName: "Nguyen Vinh Hung",
      },
    ]);
  });

  it("opens private organization credentials through the authenticated file API", async () => {
    const popup = {
      close: vi.fn(),
      location: { href: "about:blank" },
      opener: window,
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { url: "https://s3.example.com/license.pdf" },
    });

    render(
      <MemoryRouter>
        <AdminOrganizationsPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("link", { name: /credentials/i }));

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith("/files/private/license.pdf");
      expect(popup.location.href).toBe("https://s3.example.com/license.pdf");
    });
  });
});
