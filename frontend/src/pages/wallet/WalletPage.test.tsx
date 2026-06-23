import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { walletApi } from "../../api/walletApi";
import { WalletPage } from "./WalletPage";

vi.mock("../../api/walletApi", () => ({
  walletApi: {
    getMyWallet: vi.fn(),
    getMyTransactions: vi.fn(),
    getMyWithdrawals: vi.fn(),
    createTopUp: vi.fn(),
    createWithdrawal: vi.fn(),
  },
}));

describe("WalletPage", () => {
  beforeEach(() => {
    vi.mocked(walletApi.getMyWallet).mockResolvedValue({
      userId: 7,
      balance: 1245875,
      status: "ACTIVE",
    });
    vi.mocked(walletApi.getMyTransactions).mockResolvedValue([
      {
        id: 1,
        amount: 25000,
        type: "BET_PAYOUT",
        referenceType: "RACE",
        referenceId: 9,
        balanceAfter: 1245875,
        description: "Race #9 payout",
        createdAt: "2026-06-20T08:30:00Z",
      },
      {
        id: 2,
        amount: -10000,
        type: "BET_PLACED",
        referenceType: "RACE",
        referenceId: 8,
        balanceAfter: 1220875,
        description: "Prediction entry",
        createdAt: "2026-06-19T08:30:00Z",
      },
    ]);
    vi.mocked(walletApi.getMyWithdrawals).mockResolvedValue([
      {
        id: 3,
        userId: 7,
        userName: "Racing Fan",
        userEmail: "fan@example.com",
        amount: 150000,
        status: "REQUESTED",
        bankInfo: "Racing Fan - 123456789 - VCB",
        reviewNote: null,
        reviewedByName: null,
        requestedAt: "2026-06-21T10:00:00Z",
        reviewedAt: null,
        paidAt: null,
      },
    ]);
  });

  it("renders a platform-grade racing wallet with pass, dock, and ledger sections", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet?topup=success"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /racing pass/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/top-up successful/i);

    const moneyMovement = screen.getByRole("region", { name: /money movement/i });
    expect(within(moneyMovement).getByRole("button", { name: /top up 50,000 vnd/i })).toBeEnabled();
    expect(within(moneyMovement).getByRole("button", { name: /top up 500,000 vnd/i })).toBeEnabled();

    expect(screen.getByLabelText(/withdraw amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bank account details/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /withdrawal desk/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /platform guardrails/i })).toBeInTheDocument();

    const transactions = screen.getByRole("table", { name: /cashflow ledger/i });
    expect(within(transactions).getByText("Race payout")).toBeInTheDocument();
    expect(within(transactions).getByText("+25,000 VND")).toBeInTheDocument();
    expect(screen.getByText(/racing fan - 123456789 - vcb/i)).toBeInTheDocument();
  });
});
