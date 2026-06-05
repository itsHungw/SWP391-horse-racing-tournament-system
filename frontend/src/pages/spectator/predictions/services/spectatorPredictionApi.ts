import { httpClient } from "../../../../api/httpClient";
import { 
  OpenRacePrediction, 
  PredictionOptions, 
  UserPrediction, 
  PointAccount 
} from "../types/prediction.types";

// ============================================================================
// MOCK DATA IMPLEMENTATION FOR STANDALONE FRONTEND TESTING
// ============================================================================

const INITIAL_OPEN_RACES: OpenRacePrediction[] = [
  {
    raceId: 101,
    raceName: "Summer Championship Final",
    roundName: "Championship",
    tournamentId: 1,
    tournamentName: "Equine Pro Summer Cup 2026",
    raceAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    status: "SCHEDULED",
    totalPredictions: 45,
    predictedByUser: {
      hasPredicted: false,
      types: [],
    },
  },
  {
    raceId: 102,
    raceName: "Triple Crown Classic",
    roundName: "Finals",
    tournamentId: 2,
    tournamentName: "Belmont Stakes 2026",
    raceAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
    status: "SCHEDULED",
    totalPredictions: 112,
    predictedByUser: {
      hasPredicted: false,
      types: [],
    },
  },
  {
    raceId: 103,
    raceName: "Starlight Sprint",
    roundName: "Semifinals",
    tournamentId: 1,
    tournamentName: "Midsummer Derby 2026",
    raceAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    status: "SCHEDULED",
    totalPredictions: 18,
    predictedByUser: {
      hasPredicted: false,
      types: [],
    },
  }
];

const INITIAL_OPTIONS_MAP: Record<number, PredictionOptions> = {
  101: {
    raceId: 101,
    raceName: "Summer Championship Final",
    raceStatus: "SCHEDULED",
    predictionOpen: true,
    entryCost: { winner: 5, top3: 10 },
    myPredictions: [],
    winnerDistributionVisible: false,
    top3DistributionVisible: false,
    options: [
      { raceParticipantId: 301, startNumber: 1, laneNumber: 1, horseName: "Thunder Bolt", jockeyName: "Nguyen Van A", communityWinnerRate: 0.45, communityTop3Rate: 0.60 },
      { raceParticipantId: 302, startNumber: 2, laneNumber: 2, horseName: "Starlight Dancer", jockeyName: "Tran Van B", communityWinnerRate: 0.30, communityTop3Rate: 0.50 },
      { raceParticipantId: 303, startNumber: 3, laneNumber: 3, horseName: "Golden Gallop", jockeyName: "Le Hoàng C", communityWinnerRate: 0.15, communityTop3Rate: 0.40 },
      { raceParticipantId: 304, startNumber: 4, laneNumber: 4, horseName: "Shadow Runner", jockeyName: "Pham Minh D", communityWinnerRate: 0.10, communityTop3Rate: 0.20 },
    ],
  },
  102: {
    raceId: 102,
    raceName: "Triple Crown Classic",
    raceStatus: "SCHEDULED",
    predictionOpen: true,
    entryCost: { winner: 5, top3: 10 },
    myPredictions: [],
    winnerDistributionVisible: false,
    top3DistributionVisible: false,
    options: [
      { raceParticipantId: 401, startNumber: 1, laneNumber: 1, horseName: "Secretariat Junior", jockeyName: "John Smith", communityWinnerRate: 0.55, communityTop3Rate: 0.80 },
      { raceParticipantId: 402, startNumber: 2, laneNumber: 2, horseName: "Midnight Eclipse", jockeyName: "Emma Watson", communityWinnerRate: 0.25, communityTop3Rate: 0.45 },
      { raceParticipantId: 403, startNumber: 3, laneNumber: 3, horseName: "Wind Whisperer", jockeyName: "David Beckham", communityWinnerRate: 0.20, communityTop3Rate: 0.35 },
    ],
  },
  103: {
    raceId: 103,
    raceName: "Starlight Sprint",
    raceStatus: "SCHEDULED",
    predictionOpen: true,
    entryCost: { winner: 5, top3: 10 },
    myPredictions: [],
    winnerDistributionVisible: false,
    top3DistributionVisible: false,
    options: [
      { raceParticipantId: 501, startNumber: 1, laneNumber: 1, horseName: "Silver Streak", jockeyName: "Michael Jordan", communityWinnerRate: 0.40, communityTop3Rate: 0.50 },
      { raceParticipantId: 502, startNumber: 2, laneNumber: 2, horseName: "Pegasus Flight", jockeyName: "Kobe Bryant", communityWinnerRate: 0.40, communityTop3Rate: 0.50 },
      { raceParticipantId: 503, startNumber: 3, laneNumber: 3, horseName: "Lightning Dash", jockeyName: "LeBron James", communityWinnerRate: 0.20, communityTop3Rate: 0.30 },
    ],
  },
};

const INITIAL_MY_PREDICTIONS: UserPrediction[] = [
  {
    id: 5001,
    raceId: 99,
    raceName: "Spring Cup Paddock Sprint",
    roundName: "Spring Cup Qualifiers",
    predictionType: "WINNER",
    predictedWinnerId: 9901,
    predictedWinnerName: "Swift Wind (Jockey: Peter Parker)",
    entryCostPoints: 5,
    rewardPoints: 10,
    status: "CORRECT",
    resultCategory: "WINNER_CORRECT",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5003,
    raceId: 97,
    raceName: "Summer Solstice Derby",
    roundName: "Derby Finals",
    predictionType: "TOP3",
    predictedWinnerId: 9701,
    predictedWinnerName: "Thunder Bolt (Jockey: Nguyen Van A)",
    predictedSecondId: 9702,
    predictedSecondName: "Starlight Dancer (Jockey: Tran Van B)",
    predictedThirdId: 9703,
    predictedThirdName: "Golden Gallop (Jockey: Le Hoang C)",
    entryCostPoints: 10,
    rewardPoints: 30,
    status: "CORRECT",
    resultCategory: "TOP3_EXACT",
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5004,
    raceId: 96,
    raceName: "Autumn Breeze Trophy",
    roundName: "Trophy Semifinals",
    predictionType: "TOP3",
    predictedWinnerId: 9601,
    predictedWinnerName: "Shadow Runner (Jockey: Pham Minh D)",
    predictedSecondId: 9602,
    predictedSecondName: "Secretariat Junior (Jockey: John Smith)",
    predictedThirdId: 9603,
    predictedThirdName: "Midnight Eclipse (Jockey: Emma Watson)",
    entryCostPoints: 10,
    rewardPoints: 15,
    status: "CORRECT",
    resultCategory: "TOP3_ANY_ORDER",
    createdAt: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5002,
    raceId: 98,
    raceName: "Winter Snow Gallop",
    roundName: "Winter Derby",
    predictionType: "TOP3",
    predictedWinnerId: 9801,
    predictedWinnerName: "Blizzard (Jockey: Bruce Wayne)",
    predictedSecondId: 9802,
    predictedSecondName: "Snowflake (Jockey: Clark Kent)",
    predictedThirdId: 9803,
    predictedThirdName: "Avalanche (Jockey: Diana Prince)",
    entryCostPoints: 10,
    rewardPoints: 0,
    status: "INCORRECT",
    resultCategory: "INCORRECT",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

// Initialize localStorage collections atomically when version changes
const MOCK_VERSION_KEY = "mock_v4";
if (!localStorage.getItem(MOCK_VERSION_KEY)) {
  localStorage.setItem("mock_points", "120");
  localStorage.setItem("mock_open_races", JSON.stringify(INITIAL_OPEN_RACES));
  localStorage.setItem("mock_options_map", JSON.stringify(INITIAL_OPTIONS_MAP));
  localStorage.setItem("mock_my_predictions", JSON.stringify(INITIAL_MY_PREDICTIONS));
  localStorage.setItem(MOCK_VERSION_KEY, "true");
}

function getMockPoints(): number {
  return Number(localStorage.getItem("mock_points") || "120");
}
function setMockPoints(pts: number) {
  localStorage.setItem("mock_points", pts.toString());
}
function getMockOpenRaces(): OpenRacePrediction[] {
  return JSON.parse(localStorage.getItem("mock_open_races") || "[]");
}
function setMockOpenRaces(races: OpenRacePrediction[]) {
  localStorage.setItem("mock_open_races", JSON.stringify(races));
}
function getMockOptionsMap(): Record<number, PredictionOptions> {
  return JSON.parse(localStorage.getItem("mock_options_map") || "{}");
}
function setMockOptionsMap(map: Record<number, PredictionOptions>) {
  localStorage.setItem("mock_options_map", JSON.stringify(map));
}
function getMockMyPredictions(): UserPrediction[] {
  return JSON.parse(localStorage.getItem("mock_my_predictions") || "[]");
}
function setMockMyPredictions(preds: UserPrediction[]) {
  localStorage.setItem("mock_my_predictions", JSON.stringify(preds));
}

export const spectatorPredictionApi = {
  getOpenRaces: () => 
    Promise.resolve(getMockOpenRaces()),

  getPredictionOptions: (raceId: number) => {
    const map = getMockOptionsMap();
    const options = map[raceId];
    if (!options) return Promise.reject(new Error("Race details not found"));

    // Sync predictions state
    const myPreds = getMockMyPredictions().filter(p => p.raceId === raceId);
    options.myPredictions = myPreds;
    options.winnerDistributionVisible = myPreds.some(p => p.predictionType === "WINNER");
    options.top3DistributionVisible = myPreds.some(p => p.predictionType === "TOP3");

    return Promise.resolve(options);
  },

  submitPrediction: (payload: {
    raceId: number;
    predictionType: "WINNER" | "TOP3";
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
  }) => {
    const points = getMockPoints();
    const map = getMockOptionsMap();
    const raceOptions = map[payload.raceId];
    if (!raceOptions) return Promise.reject(new Error("Race not found"));

    const cost = payload.predictionType === "WINNER" ? raceOptions.entryCost.winner : raceOptions.entryCost.top3;
    if (points < cost) return Promise.reject(new Error("Insufficient Point Balance"));

    // Deduct points
    setMockPoints(points - cost);

    const getParticipantName = (id: number) => {
      const opt = raceOptions.options.find(o => o.raceParticipantId === id);
      return opt ? `#${opt.startNumber} ${opt.horseName} (${opt.jockeyName})` : `Horse #${id}`;
    };

    const newPred: UserPrediction = {
      id: Date.now(),
      raceId: payload.raceId,
      raceName: raceOptions.raceName,
      roundName: "Main Event",
      predictionType: payload.predictionType,
      predictedWinnerId: payload.predictedWinnerId,
      predictedWinnerName: getParticipantName(payload.predictedWinnerId),
      predictedSecondId: payload.predictedSecondId || undefined,
      predictedSecondName: payload.predictedSecondId ? getParticipantName(payload.predictedSecondId) : undefined,
      predictedThirdId: payload.predictedThirdId || undefined,
      predictedThirdName: payload.predictedThirdId ? getParticipantName(payload.predictedThirdId) : undefined,
      entryCostPoints: cost,
      rewardPoints: 0,
      status: "PENDING",
      resultCategory: "PENDING",
      createdAt: new Date().toISOString(),
    };

    const myPreds = getMockMyPredictions();
    myPreds.unshift(newPred);
    setMockMyPredictions(myPreds);

    // Mark as predicted in open races
    const openRaces = getMockOpenRaces();
    const raceIndex = openRaces.findIndex(r => r.raceId === payload.raceId);
    if (raceIndex !== -1) {
      const race = openRaces[raceIndex];
      if (!race.predictedByUser.types.includes(payload.predictionType)) {
        race.predictedByUser.types.push(payload.predictionType);
      }
      race.predictedByUser.hasPredicted = true;
      race.totalPredictions += 1;
      setMockOpenRaces(openRaces);
    }

    return Promise.resolve(newPred);
  },

  updatePrediction: (predictionId: number, payload: {
    raceId: number;
    predictionType: "WINNER" | "TOP3";
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
  }) => {
    const map = getMockOptionsMap();
    const raceOptions = map[payload.raceId];
    if (!raceOptions) return Promise.reject(new Error("Race not found"));

    const getParticipantName = (id: number) => {
      const opt = raceOptions.options.find(o => o.raceParticipantId === id);
      return opt ? `#${opt.startNumber} ${opt.horseName} (${opt.jockeyName})` : `Horse #${id}`;
    };

    const myPreds = getMockMyPredictions();
    const predIndex = myPreds.findIndex(p => p.id === predictionId);
    if (predIndex === -1) return Promise.reject(new Error("Prediction not found"));

    const existing = myPreds[predIndex];
    existing.predictedWinnerId = payload.predictedWinnerId;
    existing.predictedWinnerName = getParticipantName(payload.predictedWinnerId);
    existing.predictedSecondId = payload.predictedSecondId || undefined;
    existing.predictedSecondName = payload.predictedSecondId ? getParticipantName(payload.predictedSecondId) : undefined;
    existing.predictedThirdId = payload.predictedThirdId || undefined;
    existing.predictedThirdName = payload.predictedThirdId ? getParticipantName(payload.predictedThirdId) : undefined;

    setMockMyPredictions(myPreds);
    return Promise.resolve(existing);
  },

  getMyPredictions: () => 
    Promise.resolve(getMockMyPredictions()),

  getPointAccount: () => 
    Promise.resolve({
      userId: 12,
      pointBalance: getMockPoints(),
    }),
};

// ============================================================================
// REAL BACKEND API IMPLEMENTATION (Uncomment this to switch to live server)
// ============================================================================
/*
export const spectatorPredictionApi = {
  getOpenRaces: () => 
    httpClient.get<OpenRacePrediction[]>("/races/open-for-prediction").then(res => res.data),

  getPredictionOptions: (raceId: number) => 
    httpClient.get<PredictionOptions>(`/races/${raceId}/prediction-options`).then(res => res.data),

  submitPrediction: (payload: {
    raceId: number;
    predictionType: "WINNER" | "TOP3";
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
  }) => 
    httpClient.post<UserPrediction>("/predictions", payload).then(res => res.data),

  updatePrediction: (predictionId: number, payload: {
    raceId: number;
    predictionType: "WINNER" | "TOP3";
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
  }) => 
    httpClient.put<UserPrediction>(`/predictions/${predictionId}`, payload).then(res => res.data),

  getMyPredictions: () => 
    httpClient.get<UserPrediction[]>("/predictions/my").then(res => res.data),

  getPointAccount: () => 
    httpClient.get<PointAccount>("/point-accounts/me").then(res => res.data),
};
*/
