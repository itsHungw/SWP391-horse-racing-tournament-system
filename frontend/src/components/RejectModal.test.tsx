import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RejectModal } from "./RejectModal";

describe("RejectModal", () => {
  it("renders when open and validates required reason", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <RejectModal
        isOpen={true}
        isSubmitting={false}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />,
    );

    expect(screen.getByRole("dialog", { name: /reject role request/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm rejection/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("A rejection reason is required.");
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when the reason is valid", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <RejectModal
        isOpen={true}
        isSubmitting={false}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />,
    );

    fireEvent.change(screen.getByLabelText(/rejection reason/i), {
      target: { value: "Evidence document is missing." },
    });

    fireEvent.click(screen.getByRole("button", { name: /confirm rejection/i }));

    expect(handleConfirm).toHaveBeenCalledWith("Evidence document is missing.");
  });
});
