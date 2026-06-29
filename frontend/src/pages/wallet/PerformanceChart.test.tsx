import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WalletTransaction } from "../../types/wallet";
import { PerformanceChart } from "./PerformanceChart";

function walletResult(id: number, amount: number, createdAt: string): WalletTransaction {
  return {
    id,
    amount,
    type: amount >= 0 ? "BET_PAYOUT" : "BET_PLACED",
    referenceType: "RACE",
    referenceId: id,
    balanceAfter: null,
    description: null,
    createdAt,
  };
}

describe("PerformanceChart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-29T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filters performance to the latest day", () => {
    render(
      <PerformanceChart
        loading={false}
        transactions={[
          walletResult(1, -100_000, "2026-06-27T12:00:00Z"),
          walletResult(2, 25_000, "2026-06-29T08:00:00Z"),
          walletResult(3, -5_000, "2026-06-29T10:00:00Z"),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "1D" }));

    expect(screen.getByRole("button", { name: "1D" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Range").closest("p")).toHaveTextContent("+20,000 VND");
    expect(screen.getByRole("img", { name: /over 1d/i })).toBeInTheDocument();
  });
});
