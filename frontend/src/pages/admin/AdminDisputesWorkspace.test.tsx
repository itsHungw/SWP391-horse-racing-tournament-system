import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { disputeApi } from "../../api/disputeApi";
import { AdminDisputesWorkspace } from "./AdminDisputesWorkspace";

vi.mock("../../api/disputeApi", async () => {
  const actual = await vi.importActual<typeof import("../../api/disputeApi")>("../../api/disputeApi");
  return { ...actual, disputeApi: { getAdminDisputes: vi.fn(), updateDisputeStatus: vi.fn() } };
});

describe("AdminDisputesWorkspace", () => {
  beforeEach(() => {
    vi.mocked(disputeApi.getAdminDisputes).mockResolvedValue([{
      id: 7,
      requesterId: 3,
      requesterName: "Spectator",
      requesterEmail: "spectator@example.com",
      requesterRole: "SPECTATOR",
      handlerRole: "ADMIN",
      tournamentId: null,
      organizationId: null,
      referenceType: "WALLET_TRANSACTION",
      referenceId: 91,
      category: "FINANCE",
      title: "Wallet balance is incorrect",
      description: "Please investigate",
      status: "OPEN",
      priority: "HIGH",
      resolutionNote: null,
      resolvedAt: null,
      createdAt: "2026-07-15T10:30:00Z",
      updatedAt: "2026-07-15T10:30:00Z",
      attachments: [],
    }]);
  });

  it("finds a related wallet dispute by transaction reference ID", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/disputes?transactionId=91"]}>
        <AdminDisputesWorkspace />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Wallet balance is incorrect")).toBeInTheDocument();
    expect(screen.getByText("WALLET_TRANSACTION #91")).toBeInTheDocument();
  });
});
