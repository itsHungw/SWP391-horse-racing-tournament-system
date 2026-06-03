import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptJockeyContract,
  getJockeyContracts,
  rejectJockeyContract,
} from "../../api/racingApi";
import type { JockeyInvitation } from "../../types/racing";
import { JockeyContractsPage } from "./JockeyContractsPage";

vi.mock("../../api/racingApi", () => ({
  acceptJockeyContract: vi.fn(),
  getJockeyContracts: vi.fn(),
  rejectJockeyContract: vi.fn(),
}));

const contracts: JockeyInvitation[] = [
  {
    id: 1,
    championshipId: 7,
    championshipName: "Summer Championship 2026",
    horseRegistrationId: 11,
    horseId: 4,
    horseName: "Thunder Bolt",
    ownerId: 2,
    ownerName: "Sunrise Stable",
    jockeyId: 9,
    jockeyName: "Nguyen Van A",
    jockeyApplicationId: 21,
    message: "Please confirm availability for the full championship assignment.",
    agreementUrl: "https://example.com/summer.pdf",
    agreementFileName: "summer-assignment-agreement.pdf",
    status: "ACCEPTED",
    acceptedAt: "2026-05-21T10:00:00",
    createdAt: "2026-05-20T10:00:00",
  },
  {
    id: 2,
    championshipId: 7,
    championshipName: "Summer Championship 2026",
    horseRegistrationId: 12,
    horseId: 5,
    horseName: "Black Storm",
    ownerId: 3,
    ownerName: "River Gate Stable",
    jockeyId: 9,
    jockeyName: "Nguyen Van A",
    jockeyApplicationId: 21,
    message: "We would like to assign you as the primary rider for Black Storm.",
    agreementUrl: "https://example.com/river.pdf",
    agreementFileName: "river-gate-summer-terms.pdf",
    status: "PENDING",
    createdAt: "2026-05-22T10:00:00",
  },
  {
    id: 3,
    championshipId: 8,
    championshipName: "Autumn Cup 2026",
    horseRegistrationId: 13,
    horseId: 6,
    horseName: "Silver Ray",
    ownerId: 4,
    ownerName: "Northwind Stable",
    jockeyId: 9,
    jockeyName: "Nguyen Van A",
    jockeyApplicationId: 22,
    message: "Open pool assignment for Autumn Cup commitment.",
    agreementFileName: "autumn-cup-assignment.pdf",
    status: "PENDING",
    createdAt: "2026-06-01T10:00:00",
  },
];

describe("JockeyContractsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJockeyContracts).mockResolvedValue(contracts);
    vi.mocked(acceptJockeyContract).mockImplementation(async (contractId) => ({
      ...contracts.find((contract) => contract.id === contractId)!,
      status: "ACCEPTED",
      acceptedAt: "2026-06-02T09:00:00",
    }));
    vi.mocked(rejectJockeyContract).mockImplementation(async (contractId, reason) => ({
      ...contracts.find((contract) => contract.id === contractId)!,
      status: "REJECTED",
      rejectedAt: "2026-06-02T09:00:00",
      rejectionReason: reason,
    }));
  });

  it("uses compact contract list with a detail panel for decisions", async () => {
    render(
      <MemoryRouter>
        <JockeyContractsPage />
      </MemoryRouter>,
    );

    const list = await screen.findByRole("list", { name: /contract list/i });
    expect(within(list).getByRole("button", { name: /river gate stable/i })).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: /northwind stable/i })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: /contract detail/i });
    expect(within(detail).getByRole("heading", { name: /contract detail/i })).toBeInTheDocument();
    expect(within(detail).getByText(/river-gate-summer-terms\.pdf/i)).toBeInTheDocument();

    fireEvent.click(within(list).getByRole("button", { name: /northwind stable/i }));
    expect(within(detail).getAllByText(/silver ray/i).length).toBeGreaterThan(0);

    fireEvent.click(within(detail).getByRole("button", { name: /accept contract/i }));

    await waitFor(() => {
      expect(acceptJockeyContract).toHaveBeenCalledWith(3);
    });
    expect(await screen.findByRole("tab", { name: /accepted 2/i })).toHaveAttribute("aria-selected", "true");
  });

  it("supports inbox filters, unread state, search, and agreement preview", async () => {
    render(
      <MemoryRouter>
        <JockeyContractsPage />
      </MemoryRouter>,
    );

    const tabs = await screen.findByRole("tablist", { name: /contract filters/i });
    expect(within(tabs).getByRole("tab", { name: /pending 2/i })).toHaveAttribute("aria-selected", "true");

    const list = screen.getByRole("list", { name: /contract list/i });
    const riverGate = within(list).getByRole("button", { name: /river gate stable/i });
    expect(within(riverGate).getByText(/unread contract/i)).toBeInTheDocument();
    expect(within(riverGate).getByText(/received may 22, 2026/i)).toBeInTheDocument();

    fireEvent.click(riverGate);
    expect(within(riverGate).queryByText(/unread contract/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search owner, horse, championship/i), {
      target: { value: "Northwind" },
    });
    expect(within(list).getByRole("button", { name: /northwind stable/i })).toBeInTheDocument();
    expect(within(list).queryByRole("button", { name: /river gate stable/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/search owner, horse, championship/i), {
      target: { value: "" },
    });
    fireEvent.click(within(tabs).getByRole("tab", { name: /accepted 1/i }));
    expect(within(list).getByRole("button", { name: /sunrise stable/i })).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: /contract detail/i });
    expect(within(detail).getByText(/assignment agreement/i)).toBeInTheDocument();
    expect(within(detail).getByText(/uploaded by sunrise stable/i)).toBeInTheDocument();
    expect(within(detail).getByRole("button", { name: /preview pdf/i })).toBeInTheDocument();

    fireEvent.click(within(detail).getByRole("button", { name: /preview pdf/i }));
    expect(within(detail).getByRole("region", { name: /pdf preview/i })).toBeInTheDocument();
  });

  it("rejects a pending contract with a reason", async () => {
    render(
      <MemoryRouter>
        <JockeyContractsPage />
      </MemoryRouter>,
    );

    const detail = await screen.findByRole("region", { name: /contract detail/i });
    fireEvent.click(within(detail).getByRole("button", { name: /^reject$/i }));

    const dialog = await screen.findByRole("dialog", { name: /reject contract/i });
    fireEvent.change(within(dialog).getByPlaceholderText(/explain why/i), {
      target: { value: "Schedule conflict." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /^reject contract$/i }));

    await waitFor(() => {
      expect(rejectJockeyContract).toHaveBeenCalledWith(2, "Schedule conflict.");
    });
  });
});
