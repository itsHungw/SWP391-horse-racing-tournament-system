import axios from "axios";

const API_URL = "/api/referee";

export type RaceSummary = {
  id: number;
  name: string;
  code: string;
  distanceMeters: number;
  status: string;
};

export async function getAssignedRaces(): Promise<RaceSummary[]> {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get(`${API_URL}/races`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export type ParticipantVerification = {
  participantId: number;
  horseName: string;
  jockeyName: string;
  jockeyWeight: number;
  gearOk: boolean;
  healthOk: boolean;
  status: "PASSED" | "FAILED" | "PENDING";
};

export async function getRaceParticipants(raceId: number): Promise<ParticipantVerification[]> {
  const token = localStorage.getItem("accessToken");
  const response = await axios.get(`${API_URL}/races/${raceId}/participants`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function savePreRaceChecks(raceId: number, checks: ParticipantVerification[]): Promise<void> {
  const token = localStorage.getItem("accessToken");
  await axios.post(`${API_URL}/races/${raceId}/pre-checks`, checks, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
