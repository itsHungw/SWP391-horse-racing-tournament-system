import { httpClient } from "./httpClient";
import type {
  RaceMediaPayload,
  RaceMediaPublicResponse,
  RaceMediaResponse,
  RaceMediaValidateResponse,
} from "../types/racing";

export type RaceMediaManageScope = "organizer" | "admin";
// Managed media kind: highlight uses the legacy /media segment, live uses /live-stream.
export type RaceMediaKind = "highlight" | "live";

function manageBase(scope: RaceMediaManageScope) {
  return scope === "admin" ? "/admin/races" : "/organizer/races";
}

function segment(kind: RaceMediaKind) {
  return kind === "live" ? "live-stream" : "media";
}

export async function getRaceMedia(
  scope: RaceMediaManageScope,
  raceId: number,
  kind: RaceMediaKind = "highlight",
): Promise<RaceMediaResponse | null> {
  const response = await httpClient.get<RaceMediaResponse | "">(`${manageBase(scope)}/${raceId}/${segment(kind)}`);
  return response.status === 204 ? null : (response.data as RaceMediaResponse);
}

export async function validateRaceMedia(
  scope: RaceMediaManageScope,
  raceId: number,
  payload: RaceMediaPayload,
  kind: RaceMediaKind = "highlight",
): Promise<RaceMediaValidateResponse> {
  const response = await httpClient.post<RaceMediaValidateResponse>(`${manageBase(scope)}/${raceId}/${segment(kind)}/validate`, payload);
  return response.data;
}

export async function saveRaceMedia(
  scope: RaceMediaManageScope,
  raceId: number,
  payload: RaceMediaPayload,
  kind: RaceMediaKind = "highlight",
): Promise<RaceMediaResponse> {
  const response = await httpClient.put<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/${segment(kind)}`, payload);
  return response.data;
}

export async function publishRaceMedia(scope: RaceMediaManageScope, raceId: number, kind: RaceMediaKind = "highlight"): Promise<RaceMediaResponse> {
  const response = await httpClient.post<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/${segment(kind)}/publish`);
  return response.data;
}

export async function unpublishRaceMedia(scope: RaceMediaManageScope, raceId: number, kind: RaceMediaKind = "highlight"): Promise<RaceMediaResponse> {
  const response = await httpClient.post<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/${segment(kind)}/unpublish`);
  return response.data;
}

export async function reverifyRaceMedia(scope: RaceMediaManageScope, raceId: number, kind: RaceMediaKind = "highlight"): Promise<RaceMediaResponse> {
  const response = await httpClient.post<RaceMediaResponse>(`${manageBase(scope)}/${raceId}/${segment(kind)}/reverify`);
  return response.data;
}

export async function deleteRaceMedia(scope: RaceMediaManageScope, raceId: number, kind: RaceMediaKind = "highlight"): Promise<void> {
  await httpClient.delete(`${manageBase(scope)}/${raceId}/${segment(kind)}`);
}

export async function getPublicRaceHighlight(raceId: number): Promise<RaceMediaPublicResponse | null> {
  const response = await httpClient.get<RaceMediaPublicResponse | "">(`/races/${raceId}/highlight`);
  return response.status === 204 ? null : (response.data as RaceMediaPublicResponse);
}

// Public race live stream. The API only returns published and verified media; the page hides it once the race is finished.
export async function getPublicRaceLiveStream(raceId: number): Promise<RaceMediaPublicResponse | null> {
  const response = await httpClient.get<RaceMediaPublicResponse | "">(`/races/${raceId}/live-stream`);
  return response.status === 204 ? null : (response.data as RaceMediaPublicResponse);
}

export async function getPublicTournamentHighlights(tournamentId: number): Promise<RaceMediaPublicResponse[]> {
  const response = await httpClient.get<RaceMediaPublicResponse[]>("/races/highlights", { params: { tournamentId } });
  return Array.isArray(response.data) ? response.data : [];
}
