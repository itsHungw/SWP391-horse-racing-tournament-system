import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminFinanceApi } from "../../../api/adminFinanceApi";
import { AdminFinanceTopUpsPage } from "./AdminFinanceTopUpsPage";
import { AdminFinanceTransactionsPage } from "./AdminFinanceTransactionsPage";

vi.mock("../../../api/adminFinanceApi", () => ({
  adminFinanceApi: {
    listTransactions: vi.fn(),
    getTransaction: vi.fn(),
    exportTransactions: vi.fn(),
    listTopUps: vi.fn(),
    listOrphanTopUpCredits: vi.fn(),
  },
}));

const transaction = {
  id: 91,
  userId: 7,
  userEmail: "spectator@example.com",
  userName: "Spectator One",
  amount: -120_000,
  balanceBefore: 500_000,
  balanceAfter: 380_000,
  transactionType: "BET_PLACED" as const,
  referenceType: "RACE_PREDICTION",
  referenceId: 44,
  description: "Prediction stake",
  createdAt: "2026-07-15T10:30:00",
};

describe("admin finance reconciliation pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminFinanceApi.listTransactions).mockResolvedValue({ content: [transaction], totalElements: 1, totalPages: 1, number: 0, size: 20 });
    vi.mocked(adminFinanceApi.getTransaction).mockResolvedValue(transaction);
    vi.mocked(adminFinanceApi.listTopUps).mockResolvedValue({
      content: [{
        id: 52,
        userId: 7,
        userEmail: "spectator@example.com",
        userName: "Spectator One",
        amount: 500_000,
        status: "SUCCESS",
        vnpayTxnRef: "VNP-52",
        vnpayTransactionNo: "BANK-52",
        vnpayResponseCode: "00",
        createdAt: "2026-07-15T10:00:00",
        paidAt: "2026-07-15T10:05:00",
        walletTransactionId: null,
        walletCreditAmount: null,
        reconciliationStatus: "MISSING_WALLET_CREDIT",
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });
    vi.mocked(adminFinanceApi.listOrphanTopUpCredits).mockResolvedValue({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });

  it("loads URL-backed transaction filters and exposes the immutable balance trace", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/finance/transactions?query=spectator%40example.com&type=BET_PLACED"]}>
        <AdminFinanceTransactionsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /transaction ledger/i })).toBeInTheDocument();
    expect(adminFinanceApi.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
      query: "spectator@example.com",
      type: "BET_PLACED",
    }));
    fireEvent.click(screen.getByRole("button", { name: /view transaction 91/i }));
    const dialog = await screen.findByRole("dialog", { name: /transaction 91/i });
    expect(within(dialog).getByText("Balance before")).toBeInTheDocument();
    expect(within(dialog).getByText("Balance after")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open user/i })).toHaveAttribute("href", "/admin/users/7");
  });

  it("labels a successful VNPay order that has no matching wallet credit", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/finance/topups?reconciliationStatus=MISSING_WALLET_CREDIT"]}>
        <AdminFinanceTopUpsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /top-up reconciliation/i })).toBeInTheDocument();
    expect(screen.getByText("Missing wallet credit")).toBeInTheDocument();
    expect(screen.getByText("VNP-52")).toBeInTheDocument();
    await waitFor(() => expect(adminFinanceApi.listTopUps).toHaveBeenCalledWith(expect.objectContaining({
      reconciliationStatus: "MISSING_WALLET_CREDIT",
    })));
  });

  it("shows orphan credits as the primary result without loading unrelated orders", async () => {
    vi.mocked(adminFinanceApi.listOrphanTopUpCredits).mockResolvedValue({
      content: [{ ...transaction, id: 99, amount: 250_000, transactionType: "TOPUP" }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    render(
      <MemoryRouter initialEntries={["/admin/finance/topups?reconciliationStatus=ORPHAN_WALLET_CREDIT"]}>
        <AdminFinanceTopUpsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /orphan wallet credits/i })).toBeInTheDocument();
    expect(screen.getByText(/transaction #99/i)).toBeInTheDocument();
    expect(adminFinanceApi.listTopUps).not.toHaveBeenCalled();
  });
});
