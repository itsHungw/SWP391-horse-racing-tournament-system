import { httpClient } from "./httpClient";
import type { Tournament } from "../types/racing";

export interface CreateTournamentPayload {
  name: string;
  code: string;
  description?: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  maxHorses?: number;
  maxHorsesPerOwner?: number;
  totalPrizePool?: number;
}

export async function getAdminTournaments(): Promise<Tournament[]> {
  const response = await httpClient.get<Tournament[]>("/admin/tournaments");
  return response.data;
}

export async function getTournamentDetail(id: number): Promise<Tournament> {
  const response = await httpClient.get<Tournament>(`/admin/tournaments/${id}`);
  return response.data;
}

export async function createTournament(payload: CreateTournamentPayload): Promise<Tournament> {
  const response = await httpClient.post<Tournament>("/admin/tournaments", payload);
  return response.data;
}

export async function updateTournament(id: number, payload: CreateTournamentPayload): Promise<Tournament> {
  const response = await httpClient.put<Tournament>(`/admin/tournaments/${id}`, payload);
  return response.data;
}

export async function deleteTournament(id: number): Promise<void> {
  await httpClient.delete(`/admin/tournaments/${id}`);
}

export async function updateTournamentStatus(id: number, status: string): Promise<void> {
  await httpClient.put(`/admin/tournaments/${id}/status`, null, {
    params: { status }
  });
}
