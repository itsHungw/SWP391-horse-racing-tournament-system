import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { walletApi } from "../../api/walletApi";
import { WalletPage } from "./WalletPage";

vi.mock("../../api/walletApi", () => ({
  walletApi: {
    getMyWallet: vi.fn(),
    getSummary: vi.fn(),
    getTopUpReceipt: vi.fn(),
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
    vi.mocked(walletApi.getMyWallet).mockResolvedValue({ userId: 7, balance: 1245875, status: "ACTIVE" });
    vi.mocked(walletApi.getSummary).mockResolvedValue({
      balance: 1245875,
      status: "ACTIVE",
      inPlay: 125000,
      pendingWithdrawal: 150000,
    });
    vi.mocked(walletApi.getTopUpReceipt).mockResolvedValue({
      txnRef: "TOPUP-21",
      status: "SUCCESS",
      amount: 50000,
      balanceAfter: 1295875,
      walletTransactionId: 5,
      processedAt: "2026-06-22T09:30:00Z",
      failureReason: null,
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
        bankInfo: "RACING FAN · 123456789 · Vietcombank (VCB)",
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
        bankInfo: "RACING FAN · 987654321 · Techcombank (TCB)",
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
      bankInfo: "RACING FAN · 123456789 · Vietcombank (VCB)",
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
      bankInfo: "RACING FAN · 123456789 · Vietcombank (VCB)",
      reviewNote: null,
      reviewedByName: null,
      requestedAt: "2026-06-21T10:00:00Z",
      reviewedAt: "2026-06-21T10:05:00Z",
      paidAt: null,
    });
  });

  it("renders money states, performance, ledger, and the active payout request", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet?topup=success&txnRef=TOPUP-21"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /available balance/i })).toBeInTheDocument();
    const resultDialog = await screen.findByRole("dialog", { name: /top-up result/i });
    expect(within(resultDialog).getByRole("heading", { name: /money added/i })).toBeInTheDocument();
    expect(within(resultDialog).getByText("50,000 VND")).toBeInTheDocument();
    expect(walletApi.getTopUpReceipt).toHaveBeenCalledWith("TOPUP-21");

    expect(screen.getByText("125,000 VND")).toBeInTheDocument();
    expect(screen.getAllByText("150,000 VND")[0]).toBeInTheDocument();

    expect(screen.getByRole("img", { name: /performance: net result \+15,000 vnd/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /performance/i })).toBeInTheDocument();

    const ledger = screen.getByRole("table", { name: /wallet ledger/i });
    expect(within(ledger).getByText("Race payout")).toBeInTheDocument();
    expect(within(ledger).getByText("+25,000 VND")).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /payout queue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel withdrawal 3/i })).toBeInTheDocument();
  });

  it("opens the add-money sheet from the hero", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /^add money$/i }));

    const dialog = await screen.findByRole("dialog", { name: /add money/i });
    expect(within(dialog).getByLabelText(/top-up amount/i)).toBeInTheDocument();
  });

  it("opens the withdraw sheet and submits to the selected saved account", async () => {
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
    // Withdrawable cap = full wallet balance (already net of in-play / holds),
    // not balance − inPlay − pendingWithdrawal.
    expect(within(dialog).getByText(/available: 1,245,875 vnd/i)).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/amount to withdraw/i), { target: { value: "100000" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /withdraw 100,000 vnd/i }));

    await waitFor(() => {
      expect(walletApi.createWithdrawal).toHaveBeenCalledWith(100000, "RACING FAN · 123456789 · Vietcombank (VCB)");
    });
  });

  it("cancels a requested withdrawal from the payout queue", async () => {
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

  it("shows a cancelled request in the payout queue", async () => {
    render(
      <MemoryRouter initialEntries={["/wallet"]}>
        <WalletPage />
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: /available balance/i });
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});
