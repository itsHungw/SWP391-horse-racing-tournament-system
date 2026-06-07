import { httpClient } from "./httpClient";
import type { Race, RacePayload, RaceStatus } from "../types/racing";

export async function getAdminRaces(params?: { tournamentId?: number }): Promise<Race[]> {
  const response = await httpClient.get<Race[]>("/admin/races", { params });
  return response.data;
}

export async function createAdminRace(payload: RacePayload): Promise<Race> {
  const response = await httpClient.post<Race>("/admin/races", payload);
  return response.data;
}

export async function updateAdminRaceStatus(id: number, status: RaceStatus): Promise<Race> {
  const response = await httpClient.put<Race>(`/admin/races/${id}/status`, null, {
    params: { status },
  });
  return response.data;
}

export async function assignAdminRaceReferee(id: number, refereeId: number): Promise<Race> {
  const response = await httpClient.put<Race>(`/admin/races/${id}/referee`, null, {
    params: { refereeId },
  });
  return response.data;
}
