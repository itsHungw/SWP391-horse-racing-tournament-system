import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptRefereeContract,
  declineRefereeContract,
  getMyRefereeContracts,
} from "../../api/racingApi";
import type { RefereeContract } from "../../types/racing";
import { RefereeContractsPage } from "./RefereeContractsPage";

vi.mock("../../api/racingApi", () => ({
  acceptRefereeContract: vi.fn(),
  declineRefereeContract: vi.fn(),
  getMyRefereeContracts: vi.fn(),
}));

const mockContracts: RefereeContract[] = [
  {
    id: 1,
    tournamentId: 3,
    tournamentName: "Royal Derby Cup 2026",
    refereeId: 4,
    status: "PENDING",
    reason: "",
    createdAt: "2026-06-20T10:00:00Z",
  },
  {
    id: 2,
    tournamentId: 4,
    tournamentName: "Spring Stakes Festival",
    refereeId: 4,
    status: "ACTIVE",
    reason: "",
    createdAt: "2026-05-15T09:30:00Z",
  },
  {
    id: 3,
    tournamentId: 5,
    tournamentName: "Grand Autumn Steeplechase",
    refereeId: 4,
    status: "DECLINED",
    reason: "Prior commitment during race week.",
    createdAt: "2026-06-01T12:00:00Z",
  },
];

describe("RefereeContractsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyRefereeContracts).mockResolvedValue(mockContracts);
    vi.mocked(acceptRefereeContract).mockImplementation(async (contractId) => ({
      ...mockContracts.find((c) => c.id === contractId)!,
      status: "ACTIVE",
    }));
    vi.mocked(declineRefereeContract).mockImplementation(async (contractId, reason) => ({
      ...mockContracts.find((c) => c.id === contractId)!,
      status: "DECLINED",
      reason: reason || "",
    }));
  });

  it("uses split list and detail panel for contract workflow", async () => {
    render(
      <MemoryRouter>
        <RefereeContractsPage />
      </MemoryRouter>,
    );

    const list = await screen.findByRole("list", { name: /contract list/i });
    expect(within(list).getByRole("button", { name: /royal derby cup 2026/i })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: /contract detail/i });
    expect(within(detail).getByRole("heading", { name: /contract detail/i })).toBeInTheDocument();

    // Accept contract
    fireEvent.click(within(detail).getByRole("button", { name: /accept contract/i }));

    await waitFor(() => {
      expect(acceptRefereeContract).toHaveBeenCalledWith(1);
    });
  });

  it("supports status filters, search input, and contract list selection", async () => {
    render(
      <MemoryRouter>
        <RefereeContractsPage />
      </MemoryRouter>,
    );

    const filterTabs = await screen.findByRole("tablist", { name: /contract filters/i });
    expect(within(filterTabs).getByRole("tab", { name: /pending 1/i })).toHaveAttribute("aria-selected", "true");

    // Change search query
    const searchInput = screen.getByPlaceholderText(/search tournament/i);
    fireEvent.change(searchInput, {
      target: { value: "Non-existent Tournament" },
    });
    
    await waitFor(() => {
      const list = screen.queryByRole("list", { name: /contract list/i });
      if (list) {
        expect(within(list).queryByRole("button", { name: /royal derby cup 2026/i })).not.toBeInTheDocument();
      } else {
        expect(screen.queryByRole("button", { name: /royal derby cup 2026/i })).not.toBeInTheDocument();
      }
    });

    // Reset search
    fireEvent.change(searchInput, {
      target: { value: "" },
    });

    // Switch tab to Active
    const activeTab = within(filterTabs).getByRole("tab", { name: /active/i });
    fireEvent.click(activeTab);

    await waitFor(() => {
      const list = screen.getByRole("list", { name: /contract list/i });
      expect(within(list).getByRole("button", { name: /spring stakes festival/i })).toBeInTheDocument();
    });
  });

  it("declines a pending contract with a reason in modal", async () => {
    render(
      <MemoryRouter>
        <RefereeContractsPage />
      </MemoryRouter>,
    );

    const detail = await screen.findByRole("region", { name: /contract detail/i });
    fireEvent.click(within(detail).getByRole("button", { name: /decline/i }));

    const dialog = await screen.findByRole("dialog", { name: /decline contract/i });
    fireEvent.change(within(dialog).getByPlaceholderText(/explain why/i), {
      target: { value: "Personal schedule conflicts." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /^decline contract$/i }));

    await waitFor(() => {
      expect(declineRefereeContract).toHaveBeenCalledWith(1, "Personal schedule conflicts.");
    });
  });
});
