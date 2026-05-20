import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoleDashboardPage } from "./RoleDashboardPage";
import * as api from "../api/adminRoleRequestApi";
import { RoleRequest } from "../types/adminRoleRequest";

vi.mock("../api/adminRoleRequestApi", () => ({
  getRoleRequests: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

const mockRequests: RoleRequest[] = [
  {
    id: 1,
    userId: 10,
    fullName: "Minh Quan",
    email: "quan@gmail.com",
    requestedRole: "JOCKEY",
    status: "PENDING",
    reason: "Đam mê đua ngựa",
    createdAt: "2026-05-20T10:00:00",
  },
];

describe("RoleDashboardPage Integration", () => {
  it("renders Admin role request table flow and handles page toggles", async () => {
    vi.mocked(api.getRoleRequests).mockResolvedValue(mockRequests);

    render(<RoleDashboardPage role="Admin" />);

    // Check loading indicator or items
    await waitFor(() => {
      expect(screen.getByText("Minh Quan")).toBeInTheDocument();
    });

    // View detail click
    const viewBtn = screen.getByRole("button", { name: /Xem chi tiết/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText("Đam mê đua ngựa")).toBeInTheDocument();

    // Back to list click
    const backBtn = screen.getByRole("button", { name: /Quay lại danh sách/i });
    fireEvent.click(backBtn);

    expect(screen.getByText("Minh Quan")).toBeInTheDocument();
  });
});
