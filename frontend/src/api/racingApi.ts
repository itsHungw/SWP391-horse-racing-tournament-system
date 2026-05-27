import { httpClient } from "./httpClient";
import type {
  Horse,
  HorsePayload,
  HorseStatus,
  Tournament,
  TournamentRegistration,
  TournamentRegistrationPayload,
  TournamentRegistrationStatus,
} from "../types/racing";

export async function getPublicTournaments(): Promise<Tournament[]> {
  const response = await httpClient.get<Tournament[]>("/tournaments");
  return response.data;
}

export async function getOwnerHorses(): Promise<Horse[]> {
  const response = await httpClient.get<Horse[]>("/owner/horses");
  return response.data;
}

export async function createOwnerHorse(payload: HorsePayload): Promise<Horse> {
  const response = await httpClient.post<Horse>("/owner/horses", payload);
  return response.data;
}

export async function getAdminHorses(status?: HorseStatus): Promise<Horse[]> {
  const response = await httpClient.get<Horse[]>("/admin/horses", {
    params: { status: status || undefined },
  });
  return response.data;
}

export async function approveAdminHorse(id: number): Promise<Horse> {
  const response = await httpClient.post<Horse>(`/admin/horses/${id}/approve`);
  return response.data;
}

export async function rejectAdminHorse(id: number, reason: string): Promise<Horse> {
  const response = await httpClient.post<Horse>(`/admin/horses/${id}/reject`, { reason });
  return response.data;
}

export async function getOwnerTournamentRegistrations(): Promise<TournamentRegistration[]> {
  const response = await httpClient.get<TournamentRegistration[]>("/owner/tournament-registrations");
  return response.data;
}

export async function createOwnerTournamentRegistration(
  payload: TournamentRegistrationPayload,
): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>("/owner/tournament-registrations", payload);
  return response.data;
}

export async function withdrawOwnerTournamentRegistration(id: number): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(`/owner/tournament-registrations/${id}/withdraw`);
  return response.data;
}

export async function getAdminTournamentRegistrations(
  status?: TournamentRegistrationStatus,
): Promise<TournamentRegistration[]> {
  const response = await httpClient.get<TournamentRegistration[]>("/admin/tournament-registrations", {
    params: { status: status || undefined },
  });
  return response.data;
}

export async function approveAdminTournamentRegistration(id: number): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(`/admin/tournament-registrations/${id}/approve`);
  return response.data;
}

export async function rejectAdminTournamentRegistration(
  id: number,
  reason: string,
): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(`/admin/tournament-registrations/${id}/reject`, {
    reason,
  });
  return response.data;
}
