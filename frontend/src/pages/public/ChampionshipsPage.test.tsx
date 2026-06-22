import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchPublicTournaments } from "../../api/racingApi";
import type { TournamentSummary } from "../../types/racing";
import { ChampionshipsPage } from "./ChampionshipsPage";

vi.mock("../../api/racingApi", () => ({ searchPublicTournaments: vi.fn() }));

const liveChampionship: TournamentSummary = {
  id: 2,
  name: "Belmont Summer Championship",
  code: "BEL-26",
  description: "The season's premier summer programme.",
  location: "Belmont Park",
  startDate: "2026-06-10",
  endDate: "2026-07-20",
  status: "ONGOING",
  raceCount: 8,
  participantCount: 32,
  nextRace: { id: 22, name: "Round 3", raceDateTime: "2099-06-15T14:00:00", status: "SCHEDULED" },
};

describe("ChampionshipsPage", () => {
  beforeEach(() => {
    vi.mocked(searchPublicTournaments).mockResolvedValue({
      content: [liveChampionship],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 12,
    });
  });

  it("shows the focused championship and scalable discovery controls without a calendar", async () => {
    render(
      <MemoryRouter>
        <ChampionshipsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("In Focus")).toBeInTheDocument();
    expect(screen.getAllByText(liveChampionship.name).length).toBeGreaterThan(0);
    expect(screen.getByRole("searchbox", { name: /search championships/i })).toBeInTheDocument();
    expect(screen.queryByText(/championship calendar/i)).not.toBeInTheDocument();
  });
});
