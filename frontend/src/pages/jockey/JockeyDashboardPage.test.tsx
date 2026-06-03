import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { JockeyDashboardPage } from "./JockeyDashboardPage";

describe("JockeyDashboardPage", () => {
  it("prioritizes championship hero, standing, and timeline", async () => {
    render(
      <MemoryRouter>
        <JockeyDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /current championship/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /select championship/i })).toHaveDisplayValue(
      "Summer Championship 2026",
    );
    expect(screen.getByText(/thunder bolt \/ sunrise stable/i)).toBeInTheDocument();
    expect(screen.getByText(/round 4 of 8/i)).toBeInTheDocument();
    expect(screen.getByText(/jun 6 - belmont park/i)).toBeInTheDocument();
    expect(screen.getByText(/season progress/i)).toBeInTheDocument();
    expect(screen.getByText(/50%/i)).toBeInTheDocument();

    const standing = screen.getByLabelText(/current standing/i);
    expect(within(standing).getByText("#3")).toBeInTheDocument();
    expect(within(standing).getByText("42")).toBeInTheDocument();
    expect(within(standing).getByText(/podium position/i)).toBeInTheDocument();
    expect(within(standing).getByText(/leader: 50 pts/i)).toBeInTheDocument();
    expect(within(standing).getByText(/you: 42 pts/i)).toBeInTheDocument();
    expect(within(standing).getByText(/84% of leader score/i)).toBeInTheDocument();
    expect(within(standing).getByText(/8 pts behind the leader/i)).toBeInTheDocument();

    const nextRace = screen.getByRole("region", { name: /next race/i });
    expect(within(nextRace).getByText(/belmont stakes presented/i)).toBeInTheDocument();
    expect(within(nextRace).getByText(/thunder bolt/i)).toBeInTheDocument();

    const timeline = screen.getByLabelText(/dashboard championship timeline/i);
    expect(within(timeline).getByRole("button", { name: /featured round 4/i })).toBeInTheDocument();
    expect(within(timeline).getAllByText(/featured round/i).length).toBeGreaterThan(0);
    expect(within(timeline).queryByText(/^next race$/i)).not.toBeInTheDocument();

    fireEvent.click(within(timeline).getByRole("button", { name: /round 4/i }));
    const dialog = screen.getByRole("dialog", { name: /race detail/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/round 4 of 8/i)).toBeInTheDocument();
  });
});
