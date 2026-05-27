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
