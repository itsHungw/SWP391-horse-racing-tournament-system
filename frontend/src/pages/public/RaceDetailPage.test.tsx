import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RaceDetailPage } from "./RaceDetailPage";
import { getPublicRace, getPublicRaceResults } from "../../api/racingApi";
import { spectatorPredictionApi } from "../spectator/predictions/services/spectatorPredictionApi";
import type { Race } from "../../types/racing";
import type { PredictionOptions } from "../spectator/predictions/types/prediction.types";

vi.mock("../../api/racingApi", () => ({
  getPublicRace: vi.fn(),
  getPublicRaceResults: vi.fn(),
}));

vi.mock("../spectator/predictions/services/spectatorPredictionApi", () => ({
  spectatorPredictionApi: {
    getPredictionOptions: vi.fn(),
  },
}));

const futureIso = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();

const race: Race = {
  id: 7,
  tournamentId: 5,
  tournamentName: "Summer Gold Cup",
  name: "Twilight Sprint",
  code: "R-7",
  raceDateTime: futureIso,
  distanceMeters: 1200,
  maxParticipants: 8,
  status: "SCHEDULED",
};

const options: PredictionOptions = {
  raceId: 7,
  raceName: "Twilight Sprint",
  raceStatus: "SCHEDULED",
  predictionOpen: true,
  entryCost: { winner: 10 },
  rewardConfig: { winnerReward: 30 },
  myPredictions: [],
  winnerDistributionVisible: false,
  options: [
    { raceParticipantId: 1, startNumber: 1, laneNumber: 2, horseName: "Thunder Bay", jockeyName: "J. Rider" },
    { raceParticipantId: 2, startNumber: 2, laneNumber: 5, horseName: "Silver Reef", jockeyName: "M. Swift" },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/races/7"]}>
      <Routes>
        <Route path="/races/:id" element={<RaceDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RaceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicRace).mockResolvedValue(race);
    vi.mocked(getPublicRaceResults).mockResolvedValue({ raceId: 7, official: false, entries: [] });
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue(options);
  });

  it("renders the race card with field, countdown and prediction CTA", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: /twilight sprint/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /summer gold cup/i })).toHaveAttribute(
      "href",
      "/championships/5",
    );

    expect(await screen.findByText("Thunder Bay")).toBeInTheDocument();
    expect(screen.getByText("Silver Reef")).toBeInTheDocument();
    expect(screen.getByText("J. Rider")).toBeInTheDocument();

    expect(screen.getByRole("timer", { name: /time to post/i })).toBeInTheDocument();

    expect(await screen.findByRole("link", { name: /enter the arena/i })).toHaveAttribute(
      "href",
      "/spectator/predictions?raceId=7",
    );
  });

  it("shows the results band instead of a CTA once the race has run", async () => {
    vi.mocked(getPublicRace).mockResolvedValue({
      ...race,
      raceDateTime: "2026-05-01T18:30:00",
      status: "PUBLISHED",
    });
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue({
      ...options,
      predictionOpen: false,
      raceStatus: "PUBLISHED",
    });
    vi.mocked(getPublicRaceResults).mockResolvedValue({
      raceId: 7,
      official: true,
      publishedAt: "2026-05-01T20:00:00",
      entries: [
        {
          position: 1,
          horseName: "Thunder Bay",
          jockeyName: "J. Rider",
          finishTimeSeconds: 72.341,
          penaltySeconds: 0,
          points: 25,
          resultStatus: "FINISHED",
        },
      ],
    });

    renderPage();

    expect(
      await screen.findByText(/results feed the championship standings/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /championship standings/i })).toHaveAttribute(
      "href",
      "/championships/5",
    );
    expect(screen.queryByRole("link", { name: /enter the arena/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /official result/i })).toBeInTheDocument();
    expect(screen.getByText("72.341s")).toBeInTheDocument();
  });

  it("does not expose a submitted finish order before the result is official", async () => {
    vi.mocked(getPublicRace).mockResolvedValue({
      ...race,
      raceDateTime: "2026-05-01T18:30:00",
      status: "RESULT_SUBMITTED",
    });
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue({
      ...options,
      predictionOpen: false,
      raceStatus: "RESULT_SUBMITTED",
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: /awaiting official result/i })).toBeInTheDocument();
    expect(screen.getByText(/results are being reviewed/i)).toBeInTheDocument();
    expect(screen.queryByText("72.341s")).not.toBeInTheDocument();
  });
});
