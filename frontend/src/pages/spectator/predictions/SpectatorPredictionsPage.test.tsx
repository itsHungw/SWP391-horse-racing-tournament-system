import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SpectatorPredictionsPage } from "./SpectatorPredictionsPage";
import { spectatorPredictionApi } from "./services/spectatorPredictionApi";
import type { OpenRacePrediction, PredictionOptions } from "./types/prediction.types";

vi.mock("./services/spectatorPredictionApi", () => ({
  spectatorPredictionApi: {
    getOpenRaces: vi.fn(),
    getPredictionOptions: vi.fn(),
    submitPrediction: vi.fn(),
    updatePrediction: vi.fn(),
    getMyPredictions: vi.fn(),
    getPointAccount: vi.fn(),
  },
}));

const futureIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

const openRace: OpenRacePrediction = {
  raceId: 7,
  raceName: "Twilight Sprint",
  roundName: "Round 1",
  tournamentId: 5,
  tournamentName: "Summer Gold Cup",
  raceAt: futureIso,
  status: "SCHEDULED",
  totalPredictions: 3,
  predictedByUser: { hasPredicted: false, types: [] },
};

const options: PredictionOptions = {
  raceId: 7,
  raceName: "Twilight Sprint",
  raceStatus: "SCHEDULED",
  predictionOpen: true,
  entryCost: { winner: 10, top3: 20 },
  rewardConfig: { winnerReward: 30, top3ExactReward: 90, top3AnyOrderReward: 45 },
  myPredictions: [],
  winnerDistributionVisible: false,
  top3DistributionVisible: false,
  options: [
    { raceParticipantId: 1, startNumber: 1, laneNumber: 2, horseName: "Thunder Bay", jockeyName: "J. Rider" },
    { raceParticipantId: 2, startNumber: 2, laneNumber: 5, horseName: "Silver Reef", jockeyName: "M. Swift" },
  ],
};

function renderArena() {
  return render(
    <MemoryRouter initialEntries={["/spectator/predictions"]}>
      <SpectatorPredictionsPage />
    </MemoryRouter>,
  );
}

describe("SpectatorPredictionsPage wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spectatorPredictionApi.getPointAccount).mockResolvedValue({ userId: 1, pointBalance: 50 });
    vi.mocked(spectatorPredictionApi.getOpenRaces).mockResolvedValue([openRace]);
    vi.mocked(spectatorPredictionApi.getMyPredictions).mockResolvedValue([]);
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue(options);
    vi.mocked(spectatorPredictionApi.submitPrediction).mockResolvedValue({} as never);
  });

  it("walks pick-race → pick-horse → ticket and submits the prediction", async () => {
    renderArena();

    // Step 1: the open race card
    const raceCard = await screen.findByRole("button", { name: /twilight sprint/i });
    fireEvent.click(raceCard);

    // Step 2: tactile runner cards
    const runner = await screen.findByRole("option", { name: /thunder bay/i });
    fireEvent.click(runner);

    fireEvent.click(
      screen.getAllByRole("button", { name: /review ticket/i }).find((button) => !button.hasAttribute("disabled"))!,
    );

    // Step 3: the ticket shows the pick and confirms
    expect(await screen.findByText(/prediction ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/#1 thunder bay/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm ticket/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/your ticket is in/i);
    expect(spectatorPredictionApi.submitPrediction).toHaveBeenCalledWith({
      raceId: 7,
      predictionType: "WINNER",
      predictedWinnerId: 1,
      predictedSecondId: null,
      predictedThirdId: null,
    });
  });

  it("requires all three distinct horses for a Top 3 ticket", async () => {
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));

    fireEvent.click(await screen.findByRole("button", { name: /top 3 pick/i }));
    fireEvent.click(await screen.findByRole("option", { name: /thunder bay/i }));

    fireEvent.click(
      screen.getAllByRole("button", { name: /review ticket/i }).find((button) => !button.hasAttribute("disabled"))!,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/all three places/i);
    expect(spectatorPredictionApi.submitPrediction).not.toHaveBeenCalled();
  });
});
