import { useState, useEffect, useCallback } from "react";
import { 
  OpenRacePrediction, 
  PredictionOptions, 
  UserPrediction, 
  PointAccount,
  PredictionType,
  StreakPredictionResponse
} from "../types/prediction.types";
import { spectatorPredictionApi } from "../services/spectatorPredictionApi";

export function useSpectatorPredictions() {
  const [pointAccount, setPointAccount] = useState<PointAccount | null>(null);
  const [openRaces, setOpenRaces] = useState<OpenRacePrediction[]>([]);
  const [selectedRace, setSelectedRace] = useState<OpenRacePrediction | null>(null);
  const [predictionOptions, setPredictionOptions] = useState<PredictionOptions | null>(null);
  const [myPredictions, setMyPredictions] = useState<UserPrediction[]>([]);
  const [myStreaks, setMyStreaks] = useState<StreakPredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pts, races, preds, streaks] = await Promise.all([
        spectatorPredictionApi.getPointAccount(),
        spectatorPredictionApi.getOpenRaces(),
        spectatorPredictionApi.getMyPredictions(),
        spectatorPredictionApi.getSpectatorStreaks()
      ]);
      setPointAccount(pts);
      setOpenRaces(races);
      setMyPredictions(preds);
      setMyStreaks(streaks);

      if (races.length > 0) {
        const currentSelected = selectedRace 
          ? races.find(r => r.raceId === selectedRace.raceId) || races[0] 
          : races[0];
        setSelectedRace(currentSelected);
        const options = await spectatorPredictionApi.getPredictionOptions(currentSelected.raceId);
        setPredictionOptions(options);
      } else {
        setSelectedRace(null);
        setPredictionOptions(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load prediction arena data.");
    } finally {
      setLoading(false);
    }
  }, [selectedRace]);

  const selectRace = async (race: OpenRacePrediction) => {
    try {
      setLoading(true);
      setSelectedRace(race);
      const options = await spectatorPredictionApi.getPredictionOptions(race.raceId);
      setPredictionOptions(options);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load race information.");
    } finally {
      setLoading(false);
    }
  };

  const submitPrediction = async (payload: {
    raceId: number;
    predictionType: PredictionType;
    predictedWinnerId: number;
    predictedPosition?: number | null;
    wagerAmount: number;
  }) => {
    try {
      await spectatorPredictionApi.submitPrediction(payload);
      await loadInitialData();
    } catch (err: any) {
      throw new Error(err?.response?.data?.message || "Failed to submit prediction.");
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedRace) return;

    const interval = window.setInterval(async () => {
      try {
        const options = await spectatorPredictionApi.getPredictionOptions(selectedRace.raceId);
        setPredictionOptions(options);
      } catch {
        // Keep the current board stable if one realtime refresh fails.
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [selectedRace?.raceId]);

  return {
    pointAccount,
    openRaces,
    selectedRace,
    predictionOptions,
    myPredictions,
    myStreaks,
    loading,
    error,
    selectRace,
    submitPrediction,
    refreshAll: loadInitialData
  };
}
