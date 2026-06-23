import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { walletApi } from "../../api/walletApi";
import { WalletPage } from "./WalletPage";

vi.mock("../../api/walletApi", () => ({
  walletApi: {
    getMyWallet: vi.fn(),
    getSummary: vi.fn(),
    getMyTransactions: vi.fn(),
    getMyWithdrawals: vi.fn(),
    createTopUp: vi.fn(),
    getBankAccounts: vi.fn(),
    addBankAccount: vi.fn(),
    deleteBankAccount: vi.fn(),
    createWithdrawal: vi.fn(),
    cancelWithdrawal: vi.fn(),
  },
}));

describe("WalletPage", () => {
  beforeEach(() => {
    vi.mocked(walletApi.getMyWallet).mockResolvedValue({
      userId: 7,
      balance: 1245875,
      status: "ACTIVE",
    });
    vi.mocked(walletApi.getSummary).mockResolvedValue({
      balance: 1245875,
      status: "ACTIVE",
      inPlay: 125000,
      pendingWithdrawal: 150000,
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
      {
        id: 4,
        amount: -150000,
        type: "WITHDRAWAL_HOLD",
        referenceType: "WITHDRAWAL",
        referenceId: 3,
        balanceAfter: 1210875,
        description: "Withdrawal hold",
        createdAt: "2026-06-18T08:30:00Z",
      },
      {
        id: 5,
        amount: 500000,
        type: "TOPUP",
        referenceType: "TOPUP_ORDER",
        referenceId: 21,
        balanceAfter: 1360875,
        description: "VNPay top-up",
        createdAt: "2026-06-17T08:30:00Z",
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
        bankInfo: "RACING FAN - 123456789 - Vietcombank (VCB)",
        reviewNote: null,
        reviewedByName: null,
        requestedAt: "2026-06-21T10:00:00Z",
        reviewedAt: null,
        paidAt: null,
      },
      {
        id: 6,
        userId: 7,
        userName: "Racing Fan",
        userEmail: "fan@example.com",
        amount: 80000,
        status: "CANCELLED",
        bankInfo: "RACING FAN - 987654321 - Techcombank (TCB)",
        reviewNote: null,
        reviewedByName: null,
        requestedAt: "2026-06-18T10:00:00Z",
        reviewedAt: "2026-06-18T10:05:00Z",
        paidAt: null,
      },
    ]);
    vi.mocked(walletApi.getBankAccounts).mockResolvedValue([
      {
        id: 11,
        bankCode: "VCB",
        bankName: "Vietcombank",
        accountNumber: "123456789",
        accountHolder: "RACING FAN",
        label: "Main account",
      },
    ]);
    vi.mocked(walletApi.createWithdrawal).mockResolvedValue({
      id: 12,
      userId: 7,
      userName: "Racing Fan",
      userEmail: "fan@example.com",
      amount: 100000,
      status: "REQUESTED",
      bankInfo: "RACING FAN - 123456789 - Vietcombank (VCB)",
      reviewNote: null,
      reviewedByName: null,
      requestedAt: "2026-06-22T10:00:00Z",
      reviewedAt: null,
      paidAt: null,
    });
    vi.mocked(walletApi.cancelWithdrawal).mockResolvedValue({
      id: 3,
      userId: 7,
      userName: "Racing Fan",
      userEmail: "fan@example.com",
      amount: 150000,
      status: "CANCELLED",
      bankInfo: "RACING FAN - 123456789 - Vietcombank (VCB)",
      reviewNote: null,
      reviewedByName: null,
      requestedAt: "2026-06-21T10:00:00Z",
      reviewedAt: "2026-06-21T10:05:00Z",
      paidAt: null,
    });
  });

  it("renders a platform-grade wallet with money states, performance, top-up, ledger, and payout queue", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet?topup=success"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /available balance/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/top-up successful/i);

    expect(screen.getByText("970,875 VND")).toBeInTheDocument();
    expect(screen.getByText("125,000 VND")).toBeInTheDocument();
    expect(screen.getAllByText("150,000 VND")[0]).toBeInTheDocument();

    expect(screen.getByRole("img", { name: /performance: net result \+15,000 vnd/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /performance/i })).toBeInTheDocument();

    const topUp = screen.getByRole("region", { name: /add money/i });
    expect(within(topUp).getByRole("button", { name: /top up 50,000 vnd/i })).toBeEnabled();
    expect(within(topUp).getByLabelText(/custom top-up amount/i)).toBeInTheDocument();

    const ledger = screen.getByRole("table", { name: /wallet ledger/i });
    expect(within(ledger).getByText("Race payout")).toBeInTheDocument();
    expect(within(ledger).getByText("+25,000 VND")).toBeInTheDocument();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
  });

  it("opens the single-screen withdraw sheet and submits to the selected saved account", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: /available balance/i });
    fireEvent.click(screen.getByRole("button", { name: /^withdraw$/i }));

    const dialog = await screen.findByRole("dialog", { name: /withdraw funds/i });
    expect(within(dialog).queryByText(/continue/i)).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/amount to withdraw/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/vietcombank/i)).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/amount to withdraw/i), { target: { value: "100000" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /withdraw 100,000 vnd/i }));

    await waitFor(() => {
      expect(walletApi.createWithdrawal).toHaveBeenCalledWith(
        100000,
        "RACING FAN · 123456789 · Vietcombank (VCB)",
      );
    });
  });

  it("cancels requested withdrawals from the payout queue", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: /available balance/i });
    fireEvent.click(screen.getByRole("button", { name: /cancel withdrawal 3/i }));

    await waitFor(() => {
      expect(walletApi.cancelWithdrawal).toHaveBeenCalledWith(3);
    });
  });
});
