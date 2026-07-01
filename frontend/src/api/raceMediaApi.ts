import { httpClient } from "./httpClient";
import type {
  RaceMediaPayload,
  RaceMediaPublicResponse,
  RaceMediaResponse,
  RaceMediaValidateResponse,
} from "../types/racing";

export type RaceMediaManageScope = "organizer" | "admin";

function manageBase(scope: RaceMediaManageScope) {
  return scope === "admin" ? "/admin/races" : "/organizer/races";
}

export async function getRaceMedia(scope: RaceMediaManageScope, raceId: number): Promise<RaceMediaResponse | null> {
  const response = await httpClient.get<RaceMediaResponse | "">(`${manageBase(scope)}/${raceId}/media`);
  return response.status === 204 ? null : (response.data as RaceMediaResponse);
}

export async function validateRaceMedia(
  scope: RaceMediaManageScope,
  raceId: number,
  payload: RaceMediaPayload,
): Promise<RaceMediaValidateResponse> {
  const response = await httpClient.post<RaceMediaValidateResponse>(`${manageBase(scope)}/${raceId}/media/validate`, payload);
  return response.data;
}

export async function saveRaceMedia(
  scope: RaceMediaManageScope,
  raceId: number,
  payload: RaceMediaPayload,
): Promise<RaceMediaResponse> {
  const response = await httpClient.put<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/media`, payload);
  return response.data;
}

export async function publishRaceMedia(scope: RaceMediaManageScope, raceId: number): Promise<RaceMediaResponse> {
  const response = await httpClient.post<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/media/publish`);
  return response.data;
}

export async function unpublishRaceMedia(scope: RaceMediaManageScope, raceId: number): Promise<RaceMediaResponse> {
  const response = await httpClient.post<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/media/unpublish`);
  return response.data;
}

export async function reverifyRaceMedia(scope: RaceMediaManageScope, raceId: number): Promise<RaceMediaResponse> {
  const response = await httpClient.post<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/media/reverify`);
  return response.data;
}

export async function deleteRaceMedia(scope: RaceMediaManageScope, raceId: number): Promise<void> {
  await httpClient.delete(`${manageBase(scope)}/${raceId}/media`);
}

export async function getPublicRaceHighlight(raceId: number): Promise<RaceMediaPublicResponse | null> {
  const response = await httpClient.get<RaceMediaPublicResponse | "">(`/races/${raceId}/highlight`);
  return response.status === 204 ? null : (response.data as RaceMediaPublicResponse);
}

export async function getPublicTournamentHighlights(tournamentId: number): Promise<RaceMediaPublicResponse[]> {
  const response = await httpClient.get<RaceMediaPublicResponse[]>("/races/highlights", { params: { tournamentId } });
  return Array.isArray(response.data) ? response.data : [];
}
