import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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

  it("marks earlier stages complete without turning them into navigation controls", () => {
    render(<WithdrawalWizardStepper status="APPROVED" />);

    const progress = screen.getByRole("navigation", { name: /withdrawal progress/i });
    expect(within(progress).getByLabelText("Review complete")).toBeInTheDocument();
    expect(within(progress).queryByRole("button")).not.toBeInTheDocument();
    expect(within(progress).queryByRole("link")).not.toBeInTheDocument();
  });
});
