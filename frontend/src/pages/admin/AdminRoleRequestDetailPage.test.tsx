import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoleRequest } from "../../types/adminRoleRequest";
import { AdminRoleRequestDetailPage } from "./AdminRoleRequestDetailPage";

const mockRequest: RoleRequest = {
  id: 1,
  userId: 10,
  fullName: "Minh Quan",
  email: "quan@gmail.com",
  requestedRole: "JOCKEY",
  status: "PENDING",
  reason: "I want to join race operations",
  evidenceUrl: "http://example.com/certificate",
  createdAt: "2026-05-20T10:00:00",
  user: {
    id: 10,
    fullName: "Minh Quan",
    email: "quan@gmail.com",
    phone: "0909123456",
    avatarUrl: undefined,
    dateOfBirth: "2000-01-02",
    gender: "MALE",
    address: "Ho Chi Minh City",
    status: "ACTIVE",
    emailVerified: true,
    phoneVerified: false,
    ageVerified: false,
    profileCompleted: true,
    roles: ["SPECTATOR"],
    createdAt: "2026-05-01T09:00:00",
    lastLoginAt: undefined,
  },
};

describe("AdminRoleRequestDetailPage", () => {
  it("renders detail view and calls approval action", () => {
    const handleApprove = vi.fn();
    const handleReject = vi.fn();
    const handleBack = vi.fn();

    render(
      <AdminRoleRequestDetailPage
        onApprove={handleApprove}
        onBack={handleBack}
        onReject={handleReject}
        processing={false}
        request={mockRequest}
      />,
    );

    expect(screen.getByRole("heading", { name: /minh quan/i })).toBeInTheDocument();
    expect(screen.getByText("I want to join race operations")).toBeInTheDocument();
    expect(screen.getByText("0909123456")).toBeInTheDocument();
    expect(screen.getByText("Ho Chi Minh City")).toBeInTheDocument();
    expect(screen.getByText("Email verified")).toBeInTheDocument();
    expect(screen.getByText("Profile complete")).toBeInTheDocument();
    expect(screen.getByText("SPECTATOR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /example.com\/certificate/i })).toHaveAttribute(
      "href",
      "http://example.com/certificate",
    );

    fireEvent.click(screen.getByRole("button", { name: /approve role/i }));
    expect(handleApprove).toHaveBeenCalled();
  });
});
