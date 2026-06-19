export type PredictionType = "WINNER" | "TOP3" | "EXACT_POSITION" | "HEAD_TO_HEAD" | "WINNING_STREAK";

export type PredictionStatus = "PENDING" | "LOCKED" | "CORRECT" | "CORRECT_EXACT" | "CORRECT_ANY_ORDER" | "INCORRECT" | "CANCELLED" | "REFUNDED";

export const predictionStatusLabel: Record<PredictionStatus, string> = {
  PENDING: "Pending",
  LOCKED: "Locked",
  CORRECT: "Correct",
  CORRECT_EXACT: "Correct",
  CORRECT_ANY_ORDER: "Correct",
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
    top3: number;
  };
  rewardConfig: {
    winnerReward: number;
    top3ExactReward: number;
    top3AnyOrderReward: number;
  };
  myPredictions: UserPrediction[];
  winnerDistributionVisible: boolean;
  top3DistributionVisible: boolean;
  options: ParticipantOption[];
  positionOddsMatrix?: Record<number, Record<number, number>>;
  h2hMatchups?: HeadToHeadMatchup[];
}

export interface ParticipantOption {
  raceParticipantId: number;
  startNumber: number | null;
  laneNumber: number | null;
  horseName: string;
  jockeyName: string;
  communityWinnerRate?: number | null;
  communityTop3Rate?: number | null;
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
  predictedSecondId?: number;
  predictedSecondName?: string;
  predictedThirdId?: number;
  predictedThirdName?: string;
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
  raceId: number;
  raceName: string;
  predictedWinnerId: number;
  horseName: string;
  lockedOdds: number;
  status: string;
}

export interface StreakPredictionResponse {
  id: number;
  tournamentId: number;
  wagerAmount: number;
  totalOdds: number;
  status: string;
  rewardPoints: number;
  createdAt: string;
  legs: StreakPredictionLeg[];
}
