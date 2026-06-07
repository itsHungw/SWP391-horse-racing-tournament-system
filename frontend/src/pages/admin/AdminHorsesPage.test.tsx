import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { approveAdminHorse, getAdminHorses, rejectAdminHorse } from "../../api/racingApi";
import { AdminHorsesPage } from "./AdminHorsesPage";

vi.mock("../../api/racingApi", () => ({
  approveAdminHorse: vi.fn(),
  approveAdminTournamentRegistration: vi.fn(),
  getAdminHorses: vi.fn(),
  getAdminTournamentRegistrations: vi.fn(),
  rejectAdminHorse: vi.fn(),
  rejectAdminTournamentRegistration: vi.fn(),
}));

describe("AdminHorsesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminHorses).mockResolvedValue([
      {
        id: 8,
        ownerName: "Linh Tran",
        name: "Storm Signal",
        gender: "FEMALE",
        imageUrl: "https://cdn.example.com/storm.jpg",
        evidenceUrl: "https://cdn.example.com/storm.pdf",
        status: "PENDING",
      },
    ]);
    vi.mocked(approveAdminHorse).mockResolvedValue({
      id: 8,
      name: "Storm Signal",
      gender: "FEMALE",
      status: "APPROVED",
    });
    vi.mocked(rejectAdminHorse).mockResolvedValue({
      id: 8,
      name: "Storm Signal",
      gender: "FEMALE",
      status: "REJECTED",
    });
  });

  it("loads pending horses, shows evidence, and approves a horse", async () => {
    render(
      <MemoryRouter>
        <AdminHorsesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /horse approvals/i })).toBeInTheDocument();
    expect(screen.getByText("Storm Signal")).toBeInTheDocument();
    expect(screen.getByText("Linh Tran")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /evidence/i })).toHaveAttribute(
      "href",
      "https://cdn.example.com/storm.pdf",
    );

    fireEvent.click(screen.getByRole("button", { name: /approve storm signal/i }));

    await waitFor(() => {
      expect(approveAdminHorse).toHaveBeenCalledWith(8);
    });
  });
});
