import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SpectatorPredictionsPage } from "./SpectatorPredictionsPage";
import { spectatorPredictionApi } from "./services/spectatorPredictionApi";
import type { OpenRacePrediction, PredictionOptions } from "./types/prediction.types";

const authState = vi.hoisted(() => ({ accountStatus: "ACTIVE" as "ACTIVE" | "SUSPENDED" }));

vi.mock("../../../hooks/useClientSession", () => ({
  useClientSession: () => ({
    session: { accountStatus: authState.accountStatus },
    isAuthenticated: true,
    isInitializing: false,
    logout: vi.fn(),
  }),
}));

vi.mock("./services/spectatorPredictionApi", () => ({
  spectatorPredictionApi: {
    getOpenRaces: vi.fn(),
    getPredictionOptions: vi.fn(),
    submitPrediction: vi.fn(),
    quotePrediction: vi.fn(),
    getMyPredictions: vi.fn(),
    getPointAccount: vi.fn(),
    getSpectatorStreaks: vi.fn(),
    submitStreakPrediction: vi.fn(),
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
  entryCost: { winner: 10 },
  rewardConfig: { winnerReward: 30 },
  myPredictions: [],
  winnerDistributionVisible: false,
  options: [
    { raceParticipantId: 1, startNumber: 1, laneNumber: 2, horseName: "Thunder Bay", jockeyName: "J. Rider", winOdds: 7.77 },
    { raceParticipantId: 2, startNumber: 2, laneNumber: 5, horseName: "Silver Reef", jockeyName: "M. Swift" },
    { raceParticipantId: 3, startNumber: 3, laneNumber: 7, horseName: "Golden Arrow", jockeyName: "A. Cruz" },
  ],
  positionOddsMatrix: {
    1: { 1: 2.5, 2: 4.1, 3: 8.2 },
    2: { 1: 3.2, 2: 2.8, 3: 5.4 },
    3: { 1: 6.5, 2: 3.7, 3: 2.2 },
  },
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
    authState.accountStatus = "ACTIVE";
    vi.mocked(spectatorPredictionApi.getPointAccount).mockResolvedValue({ userId: 1, pointBalance: 50000 });
    vi.mocked(spectatorPredictionApi.getOpenRaces).mockResolvedValue([openRace]);
    vi.mocked(spectatorPredictionApi.getMyPredictions).mockResolvedValue([]);
    vi.mocked(spectatorPredictionApi.getPredictionOptions).mockResolvedValue(options);
    vi.mocked(spectatorPredictionApi.submitPrediction).mockResolvedValue({} as never);
    vi.mocked(spectatorPredictionApi.quotePrediction).mockResolvedValue({
      accepted: true,
      raceId: 7,
      predictionType: "EXACT_POSITION",
      predictedWinnerId: 1,
      predictedPosition: 1,
      wagerAmount: 10000,
      currentOdds: 2.5,
      oddsAfterStake: 2.1,
      priceImpactPercent: -16,
      estimatedReturn: 21000,
      estimatedProfit: 11000,
      potentialLoss: 10000,
      playerPoolBefore: 0,
      playerPoolAfter: 10000,
      houseFeeAmount: 1500,
      netPlayerPoolAfter: 8500,
      pricingLiquidity: 200000,
      houseFeePercent: 15,
    } as never);
    vi.mocked(spectatorPredictionApi.getSpectatorStreaks).mockResolvedValue([]);
    vi.mocked(spectatorPredictionApi.submitStreakPrediction).mockResolvedValue({} as never);
  });

  it("selects a race, mirrors the winner pick in the right slip, and submits the prediction", async () => {
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    await clickFirstButton(/2\.50/i);

    expect(screen.getByLabelText(/prediction slip/i)).toBeInTheDocument();
    expect(screen.getAllByText(/thunder bay/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ready to confirm/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /confirm prediction/i }));

    expect(await screen.findByText(/prediction confirmed/i)).toBeInTheDocument();
    expect(spectatorPredictionApi.submitPrediction).toHaveBeenCalledWith({
      raceId: 7,
      predictionType: "EXACT_POSITION",
      predictedWinnerId: 1,
      predictedPosition: 1,
      wagerAmount: 10000,
    });
  });

  it("disables confirmation when a new prediction needs more points", async () => {
    vi.mocked(spectatorPredictionApi.getPointAccount).mockResolvedValue({ userId: 1, pointBalance: 5000 });

    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    await clickFirstButton(/2\.50/i);

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

  it("uses fair win odds for winning streak legs instead of exact-position odds", async () => {
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    fireEvent.click(await screen.findByRole("button", { name: /winning streak pick/i }));

    expect(await screen.findByText(/leg odds/i)).toBeInTheDocument();
    expect(screen.getAllByText("x7.77").length).toBeGreaterThan(0);
    expect(screen.queryByText("x2.50")).not.toBeInTheDocument();
  });

  it("shows account review context while preserving read-only arena data", async () => {
    authState.accountStatus = "SUSPENDED";
    renderArena();

    expect(await screen.findByText(/predictions are temporarily paused/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review account status/i })).toHaveAttribute(
      "href",
      "/account-restricted",
    );
    expect(await screen.findByRole("button", { name: /twilight sprint/i })).toBeEnabled();
    expect(screen.getByRole("tab", { name: /my positions/i })).toBeEnabled();
  });

  it("does not select, quote, or submit a standard prediction while suspended", async () => {
    authState.accountStatus = "SUSPENDED";
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /twilight sprint/i }));
    const oddsButton = (await screen.findAllByRole("button", { name: /2\.50/i }))[0];
    expect(oddsButton).toBeDisabled();
    fireEvent.click(oddsButton);

    expect(screen.getByText(/unavailable while suspended/i)).toBeInTheDocument();
    expect(spectatorPredictionApi.quotePrediction).not.toHaveBeenCalled();
    expect(spectatorPredictionApi.submitPrediction).not.toHaveBeenCalled();
  });

  it("keeps streak history available without allowing suspended streak mutations", async () => {
    authState.accountStatus = "SUSPENDED";
    renderArena();

    fireEvent.click(await screen.findByRole("button", { name: /winning streak pick/i }));
    expect(screen.getByRole("button", { name: /my streaks/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /unavailable while suspended/i })).toBeDisabled();
    expect(spectatorPredictionApi.submitStreakPrediction).not.toHaveBeenCalled();
  });
});
