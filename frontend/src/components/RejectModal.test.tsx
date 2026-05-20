import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RejectModal } from "./RejectModal";

describe("RejectModal", () => {
  it("renders when isOpen is true and validates input", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <RejectModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isSubmitting={false}
      />
    );

    expect(screen.getByText("Từ chối yêu cầu nâng cấp")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Xác nhận từ chối/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText("Lý do từ chối là bắt buộc.")).toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when inputs are valid", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <RejectModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isSubmitting={false}
      />
    );

    const textarea = screen.getByPlaceholderText(/Tài liệu chứng minh mờ/i);
    fireEvent.change(textarea, { target: { value: "Lý do hợp lệ" } });

    const submitBtn = screen.getByRole("button", { name: /Xác nhận từ chối/i });
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith("Lý do hợp lệ");
  });
});
