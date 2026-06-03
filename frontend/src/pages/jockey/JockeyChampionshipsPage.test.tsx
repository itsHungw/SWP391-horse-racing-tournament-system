import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { JockeyChampionshipsPage } from "./JockeyChampionshipsPage";

describe("JockeyChampionshipsPage", () => {
  it("defaults to overview with active championship, contract status, and journey", () => {
    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    const tabs = screen.getByRole("tablist", { name: /championship sections/i });
    expect(within(tabs).getByRole("tab", { name: /^overview$/i })).toHaveAttribute("aria-selected", "true");

    const overview = screen.getByRole("region", { name: /championship overview/i });
    expect(within(overview).getByRole("heading", { name: /summer championship 2026/i })).toBeInTheDocument();
    expect(within(overview).getByText(/committed assignment/i)).toBeInTheDocument();
    expect(within(overview).getByText(/thunder bolt/i)).toBeInTheDocument();
    expect(within(overview).getByText(/sunrise stable/i)).toBeInTheDocument();
    expect(within(overview).getByText(/rank #3/i)).toBeInTheDocument();
    expect(within(overview).getByText(/42 pts/i)).toBeInTheDocument();
    expect(within(overview).getByText(/belmont stakes presented/i)).toBeInTheDocument();

    const journey = within(overview).getByLabelText(/championship journey/i);
    expect(within(journey).getByText(/season tracker/i)).toBeInTheDocument();
    expect(within(journey).getByText(/application approved/i)).toBeInTheDocument();
    expect(within(journey).getByText(/contract committed/i)).toBeInTheDocument();
    expect(within(journey).getByText(/current round/i)).toBeInTheDocument();
    expect(within(journey).getByText(/round 4/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^enroll$/i })).not.toBeInTheDocument();
  });

  it("lets jockey review open championships and submit an application", () => {
    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /open championships/i }));

    const open = screen.getByRole("region", { name: /open championships/i });
    expect(within(open).getByPlaceholderText(/search championship, track, location/i)).toBeInTheDocument();
    expect(within(open).getByRole("button", { name: /closing soon/i })).toBeInTheDocument();
    expect(within(open).getByRole("heading", { name: /autumn cup 2026/i })).toBeInTheDocument();
    expect(within(open).getByText(/jockey pool: 8 \/ 20/i)).toBeInTheDocument();
    expect(within(open).getByText(/applications close in 14 days/i)).toBeInTheDocument();
    expect(within(open).getByText(/jockey role approved/i)).toBeInTheDocument();
    expect(within(open).getByText(/racing passport complete/i)).toBeInTheDocument();

    fireEvent.click(within(open).getByRole("button", { name: /apply for championship autumn cup 2026/i }));

    const drawer = screen.getByRole("dialog", { name: /championship application/i });
    expect(within(drawer).getByText(/eligibility checklist/i)).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: /submit application/i })).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: /submit application/i }));

    expect(within(open).getByText(/pending review/i)).toBeInTheDocument();
    expect(within(open).getByText(/admin will review your racing passport/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^enroll$/i })).not.toBeInTheDocument();
  });

  it("shows championship history with career credibility summary", () => {
    render(
      <MemoryRouter>
        <JockeyChampionshipsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("tab", { name: /championship history/i }));

    const history = screen.getByRole("region", { name: /championship history/i });
    expect(within(history).getByRole("heading", { name: /professional jockey/i })).toBeInTheDocument();
    expect(within(history).getByText(/currently riding/i)).toBeInTheDocument();
    expect(within(history).getByText(/current standing: #3 summer championship/i)).toBeInTheDocument();

    const record = within(history).getByRole("region", { name: /career record/i });
    expect(within(record).getByText(/5 championships/i)).toBeInTheDocument();
    expect(within(record).getByText(/1 championship win/i)).toBeInTheDocument();
    expect(within(history).getByText(/best rank/i)).toBeInTheDocument();
    expect(within(history).getByText(/win rate/i)).toBeInTheDocument();
    expect(within(history).getByText(/top 3 rate/i)).toBeInTheDocument();

    const timeline = within(history).getByRole("list", { name: /career timeline/i });
    expect(within(timeline).getByText("2026")).toBeInTheDocument();
    expect(within(timeline).getByText(/spring cup 2026/i)).toBeInTheDocument();
    expect(within(timeline).getByText(/golden arrow/i)).toBeInTheDocument();
    expect(within(timeline).getByText(/rank #1/i)).toBeInTheDocument();

    fireEvent.click(within(timeline).getByRole("button", { name: /view spring cup 2026 details/i }));

    const dialog = screen.getByRole("dialog", { name: /championship result detail/i });
    expect(within(dialog).getByRole("heading", { name: /spring cup 2026/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/final rank/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/race breakdown/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/round 1/i)).toBeInTheDocument();
  });
});
