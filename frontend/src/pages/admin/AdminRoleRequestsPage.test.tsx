import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRoleRequestsPage } from "./AdminRoleRequestsPage";
import { RoleRequest } from "../../types/adminRoleRequest";

const mockRequests: RoleRequest[] = [
  {
    id: 1,
    userId: 10,
    fullName: "Minh Quan",
    email: "quan@gmail.com",
    requestedRole: "JOCKEY",
    status: "PENDING",
    reason: "Thích đua ngựa",
    createdAt: "2026-05-20T10:00:00",
  },
];

describe("AdminRoleRequestsPage", () => {
  it("renders table with data and filter select options", () => {
    const handleView = vi.fn();
    render(
      <AdminRoleRequestsPage
        requests={mockRequests}
        loading={false}
        selectedStatus="ALL"
        onStatusChange={vi.fn()}
        onViewDetail={handleView}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Minh Quan")).toBeInTheDocument();
    expect(screen.getByText("JOCKEY")).toBeInTheDocument();

    const viewBtn = screen.getByRole("button", { name: /Xem chi tiết/i });
    fireEvent.click(viewBtn);
    expect(handleView).toHaveBeenCalledWith(1);
  });
});
