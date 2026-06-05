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
  top3PickCount: number;
  correctWinnerCount: number;
  exactTop3Count: number;
  partialTop3Count: number;
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
    top3PickCount: number;
    winnerCorrectCount: number;
    exactTop3Count: number;
    top3AnyOrderCount: number;
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

export async function retrySettlementJob(jobId: number): Promise<void> {
  await httpClient.post(`/admin/predictions/settlement-jobs/${jobId}/retry`);
}
