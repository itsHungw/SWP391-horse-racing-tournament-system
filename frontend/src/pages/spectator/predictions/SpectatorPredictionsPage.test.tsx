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
    getSpectatorStreaks: vi.fn(),
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
    { raceParticipantId: 3, startNumber: 3, laneNumber: 7, horseName: "Golden Arrow", jockeyName: "A. Cruz" },
  ],
};

function renderArena() {
  return render(
    <MemoryRouter initialEntries={["/spectator/predictions"]}>
      <SpectatorPredictionsPage />
    </MemoryRouter>,
  );
}

async function clickFirstButton(name: RegExp) {
  const [button] = await screen.findAllByRole("button", { name });
  expect(button).toBeInTheDocument();
  fireEvent.click(button);
}

describe("SpectatorPredictionsPage cockpit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spectatorPredictionApi.getPointAccount).mockResolvedValue({ userId: 1, pointBalance: 50000 });
    vi.mocked(spectatorPredictionApi.getOpenRaces).mockResolvedValue([openRace]);
    vi.mocked(spectatorPredictionApi.getMyPredictions).mockResolvedValue([]);
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue(options);
    vi.mocked(spectatorPredictionApi.submitPrediction).mockResolvedValue({} as never);
    vi.mocked(spectatorPredictionApi.updatePrediction).mockResolvedValue({} as never);
    vi.mocked(spectatorPredictionApi.getSpectatorStreaks).mockResolvedValue([]);
  });

  it("selects a race, mirrors the winner pick in the right slip, and submits the prediction", async () => {
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    await clickFirstButton(/choose thunder bay/i);

    expect(screen.getByText(/prediction slip/i)).toBeInTheDocument();
    expect(screen.getAllByText(/#1 thunder bay/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ready to confirm/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm prediction/i }));

    expect(await screen.findByText(/prediction confirmed/i)).toBeInTheDocument();
    expect(spectatorPredictionApi.submitPrediction).toHaveBeenCalledWith({
      raceId: 7,
      predictionType: "EXACT_POSITION",
      predictedWinnerId: 1,
      predictedPosition: null,
      wagerAmount: 10000,
    });
  });

  it("keeps confirm disabled until Top 3 has three distinct runners", async () => {
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    fireEvent.click(screen.getByRole("button", { name: /top 3 pick/i }));
    await clickFirstButton(/choose thunder bay/i);

    expect(screen.getByText(/choose second and third/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm prediction/i })).toBeDisabled();

    await clickFirstButton(/choose silver reef/i);
    expect(screen.getByText(/choose third/i)).toBeInTheDocument();

    await clickFirstButton(/choose golden arrow/i);
    expect(screen.getByText(/ready to confirm/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm prediction/i })).not.toBeDisabled();
  });

  it("disables confirmation when a new prediction needs more points", async () => {
    vi.mocked(spectatorPredictionApi.getPointAccount).mockResolvedValue({ userId: 1, pointBalance: 5000 });

    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    await clickFirstButton(/choose thunder bay/i);

    expect(screen.getByText(/you need 5,000 more VND/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm prediction/i })).toBeDisabled();
    expect(spectatorPredictionApi.submitPrediction).not.toHaveBeenCalled();
  });

  it("shows locked state and prevents confirmation when predictionOpen is false", async () => {
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue({
      ...options,
      predictionOpen: false,
    });

    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));

    expect(await screen.findByText(/prediction locked/i)).toBeInTheDocument();
    expect(screen.getByText(/predictions are locked for this race/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm prediction/i })).toBeDisabled();
  });
});
