import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PaginationControls } from "./PaginationControls";

describe("PaginationControls", () => {
  it("shows range context and moves between pages", () => {
    const onPageChange = vi.fn();

    render(
      <PaginationControls
        currentPage={1}
        onPageChange={onPageChange}
        pageSize={8}
        totalItems={17}
      />,
    );

    expect(screen.getByText(/showing 1-8 of 17/i)).toBeInTheDocument();
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
