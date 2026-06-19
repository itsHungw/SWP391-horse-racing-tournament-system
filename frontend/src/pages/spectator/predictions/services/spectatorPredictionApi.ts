import { httpClient } from "../../../../api/httpClient";
import {
  OpenRacePrediction,
  PredictionOptions,
  UserPrediction,
  PointAccount,
  PredictionType,
  StreakPredictionResponse
} from "../types/prediction.types";

export const spectatorPredictionApi = {
  getOpenRaces: () =>
    httpClient.get<OpenRacePrediction[]>("/races/open-for-prediction").then(res => res.data),

  getPredictionOptions: (raceId: number) =>
    httpClient.get<PredictionOptions>(`/races/${raceId}/prediction-options`).then(res => res.data),

  submitPrediction: (payload: {
    raceId: number;
    predictionType: PredictionType;
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
    predictedPosition?: number | null;
    matchupOpponentId?: number | null;
    handicapSeconds?: number | null;
    wagerAmount: number;
  }) =>
    httpClient.post<UserPrediction>("/predictions", payload).then(res => res.data),

  updatePrediction: (predictionId: number, payload: {
    raceId: number;
    predictionType: PredictionType;
    predictedWinnerId: number;
    predictedSecondId?: number | null;
    predictedThirdId?: number | null;
    predictedPosition?: number | null;
    matchupOpponentId?: number | null;
    handicapSeconds?: number | null;
    wagerAmount: number;
  }) =>
    httpClient.put<UserPrediction>(`/predictions/${predictionId}`, payload).then(res => res.data),

  getMyPredictions: () =>
    httpClient.get<UserPrediction[]>("/predictions/my").then(res => res.data),

  getPointAccount: () =>
    httpClient.get<PointAccount>("/point-accounts/me").then(res => res.data),

  submitStreakPrediction: (payload: {
    tournamentId: number;
    wagerAmount: number;
    legs: {
      raceId: number;
      predictedWinnerId: number;
    }[];
  }) =>
    httpClient.post<StreakPredictionResponse>("/streak", payload).then(res => res.data),

  getSpectatorStreaks: () =>
    httpClient.get<StreakPredictionResponse[]>("/streak").then(res => res.data),
};
