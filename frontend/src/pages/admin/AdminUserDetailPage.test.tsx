import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  creditAdminUserWallet,
  getAdminUserDetail,
  getAdminUserRoleHistory,
  getAdminUserStatusHistory,
  getAdminUserWalletControl,
  getAdminUserWalletHistory,
  getAdminUserWalletTransactions,
} from "../../api/adminUserApi";
import { AdminUserDetailPage } from "./AdminUserDetailPage";

vi.mock("../../api/adminUserApi", () => ({
  creditAdminUserWallet: vi.fn(),
  enforceAdminUserAccount: vi.fn(),
  enforceAdminUserWallet: vi.fn(),
  getAdminUserDetail: vi.fn(),
  getAdminUserRoleHistory: vi.fn(),
  getAdminUserStatusHistory: vi.fn(),
  getAdminUserWalletControl: vi.fn(),
  getAdminUserWalletHistory: vi.fn(),
  getAdminUserWalletTransactions: vi.fn(),
  updateAdminUserProfile: vi.fn(),
  updateAdminUserRoles: vi.fn(),
}));

vi.mock("../../hooks/useClientSession", () => ({
  useClientSession: () => ({
    logout: vi.fn(),
    session: { email: "admin@example.com", roles: ["ADMIN"] },
  }),
}));

describe("AdminUserDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminUserDetail).mockResolvedValue({
      id: 17,
      fullName: "Organizer User",
      email: "organizer@example.com",
      phone: "",
      status: "ACTIVE",
      emailVerified: true,
      roles: ["SPECTATOR", "ORGANIZER"],
      lastLoginAt: "2026-07-29T18:30:00",
      createdAt: "2026-07-21T00:00:00",
    });
    vi.mocked(getAdminUserRoleHistory).mockResolvedValue([]);
    vi.mocked(getAdminUserStatusHistory).mockResolvedValue([]);
    vi.mocked(getAdminUserWalletControl).mockResolvedValue({
      userId: 17,
      walletStatus: "ACTIVE",
      canWithdraw: true,
      balance: 350000,
    });
    vi.mocked(getAdminUserWalletTransactions).mockResolvedValue({
      content: [
        {
          id: 2,
          amount: 250000,
          type: "ADMIN_ADJUSTMENT",
          referenceType: "ADMIN_BALANCE_CREDIT",
          referenceId: null,
          balanceBefore: 100000,
          balanceAfter: 350000,
          description: "Wallet Admin <wallet-admin@example.com>: VNPay callback failed",
          createdAt: "2026-07-30T10:00:00",
        },
        {
          id: 1,
          amount: 100000,
          type: "TOPUP",
          referenceType: "TOPUP_ORDER",
          referenceId: 88,
          balanceBefore: 0,
          balanceAfter: 100000,
          description: "Confirmed VNPay top-up",
          createdAt: "2026-07-29T10:00:00",
        },
      ],
      totalPages: 1,
      totalElements: 2,
      size: 20,
      number: 0,
    });
    vi.mocked(creditAdminUserWallet).mockResolvedValue({
      amount: 250000,
      balanceBefore: 350000,
      balanceAfter: 600000,
    });
    vi.mocked(getAdminUserWalletHistory).mockResolvedValue([]);
  });

  it("shows the organizer role as selected and system-managed", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/users/17"]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Withdrawals available")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Role Management" }));

    const organizerCheckbox = screen.getByRole("checkbox", { name: /organizer/i });
    expect(organizerCheckbox).toBeChecked();
    expect(organizerCheckbox).toBeDisabled();
    expect(screen.getByText(/managed through organization approval/i)).toBeInTheDocument();
  });

  it("shows wallet visibility, credits balance, and renders the complete ledger", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/users/17"]}>
        <Routes>
          <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/350,000/)).toBeInTheDocument();
    expect(screen.getByText(/Last login/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Balance" }));
    fireEvent.change(screen.getByLabelText("Amount (VND)"), { target: { value: "250000" } });
    fireEvent.change(screen.getByLabelText("Internal reason"), {
      target: { value: "VNPay callback failed" },
    });

    expect(screen.getByText(/600,000/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add 250,000 VND" }));

    await waitFor(() => {
      expect(creditAdminUserWallet).toHaveBeenCalledWith(17, 250000, "VNPay callback failed");
    });

    fireEvent.click(screen.getByRole("button", { name: "Balance History" }));
    expect(await screen.findByText("Admin adjustment")).toBeInTheDocument();
    expect(screen.getByText("Top up")).toBeInTheDocument();
    expect(screen.getByText(/Wallet Admin <wallet-admin@example.com>/)).toBeInTheDocument();
    expect(screen.getByText("TOPUP_ORDER #88")).toBeInTheDocument();
  });
});
