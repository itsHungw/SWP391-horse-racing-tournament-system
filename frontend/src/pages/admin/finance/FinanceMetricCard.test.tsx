import { render, screen } from "@testing-library/react";
import { WalletCards } from "lucide-react";
import { describe, expect, it } from "vitest";

import { FinanceMetricCard } from "./FinanceMetricCard";

describe("FinanceMetricCard", () => {
  it("keeps a long VND value from competing with the icon for horizontal space", () => {
    render(
      <FinanceMetricCard
        detail="Successful VNPay money-in"
        icon={WalletCards}
        label="Successful top-ups"
        value="+1.000.000 ₫"
      />,
    );

    const card = screen.getByRole("article");
    const value = screen.getByText("+1.000.000 ₫");

    expect(card).toHaveClass("overflow-hidden");
    expect(value).toHaveClass("break-words");
    expect(value.parentElement).toBe(card);
  });
});
