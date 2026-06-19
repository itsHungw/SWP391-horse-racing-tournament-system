import { describe, expect, it } from "vitest";
import {
  EMPTY_PICKS,
  derivePredictionValidation,
  filterSlipPredictions,
  formatRunnerName,
  getEntryCost,
  getRewardLabel,
  getRaceTimelineStatus,
  pickRunnerForMode,
  type Picks,
} from "./predictionCockpitUtils";
import type { OpenRacePrediction, PredictionOptions, UserPrediction } from "./types/prediction.types";

const futureIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const soonIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const pastIso = new Date(Date.now() - 60 * 1000).toISOString();

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

function race(overrides: Partial<OpenRacePrediction> = {}): OpenRacePrediction {
  return {
    raceId: 7,
    raceName: "Twilight Sprint",
    roundName: "Round 1",
    tournamentId: 5,
    tournamentName: "Summer Gold Cup",
    raceAt: futureIso,
    status: "SCHEDULED",
    totalPredictions: 3,
    predictedByUser: { hasPredicted: false, types: [] },
    ...overrides,
  };
}

function prediction(overrides: Partial<UserPrediction>): UserPrediction {
  return {
    id: 1,
    raceId: 7,
    raceName: "Twilight Sprint",
    championshipName: "Summer Gold Cup",
    predictionType: "WINNER",
    predictedWinnerId: 1,
    predictedWinnerName: "Thunder Bay",
    entryCostPoints: 10,
    rewardPoints: 30,
    status: "PENDING",
    resultCategory: "PENDING",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("prediction cockpit utilities", () => {
  it("derives costs and reward labels from API values", () => {
    expect(getEntryCost(options, "WINNER")).toBe(10);
    expect(getEntryCost(options, "TOP3")).toBe(20);
    expect(getRewardLabel(options, "WINNER")).toBe("+30 reward points");
    expect(getRewardLabel(options, "TOP3")).toBe("+90 exact / +45 any order");
    expect(getEntryCost(undefined, "WINNER")).toBe(0);
    expect(getEntryCost(null, "TOP3")).toBe(0);
    expect(getRewardLabel(undefined, "TOP3")).toBe("-");
    expect(getRewardLabel(null, "WINNER")).toBe("-");
  });

  it("validates winner selections and point balance", () => {
    expect(derivePredictionValidation({ predType: "WINNER", picks: EMPTY_PICKS, options: undefined, pointBalance: 50, isUpdate: false, wagerAmount: 20000 })).toMatchObject({
      canConfirm: false,
      message: "Race options are still loading.",
    });
    expect(derivePredictionValidation({ predType: "WINNER", picks: EMPTY_PICKS, options: null, pointBalance: 50, isUpdate: false, wagerAmount: 20000 })).toMatchObject({
      canConfirm: false,
      message: "Race options are still loading.",
    });
    expect( derivePredictionValidation({ predType: "WINNER", picks: { winnerId: 1, secondId: null, thirdId: null }, options: { ...options, predictionOpen: false }, pointBalance: 50, isUpdate: false, wagerAmount: 20000 })).toMatchObject({
      canConfirm: false,
      message: "Predictions are locked for this race.",
    });
    expect(derivePredictionValidation({ predType: "WINNER", picks: EMPTY_PICKS, options, pointBalance: 50, isUpdate: false, wagerAmount: 20000 })).toMatchObject({
      canConfirm: false,
      message: "Choose a runner for First.",
    });
    expect( derivePredictionValidation({ predType: "WINNER", picks: { ...EMPTY_PICKS, winnerId: 1 }, options, pointBalance: 1000, isUpdate: false, wagerAmount: 20000 })).toMatchObject({
      canConfirm: false,
      message: "You need 19,000 more VND.",
    });
    expect( derivePredictionValidation({ predType: "WINNER", picks: { ...EMPTY_PICKS, winnerId: 1 }, options, pointBalance: 50000, isUpdate: true, wagerAmount: 20000 })).toMatchObject({
      canConfirm: true,
      message: "Ready to confirm.",
    });
  });

  it("validates head-to-head selection", () => {
    expect( derivePredictionValidation({ predType: "HEAD_TO_HEAD", picks: { winnerId: null, secondId: null, thirdId: null }, options, pointBalance: 50000, isUpdate: false, wagerAmount: 20000 }).message).toBe("Choose a horse for the Head-to-Head matchup.");
    expect( derivePredictionValidation({ predType: "HEAD_TO_HEAD", picks: { winnerId: 1, secondId: null, thirdId: null }, options, pointBalance: 50000, isUpdate: false, wagerAmount: 20000 }).canConfirm).toBe(true);
  });

  it("formats runner labels from existing API fields", () => {
    expect(formatRunnerName(options, 1)).toBe("#1 Thunder Bay");
    expect(formatRunnerName(options, null)).toBe("-");
    expect(formatRunnerName(undefined, 1)).toBe("-");
    expect(formatRunnerName(null, 1)).toBe("-");
    expect(formatRunnerName(options, 99)).toBe("-");
    expect(
      formatRunnerName(
        {
          ...options,
          options: [
            { raceParticipantId: 4, startNumber: null, laneNumber: 8, horseName: "Lane Runner", jockeyName: "L. Gate" },
            { raceParticipantId: 5, startNumber: null, laneNumber: null, horseName: "Mystery Runner", jockeyName: "N. Draw" },
          ],
        },
        4,
      ),
    ).toBe("#8 Lane Runner");
    expect(
      formatRunnerName(
        {
          ...options,
          options: [{ raceParticipantId: 5, startNumber: null, laneNumber: null, horseName: "Mystery Runner", jockeyName: "N. Draw" }],
        },
        5,
      ),
    ).toBe("#- Mystery Runner");
  });

  it("derives race timeline status from raceAt and predictionOpen", () => {
    expect(getRaceTimelineStatus(race({ raceAt: futureIso }), true).label).toBe("Open");
    expect(getRaceTimelineStatus(race({ raceAt: soonIso }), true).label).toBe("Closing Soon");
    expect(getRaceTimelineStatus(race({ raceAt: futureIso }), false).label).toBe("Locked");
    expect(getRaceTimelineStatus(race({ raceAt: pastIso }), false).label).toBe("Finished");
    expect(getRaceTimelineStatus(race({ raceAt: futureIso })).label).toBe("Open");
  });

  it("prioritizes selected-race predictions, then tournament predictions, then recent fallback", () => {
    const selected = race({ raceId: 7, tournamentName: "Summer Gold Cup" });
    const items = [
      prediction({ id: 1, raceId: 99, raceName: "Other", championshipName: "Other Cup", createdAt: "2026-06-01T00:00:00Z" }),
      prediction({ id: 2, raceId: 8, raceName: "Stablemate", championshipName: "Summer Gold Cup", createdAt: "2026-06-02T00:00:00Z" }),
      prediction({ id: 3, raceId: 7, raceName: "Twilight Sprint", championshipName: "Summer Gold Cup", createdAt: "2026-06-03T00:00:00Z" }),
    ];
    expect(filterSlipPredictions(items, selected).map((p) => p.id)).toEqual([3]);
    expect(filterSlipPredictions(items.filter((p) => p.raceId !== 7), selected).map((p) => p.id)).toEqual([2]);
    expect(filterSlipPredictions(items.filter((p) => p.championshipName !== "Summer Gold Cup"), selected).map((p) => p.id)).toEqual([1]);
  });

  it("limits same-tournament and recent fallback predictions to three newest items", () => {
    const selected = race({ raceId: 7, tournamentName: "Summer Gold Cup" });
    const items = [
      prediction({ id: 1, raceId: 99, raceName: "Other 1", championshipName: "Other Cup", createdAt: "2026-06-01T00:00:00Z" }),
      prediction({ id: 2, raceId: 98, raceName: "Other 2", championshipName: "Other Cup", createdAt: "2026-06-02T00:00:00Z" }),
      prediction({ id: 3, raceId: 97, raceName: "Other 3", championshipName: "Other Cup", createdAt: "2026-06-03T00:00:00Z" }),
      prediction({ id: 4, raceId: 96, raceName: "Other 4", championshipName: "Other Cup", createdAt: "2026-06-04T00:00:00Z" }),
      prediction({ id: 5, raceId: 8, raceName: "Stablemate 1", championshipName: "Summer Gold Cup", createdAt: "2026-06-05T00:00:00Z" }),
      prediction({ id: 6, raceId: 9, raceName: "Stablemate 2", championshipName: "Summer Gold Cup", createdAt: "2026-06-06T00:00:00Z" }),
      prediction({ id: 7, raceId: 10, raceName: "Stablemate 3", championshipName: "Summer Gold Cup", createdAt: "2026-06-07T00:00:00Z" }),
      prediction({ id: 8, raceId: 11, raceName: "Stablemate 4", championshipName: "Summer Gold Cup", createdAt: "2026-06-08T00:00:00Z" }),
    ];

    expect(filterSlipPredictions(items, selected).map((p) => p.id)).toEqual([8, 7, 6]);
    expect(filterSlipPredictions(items.filter((p) => p.championshipName !== "Summer Gold Cup"), selected).map((p) => p.id)).toEqual([4, 3, 2]);
    expect(filterSlipPredictions(items, null).map((p) => p.id)).toEqual([8, 7, 6]);
  });

  it("matches tournament predictions case-insensitively after trimming names", () => {
    const selected = race({ raceId: 7, tournamentName: " Summer Gold Cup " });
    const items = [
      prediction({ id: 1, raceId: 99, championshipName: "Other Cup", createdAt: "2026-06-01T00:00:00Z" }),
      prediction({ id: 2, raceId: 8, championshipName: "summer gold cup", createdAt: "2026-06-02T00:00:00Z" }),
      prediction({ id: 3, raceId: 9, championshipName: "SUMMER GOLD CUP ", createdAt: "2026-06-03T00:00:00Z" }),
    ];

    expect(filterSlipPredictions(items, selected).map((p) => p.id)).toEqual([3, 2]);
  });
});
