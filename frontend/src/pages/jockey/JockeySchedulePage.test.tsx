import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { JockeySchedulePage } from "./JockeySchedulePage";

describe("JockeySchedulePage", () => {
  it("defaults to championship timeline and can open race details", async () => {
    render(
      <MemoryRouter>
        <JockeySchedulePage />
      </MemoryRouter>,
    );

    const selectedTab = screen.getByRole("button", { name: /championship timeline/i });
    expect(selectedTab).toHaveAttribute("aria-pressed", "true");

    const timeline = screen.getByLabelText(/schedule championship timeline/i);
    expect(screen.getByRole("heading", { name: /summer championship 2026/i })).toBeInTheDocument();
    expect(within(timeline).getByText(/round 4/i)).toBeInTheDocument();

    fireEvent.click(within(timeline).getByRole("button", { name: /round 4/i }));
    expect(screen.getByRole("dialog", { name: /race detail/i })).toBeInTheDocument();
    expect(screen.getAllByText(/belmont stakes presented/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /^calendar$/i }));
    expect(screen.getByRole("button", { name: /^calendar$/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText(/month calendar/i)).toBeInTheDocument();
    expect(screen.getByText(/next round/i)).toBeInTheDocument();
  });
});
