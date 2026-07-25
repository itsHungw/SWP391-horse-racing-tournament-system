import { httpClient } from "./httpClient";

export interface AdminRaceSummary {
  raceId: number;
  raceName: string;
  roundName: string;
  tournamentId?: number;
  tournamentName?: string;
  raceAt: string;
  raceStatus: string;
  predictionStatus: string;
  totalPredictions: number;
  winnerPickCount: number;
  correctWinnerCount: number;
  incorrectCount: number;
  settlementJobStatus: string | null;
}

export interface AdminRaceDetail {
  raceId: number;
  raceName: string;
  roundName: string;
  tournamentName?: string;
  raceStatus: string;
  predictionStatus: string;
  summary: {
    totalPredictions: number;
    winnerPickCount: number;
    winnerCorrectCount: number;
    incorrectCount: number;
    refundedCount: number;
    rewardedPoints: number;
  };
  settlementJob?: {
    id: number;
    status: string;
    processedCount: number;
    rewardedCount: number;
    failedCount: number;
    retryCount: number;
    errorMessage: string | null;
    startedAt: string;
    completedAt: string;
  };
}

export interface AdminAuditPrediction {
  predictionId: number;
  spectatorName: string;
  spectatorEmail: string;
  predictionType: string;
  selections: string[];
  entryCostPoints: number;
  status: string;
  displayStatus: string;
  resultCategory: string;
  rewardPoints: number;
  submittedAt: string;
  evaluatedAt: string | null;
}

export interface AdminStreakPredictionLeg {
  id: number;
  raceId: number;
  raceName: string;
  predictedWinnerId: number;
  predictedWinnerName: string;
  lockedOdds: number;
  status: string;
}

export interface AdminStreakPrediction {
  id: number;
  spectatorId: number;
  spectatorName: string;
  spectatorEmail: string;
  tournamentId: number;
  tournamentName: string;
  wagerAmount: number;
  totalOdds: number;
  status: string;
  rewardPoints: number;
  createdAt: string;
  evaluatedAt: string | null;
  legs: AdminStreakPredictionLeg[];
}

export async function getAdminPredictionRaces(): Promise<AdminRaceSummary[]> {
  const response = await httpClient.get<AdminRaceSummary[]>("/admin/predictions/races");
  return response.data;
}

export async function getAdminPredictionRaceDetail(raceId: number): Promise<AdminRaceDetail> {
  const response = await httpClient.get<AdminRaceDetail>(`/admin/predictions/races/${raceId}`);
  return response.data;
}

export async function getAdminRacePredictions(raceId: number): Promise<AdminAuditPrediction[]> {
  const response = await httpClient.get<AdminAuditPrediction[]>(`/admin/predictions/races/${raceId}/predictions`);
  return response.data;
}

export async function getAdminStreakPredictions(): Promise<AdminStreakPrediction[]> {
  const response = await httpClient.get<AdminStreakPrediction[]>(`/admin/predictions/streaks`);
  return response.data;
}

export async function retrySettlementJob(jobId: number): Promise<void> {
  await httpClient.post(`/admin/predictions/settlement-jobs/${jobId}/retry`);
}

export interface PredictionSettings {
  displaySeed: number;
  takeoutRate: number;
  updatedAt?: string;
  updatedByUserName?: string | null;
}

export async function getPredictionSettings(): Promise<PredictionSettings> {
  const response = await httpClient.get<PredictionSettings>("/admin/predictions/settings");
  return response.data;
}

export async function updatePredictionSettings(settings: { displaySeed: number; takeoutRate: number }): Promise<PredictionSettings> {
  const response = await httpClient.put<PredictionSettings>("/admin/predictions/settings", settings);
  return response.data;
}
