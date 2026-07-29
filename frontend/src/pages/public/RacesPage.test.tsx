import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicRaceHighlight, getPublicRaceLiveStream } from "../../api/raceMediaApi";
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
  getPublicRaceLiveStream: vi.fn(),
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
    vi.mocked(getPublicRaceLiveStream).mockResolvedValue(null);
  });

  it("defaults to the upcoming agenda and keeps calendar as a secondary view", async () => {
    render(
      <MemoryRouter>
        <RacesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Next on the programme")).toBeInTheDocument();
    expect(screen.getAllByText(upcoming.name).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /view race card/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("grid", { name: /race calendar/i })).not.toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Race programme scope" })).toHaveAttribute("data-accent", "gold");
    expect(screen.getByRole("radiogroup", { name: "Race programme layout" })).toHaveAttribute("data-accent", "neutral");

    const filtersSummary = screen.getByText("Filters");
    const filters = filtersSummary.closest("details");
    expect(filters).not.toHaveAttribute("open");
    fireEvent.click(filtersSummary);
    expect(filters).toHaveAttribute("open");
    expect(screen.getByLabelText("Search races")).toBeInTheDocument();

    const contextualActions = screen.getAllByRole("article").find((article) =>
      within(article).queryByRole("link", { name: /make prediction/i }) && within(article).queryByRole("link", { name: /view race card/i }),
    );
    expect(contextualActions).toBeDefined();
    expect(within(contextualActions!).getAllByRole("link").map((link) => link.textContent?.trim())).toEqual(["View race card", "Make prediction"]);

    fireEvent.click(screen.getByRole("radio", { name: "Calendar" }));
    expect(await screen.findByRole("grid", { name: /race calendar/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /predict.*calendar/i })).not.toBeInTheDocument();
  });

  it("shows the latest official highlight first and keeps the next race in context", async () => {
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

    expect(await screen.findByText("Latest official result")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: latestResult.name })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /watch highlight: belmont sprint final highlight/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view full result/i })).toBeInTheDocument();
    const resultPulse = screen.getByText("Latest official result").closest("article");
    expect(resultPulse).toBeDefined();
    expect(within(resultPulse!).queryByRole("link", { name: /^make prediction$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Results" }));
    expect(await screen.findByText("Sat, Jul 25")).toBeInTheDocument();
  });
});
