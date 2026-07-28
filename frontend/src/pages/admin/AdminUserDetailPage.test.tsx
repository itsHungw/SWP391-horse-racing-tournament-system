import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAdminUserDetail,
  getAdminUserRoleHistory,
  getAdminUserStatusHistory,
  getAdminUserWalletControl,
  getAdminUserWalletHistory,
} from "../../api/adminUserApi";
import { AdminUserDetailPage } from "./AdminUserDetailPage";

vi.mock("../../api/adminUserApi", () => ({
  enforceAdminUserAccount: vi.fn(),
  enforceAdminUserWallet: vi.fn(),
  getAdminUserDetail: vi.fn(),
  getAdminUserRoleHistory: vi.fn(),
  getAdminUserStatusHistory: vi.fn(),
  getAdminUserWalletControl: vi.fn(),
  getAdminUserWalletHistory: vi.fn(),
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
      createdAt: "2026-07-21T00:00:00",
    });
    vi.mocked(getAdminUserRoleHistory).mockResolvedValue([]);
    vi.mocked(getAdminUserStatusHistory).mockResolvedValue([]);
    vi.mocked(getAdminUserWalletControl).mockResolvedValue({
      userId: 17,
      walletStatus: "ACTIVE",
      canWithdraw: true,
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
});
