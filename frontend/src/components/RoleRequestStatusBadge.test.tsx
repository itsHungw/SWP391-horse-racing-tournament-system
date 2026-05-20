import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleRequestStatusBadge } from "./RoleRequestStatusBadge";

describe("RoleRequestStatusBadge", () => {
  it("renders pending status with correct vietnamese label", () => {
    render(<RoleRequestStatusBadge status="PENDING" />);
    const badge = screen.getByText("Chờ duyệt");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-amber-50");
  });

  it("renders approved status with correct vietnamese label", () => {
    render(<RoleRequestStatusBadge status="APPROVED" />);
    const badge = screen.getByText("Đã duyệt");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-emerald-50");
  });
});
