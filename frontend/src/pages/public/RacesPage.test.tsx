import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchPublicRaces, searchPublicTournaments } from "../../api/racingApi";
import type { RaceSummary } from "../../types/racing";
import { RacesPage } from "./RacesPage";

vi.mock("../../api/racingApi", () => ({
  searchPublicRaces: vi.fn(),
  searchPublicTournaments: vi.fn(),
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

    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    expect(await screen.findByRole("grid", { name: /race calendar/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /predict.*calendar/i })).not.toBeInTheDocument();
  });
});
