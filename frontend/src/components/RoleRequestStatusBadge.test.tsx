import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoleRequestStatusBadge } from "./RoleRequestStatusBadge";

describe("RoleRequestStatusBadge", () => {
  it("renders pending status with the expected tone", () => {
    render(<RoleRequestStatusBadge status="PENDING" />);
    const badge = screen.getByText("Pending");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-amber-50");
  });

  it("renders approved status with the expected tone", () => {
    render(<RoleRequestStatusBadge status="APPROVED" />);
    const badge = screen.getByText("Approved");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-emerald-50");
  });
});
