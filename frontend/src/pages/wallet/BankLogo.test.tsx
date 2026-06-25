import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BankLogo } from "./BankLogo";

// The logo is aria-hidden + alt="", so it's outside the a11y tree — query the raw node.
const currentImg = () => document.querySelector("img");
const exhaust = () => {
  for (let i = 0; i < 4; i += 1) {
    const img = currentImg();
    if (img) fireEvent.error(img);
  }
};

describe("BankLogo", () => {
  it("probes extensions in priority order as each one fails", () => {
    render(<BankLogo code="VCB" />);
    expect(currentImg()?.getAttribute("src")).toBe("/banks/VCB.svg");

    fireEvent.error(currentImg()!);
    expect(currentImg()?.getAttribute("src")).toBe("/banks/VCB.jpeg");

    fireEvent.error(currentImg()!);
    expect(currentImg()?.getAttribute("src")).toBe("/banks/VCB.jpg");

    fireEvent.error(currentImg()!);
    expect(currentImg()?.getAttribute("src")).toBe("/banks/VCB.png");
  });

  it("falls back to a monogram only after every extension fails", () => {
    render(<BankLogo code="ZZZ" />);
    exhaust();
    expect(currentImg()).toBeNull();
    expect(screen.getByText("ZZZ")).toBeInTheDocument();
  });

  it("restarts the probe when the bank code changes (no stale fallback on reuse)", () => {
    const { rerender } = render(<BankLogo code="VCB" />);
    exhaust(); // drive VCB all the way to the monogram fallback
    expect(currentImg()).toBeNull();

    // Reusing the same instance for another bank must restart at .svg, not inherit
    // VCB's exhausted probe — this is the bug that made existing logos flicker to fallback.
    rerender(<BankLogo code="ACB" />);
    expect(currentImg()?.getAttribute("src")).toBe("/banks/ACB.svg");
  });
});
