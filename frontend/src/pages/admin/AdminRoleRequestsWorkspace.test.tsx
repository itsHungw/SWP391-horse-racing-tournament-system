import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import * as api from "../../api/adminRoleRequestApi";
import { RoleRequest } from "../../types/adminRoleRequest";
import { AdminRoleRequestsWorkspace } from "./AdminRoleRequestsWorkspace";

vi.mock("../../api/adminRoleRequestApi", () => ({
  approveRequest: vi.fn(),
  getRoleRequests: vi.fn(),
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
    reason: "I want to join race operations",
    createdAt: "2026-05-20T10:00:00",
  },
];

describe("AdminRoleRequestsWorkspace", () => {
  it("renders the queue and opens request details", async () => {
    vi.mocked(api.getRoleRequests).mockResolvedValue(mockRequests);

    render(
      <MemoryRouter>
        <AdminRoleRequestsWorkspace />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Minh Quan")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /view detail/i }));

    expect(screen.getByRole("heading", { name: /minh quan/i })).toBeInTheDocument();
    expect(screen.getByText("I want to join race operations")).toBeInTheDocument();
  });
});
