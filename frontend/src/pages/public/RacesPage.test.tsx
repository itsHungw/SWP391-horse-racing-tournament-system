import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicRaceHighlight } from "../../api/raceMediaApi";
import { searchPublicRaces, searchPublicTournaments } from "../../api/racingApi";
import type { RaceSummary } from "../../types/racing";
import { clearPublicQueryCache } from "../../hooks/usePublicQuery";
import { RacesPage } from "./RacesPage";

vi.mock("../../api/racingApi", () => ({
  searchPublicRaces: vi.fn(),
  searchPublicTournaments: vi.fn(),
}));

vi.mock("../../api/raceMediaApi", () => ({
  getPublicRaceHighlight: vi.fn(),
}));

const upcoming: RaceSummary = {
  id: 22,
  name: "Belmont Sprint",
  code: "BEL-R3",
  tournamentId: 2,
  tournamentName: "Belmont Summer Championship",
  raceDateTime: "2099-06-15T14:00:00",
  location: "Belmont Park",
  distanceMeters: 1200,
  maxParticipants: 14,
  participantCount: 12,
  status: "SCHEDULED",
  predictionOpen: true,
  predictionCloseTime: "2099-06-15T14:00:00",
  resultOfficial: false,
};

describe("RacesPage", () => {
  beforeEach(() => {
    clearPublicQueryCache();
    vi.mocked(searchPublicRaces).mockImplementation(async (params) => ({
      content: params.scope === "RESULTS" ? [] : [upcoming],
      totalElements: params.scope === "RESULTS" ? 0 : 1,
      totalPages: params.scope === "RESULTS" ? 0 : 1,
      number: 0,
      size: 20,
    }));
    vi.mocked(searchPublicTournaments).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 100,
    });
    vi.mocked(getPublicRaceHighlight).mockResolvedValue(null);
  });

  it("defaults to the upcoming agenda and keeps calendar as a secondary view", async () => {
    render(
      <MemoryRouter>
        <RacesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Next To Post")).toBeInTheDocument();
    expect(screen.getAllByText(upcoming.name).length).toBeGreaterThan(0);
    expect(screen.queryByRole("grid", { name: /race calendar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Race programme scope" }).parentElement).not.toHaveClass("overflow-x-auto");
    expect(screen.getByRole("radiogroup", { name: "Race programme layout" }).parentElement).not.toHaveClass("overflow-x-auto");

    fireEvent.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(await screen.findByRole("grid", { name: /race calendar/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /predict.*calendar/i })).not.toBeInTheDocument();
  });

  it("shows the next race first and keeps the latest replay beside it", async () => {
    const latestResult: RaceSummary = {
      ...upcoming,
      id: 24,
      name: "Belmont Sprint Final",
      code: "BEL-R4",
      raceDateTime: "2026-07-25T14:00:00",
      status: "PUBLISHED",
      predictionOpen: false,
      predictionCloseTime: "2026-07-25T14:00:00",
      resultOfficial: true,
      winner: { horseName: "Northern Light", jockeyName: "Maya Chen" },
    };
    vi.mocked(searchPublicRaces).mockImplementation(async (params) => ({
      content: params.scope === "RESULTS" ? [latestResult] : [upcoming],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    }));
    vi.mocked(getPublicRaceHighlight).mockResolvedValue({
      raceId: latestResult.id,
      provider: "YOUTUBE",
      providerVideoId: "M7lc1UVf-VE",
      embedUrl: "https://www.youtube-nocookie.com/embed/M7lc1UVf-VE",
      title: "Belmont Sprint Final highlight",
      thumbnailUrl: "https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg",
    });

    render(
      <MemoryRouter>
        <RacesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Next To Post")).toBeInTheDocument();
    expect(await screen.findByText("Latest replay")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: latestResult.name })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /play replay: belmont sprint final highlight/i })).toBeInTheDocument();
  });
});
