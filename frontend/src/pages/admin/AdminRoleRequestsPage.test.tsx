import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoleRequest } from "../../types/adminRoleRequest";
import { AdminRoleRequestsPage } from "./AdminRoleRequestsPage";

const mockRequests: RoleRequest[] = [
  {
    id: 1,
    userId: 10,
    fullName: "Minh Quan",
    email: "quan@gmail.com",
    requestedRole: "JOCKEY",
    status: "PENDING",
    reason: "Wants to join race operations",
    createdAt: "2026-05-20T10:00:00",
  },
];

describe("AdminRoleRequestsPage", () => {
  it("renders role request rows and opens detail from the queue", () => {
    const handleView = vi.fn();
    render(
      <AdminRoleRequestsPage
        loading={false}
        onRefresh={vi.fn()}
        onStatusChange={vi.fn()}
        onViewDetail={handleView}
        requests={mockRequests}
        selectedStatus="ALL"
      />,
    );

    expect(screen.getByRole("heading", { name: /role request review queue/i })).toBeInTheDocument();
    expect(screen.getByText("Minh Quan")).toBeInTheDocument();
    expect(screen.getByText("JOCKEY")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view detail/i }));
    expect(handleView).toHaveBeenCalledWith(1);
  });
});
