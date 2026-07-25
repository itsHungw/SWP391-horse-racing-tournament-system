import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { WithdrawalStatus } from "../../../types/wallet";
import { WithdrawalWizardStepper } from "./WithdrawalWizardStepper";

describe("WithdrawalWizardStepper", () => {
  it.each([
    ["REQUESTED", "Review"],
    ["APPROVED", "Transfer & receipt"],
    ["PAID", "Completed"],
    ["REJECTED", "Completed"],
    ["CANCELLED", "Completed"],
  ] as const)("maps %s to the expected current stage", (status, currentLabel) => {
    render(<WithdrawalWizardStepper status={status as WithdrawalStatus} />);

    const progress = screen.getByRole("navigation", { name: /withdrawal progress/i });
    expect(within(progress).getByText(currentLabel).closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(progress.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  });

  it("offers completed Review as an inspection control without changing the current stage", () => {
    const onInspectReview = vi.fn();
    render(
      <WithdrawalWizardStepper
        status="APPROVED"
        inspectingReview={false}
        onInspectReview={onInspectReview}
      />,
    );

    const progress = screen.getByRole("navigation", { name: /withdrawal progress/i });
    expect(within(progress).getByRole("listitem", { current: "step" }))
      .toHaveTextContent("Transfer & receipt");

    const review = within(progress).getByRole("button", { name: /view approved review/i });
    expect(review).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(review);
    expect(onInspectReview).toHaveBeenCalledOnce();
  });

  it("keeps Review static while it is the authoritative current stage", () => {
    render(<WithdrawalWizardStepper status="REQUESTED" />);

    const progress = screen.getByRole("navigation", { name: /withdrawal progress/i });
    expect(within(progress).queryByRole("button", { name: /review/i })).not.toBeInTheDocument();
  });
});
