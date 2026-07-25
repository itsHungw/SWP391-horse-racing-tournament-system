import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminFinanceApi } from "../../../api/adminFinanceApi";
import { AdminFinanceOverviewPage } from "./AdminFinanceOverviewPage";

vi.mock("../../../api/adminFinanceApi", () => ({
  adminFinanceApi: {
    getSummary: vi.fn(),
    getReconciliationSummary: vi.fn(),
    listTransactions: vi.fn(),
    getTransaction: vi.fn(),
  },
}));

const summary = {
  from: "2026-07-01",
  to: "2026-07-31",
  settledWagers: 500_000,
  payouts: 410_000,
  refunds: 20_000,
  ggr: 70_000,
  ggrMargin: 0.14,
  successfulTopUps: 1_200_000,
  paidWithdrawals: 300_000,
  netCashMovement: 900_000,
  walletLiability: 2_400_000,
  previousSettledWagers: 400_000,
  previousPayouts: 350_000,
  previousGgr: 50_000,
  ggrChangePercent: 0.4,
};

const transaction = {
  id: 91,
  userId: 7,
  userEmail: "spectator@example.com",
  userName: "Spectator One",
  amount: 500_000,
  balanceBefore: 100_000,
  balanceAfter: 600_000,
  transactionType: "TOPUP" as const,
  referenceType: "TOPUP_ORDER",
  referenceId: 52,
  description: "VNPay top-up",
  createdAt: "2026-07-15T10:30:00",
  sourceStatus: "SUCCESS",
  sourceTrace: "TopUpOrder -> TOPUP -> wallet balance",
};

const healthyAlerts = {
  missingWalletCredits: 0,
  amountMismatches: 0,
  unexpectedWalletCredits: 0,
  orphanWalletCredits: 0,
  stalePendingOrders: 0,
};

describe("AdminFinanceOverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminFinanceApi.getSummary).mockResolvedValue(summary);
    vi.mocked(adminFinanceApi.getReconciliationSummary).mockResolvedValue({
      ...healthyAlerts,
      missingWalletCredits: 2,
    });
    vi.mocked(adminFinanceApi.listTransactions).mockResolvedValue({
      content: [transaction], totalElements: 1, totalPages: 1, number: 0, size: 8,
    });
    vi.mocked(adminFinanceApi.getTransaction).mockResolvedValue(transaction);
  });

  it("shows finance health, actionable reconciliation alerts, and recent transaction evidence", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/finance?days=30"]}>
        <AdminFinanceOverviewPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /finance overview/i })).toBeInTheDocument();
    expect(screen.getByText("Gross gaming revenue")).toBeInTheDocument();
    expect(screen.getByText("Successful top-ups")).toBeInTheDocument();
    expect(screen.getByText("Paid withdrawals")).toBeInTheDocument();
    expect(screen.getByText("Net cash movement")).toBeInTheDocument();
    expect(screen.getByText("Wallet liability")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /revenue trend/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("table", { name: /performance by product/i })).not.toBeInTheDocument();

    const missingCreditLink = await screen.findByRole("link", { name: /review 2 missing wallet credits/i });
    expect(missingCreditLink).toHaveAttribute("href", expect.stringContaining("reconciliationStatus=MISSING_WALLET_CREDIT"));
    expect(screen.getByRole("heading", { name: /recent transactions/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view transaction 91/i }));
    expect(await screen.findByRole("dialog", { name: /transaction 91/i })).toBeInTheDocument();
    expect(screen.getByText("TopUpOrder -> TOPUP -> wallet balance")).toBeInTheDocument();

    await waitFor(() => {
      expect(adminFinanceApi.listTransactions).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 8 }));
      expect(adminFinanceApi.getTransaction).toHaveBeenCalledWith(91);
    });
  });

  it("keeps successful sections visible and retries only a failed alert section", async () => {
    vi.mocked(adminFinanceApi.getReconciliationSummary)
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(healthyAlerts);

    render(
      <MemoryRouter>
        <AdminFinanceOverviewPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Gross gaming revenue")).toBeInTheDocument();
    expect(screen.getByText("Spectator One")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(/reconciliation alerts could not be loaded/i);

    fireEvent.click(screen.getByRole("button", { name: /retry reconciliation alerts/i }));

    expect(await screen.findByText(/no reconciliation exceptions in this period/i)).toBeInTheDocument();
    expect(adminFinanceApi.getSummary).toHaveBeenCalledTimes(1);
    expect(adminFinanceApi.listTransactions).toHaveBeenCalledTimes(1);
    expect(adminFinanceApi.getReconciliationSummary).toHaveBeenCalledTimes(2);
  });
});
