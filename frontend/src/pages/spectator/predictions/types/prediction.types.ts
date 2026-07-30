export type PredictionType = "WINNER" | "EXACT_POSITION" | "HEAD_TO_HEAD" | "WINNING_STREAK";

export type PredictionStatus = "PENDING" | "LOCKED" | "CORRECT" | "INCORRECT" | "CANCELLED" | "REFUNDED";

export const predictionStatusLabel: Record<PredictionStatus, string> = {
  PENDING: "Pending",
  LOCKED: "Locked",
  CORRECT: "Correct",
  INCORRECT: "Incorrect",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export interface OpenRacePrediction {
  raceId: number;
  raceName: string;
  roundName: string;
  tournamentId?: number;
  tournamentName?: string;
  raceAt: string;
  status: string;
  totalPredictions: number;
  predictedByUser: {
    hasPredicted: boolean;
    types: PredictionType[];
  };
}

export interface HeadToHeadMatchup {
  participantAId: number;
  participantBId: number;
  handicapSeconds: number;
  oddsA: number;
  oddsB: number;
}

export interface PredictionOptions {
  raceId: number;
  raceName: string;
  raceStatus: string;
  predictionOpen: boolean;
  entryCost: {
    winner: number;
  };
  rewardConfig: {
    winnerReward: number;
  };
  myPredictions: UserPrediction[];
  winnerDistributionVisible: boolean;
  houseFeePercent?: number;
  options: ParticipantOption[];
  positionOddsMatrix?: Record<number, Record<number, number>>;
  h2hMatchups?: HeadToHeadMatchup[];
}

export interface PredictionQuote {
  accepted: boolean;
  raceId: number;
  predictionType: PredictionType;
  predictedWinnerId: number;
  predictedPosition?: number | null;
  wagerAmount: number;
  currentOdds: number;
  oddsAfterStake: number;
  priceImpactPercent: number;
  estimatedReturn: number;
  estimatedProfit: number;
  potentialLoss: number;
  playerPoolBefore: number;
  playerPoolAfter: number;
  houseFeeAmount: number;
  netPlayerPoolAfter: number;
  pricingLiquidity: number;
  houseFeePercent: number;
  liquidityNote?: string;
}

export interface ParticipantOption {
  raceParticipantId: number;
  startNumber: number | null;
  laneNumber: number | null;
  horseName: string;
  jockeyName: string;
  communityWinnerRate?: number | null;
  winOdds?: number | null; // fair win odds (1/p) — used to price streak legs
}

export interface UserPrediction {
  id: number;
  raceId: number;
  raceName?: string;
  roundName?: string;
  roundNumber?: number;
  roundCode?: string;
  championshipName?: string;
  predictionType: PredictionType;
  predictedWinnerId: number; // Horse ID
  predictedPosition?: number;
  predictedWinnerName?: string;
  entryCostPoints: number;
  rewardPoints: number;
  status: PredictionStatus;
  resultCategory: string; // derived field
  lockedAt?: string;
  evaluatedAt?: string;
  createdAt: string;
  wagerAmount?: number;
  lockedOdds?: number;
}

export interface PointAccount {
  userId: number;
  pointBalance: number;
}

export interface StreakPredictionLeg {
  id?: number;
  raceId: number;
  raceName: string;
  raceStartTime?: string;
  predictedWinnerId: number;
  horseName?: string;
  predictedWinnerName?: string;
  placedOdds?: number;
  expectedOdds?: number;
  lockedOdds: number;
  status: string;
}

export interface StreakPredictionResponse {
  id: number;
  tournamentId: number;
  wagerAmount: number;
  totalOdds: number;
  placedTotalOdds?: number;
  expectedTotalOdds?: number;
  status: string;
  rewardPoints: number;
  createdAt: string;
  legs: StreakPredictionLeg[];
}
