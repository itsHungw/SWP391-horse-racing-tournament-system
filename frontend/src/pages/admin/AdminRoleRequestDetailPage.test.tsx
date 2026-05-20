import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRoleRequestDetailPage } from "./AdminRoleRequestDetailPage";
import { RoleRequest } from "../../types/adminRoleRequest";

const mockRequest: RoleRequest = {
  id: 1,
  userId: 10,
  fullName: "Minh Quan",
  email: "quan@gmail.com",
  requestedRole: "JOCKEY",
  status: "PENDING",
  reason: "Tôi thích đua ngựa",
  evidenceUrl: "http://example.com/certificate",
  createdAt: "2026-05-20T10:00:00",
};

describe("AdminRoleRequestDetailPage", () => {
  it("renders detail view and calls actions", () => {
    const handleApprove = vi.fn();
    const handleReject = vi.fn();
    const handleBack = vi.fn();

    render(
      <AdminRoleRequestDetailPage
        request={mockRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        onBack={handleBack}
        processing={false}
      />
    );

    expect(screen.getByText("Tôi thích đua ngựa")).toBeInTheDocument();
    expect(screen.getByText("http://example.com/certificate →")).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: /Phê duyệt/i });
    fireEvent.click(approveBtn);
    expect(handleApprove).toHaveBeenCalled();
  });
});
