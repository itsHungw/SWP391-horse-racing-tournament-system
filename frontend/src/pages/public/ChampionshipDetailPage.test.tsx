import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChampionshipDetailPage } from "./ChampionshipDetailPage";
import { getPublicRaces, getPublicTournament } from "../../api/racingApi";
import { getChampionshipStandings } from "../../api/leaderboardApi";
import type { Race, Tournament } from "../../types/racing";

vi.mock("../../api/racingApi", () => ({
  getPublicTournament: vi.fn(),
  getPublicRaces: vi.fn(),
}));

vi.mock("../../api/leaderboardApi", () => ({
  getChampionshipStandings: vi.fn(),
}));

const tournament: Tournament = {
  id: 5,
  name: "Summer Gold Cup",
  code: "SGC-26",
  description: "The marquee meet of the season.",
  location: "Paddock Park",
  startDate: "2026-07-01",
  endDate: "2026-07-20",
  registrationStartAt: "2026-06-01T00:00:00",
  registrationEndAt: "2026-06-20T00:00:00",
  maxHorses: 24,
  maxHorsesPerOwner: 3,
  status: "ONGOING",
};

const races: Race[] = [
  {
    id: 11,
    tournamentId: 5,
    tournamentName: "Summer Gold Cup",
    name: "Gold Cup Heat One",
    code: "R-11",
    raceDateTime: "2026-07-04T18:30:00",
    distanceMeters: 1600,
    maxParticipants: 10,
    status: "SCHEDULED",
  },
];

const standings = [
  { rank: 1, name: "Thunder Bay", subtitle: "Nguyen Stable", points: 42, wins: 3, podiums: 5, starts: 6 },
  { rank: 2, name: "Silver Reef", subtitle: null, points: 30, wins: 2, podiums: 4, starts: 6 },
  { rank: 3, name: "Night Mirage", subtitle: null, points: 21, wins: 1, podiums: 3, starts: 6 },
  { rank: 4, name: "Iron Sky", subtitle: null, points: 12, wins: 0, podiums: 2, starts: 5 },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/championships/5"]}>
      <Routes>
        <Route path="/championships/:id" element={<ChampionshipDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ChampionshipDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicTournament).mockResolvedValue(tournament);
    vi.mocked(getPublicRaces).mockResolvedValue(races);
    vi.mocked(getChampionshipStandings).mockResolvedValue(standings);
  });

  it("renders the programme: hero, race schedule links, standings and CTA", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: /summer gold cup/i }),
    ).toBeInTheDocument();

    const raceLink = await screen.findByRole("link", { name: /gold cup heat one/i });
    expect(raceLink).toHaveAttribute("href", "/races/11");

    expect(await screen.findByText("Thunder Bay")).toBeInTheDocument();
    expect(screen.getByText("Iron Sky")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /enter the arena/i })).toHaveAttribute(
      "href",
      "/spectator/predictions",
    );
    expect(getChampionshipStandings).toHaveBeenCalledWith(5, "HORSE");
  });

  it("shows the not-found panel when the championship does not exist", async () => {
    vi.mocked(getPublicTournament).mockRejectedValue({ response: { status: 404 } });

    renderPage();

    expect(
      await screen.findByText(/this championship is not on the programme/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to championships/i })).toHaveAttribute(
      "href",
      "/championships",
    );
  });
});
