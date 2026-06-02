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
    expect(screen.getAllByText(/next race/i).length).toBeGreaterThan(0);
  });

  it("shows a championship racing calendar with today, legend, and race detail drawer", () => {
    render(
      <MemoryRouter>
        <JockeySchedulePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^calendar$/i }));

    const calendar = screen.getByLabelText(/month calendar/i);
    expect(within(calendar).getByText(/summer championship 2026 - 8 rounds - rank #3/i)).toBeInTheDocument();
    expect(within(calendar).getByRole("status", { name: /today june 2/i })).toBeInTheDocument();
    expect(within(calendar).getByLabelText(/calendar status legend/i)).toHaveTextContent(/finished/i);
    expect(within(calendar).getByLabelText(/calendar status legend/i)).toHaveTextContent(/next race/i);
    expect(within(calendar).getByLabelText(/calendar status legend/i)).toHaveTextContent(/upcoming/i);
    expect(within(calendar).getByLabelText(/calendar status legend/i)).toHaveTextContent(/locked/i);

    const nextRace = within(calendar).getByRole("button", { name: /round 4 belmont stakes presented next race/i });
    expect(within(nextRace).getByText(/in 4 days/i)).toBeInTheDocument();

    fireEvent.click(nextRace);

    const detail = screen.getByRole("dialog", { name: /race detail/i });
    expect(within(detail).getByText(/thunder bolt/i)).toBeInTheDocument();
    expect(within(detail).getByText(/belmont park/i)).toBeInTheDocument();
    expect(within(detail).getByText(/next race/i)).toBeInTheDocument();
  });
});
