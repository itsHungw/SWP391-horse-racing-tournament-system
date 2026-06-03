import { httpClient } from "./httpClient";
import type {
  Horse,
  HorseDocument,
  HorseDocumentPayload,
  HorseMultipartPayload,
  HorseStatus,
  JockeyChampionship,
  JockeyInvitation,
  JockeyPoolApplication,
  JockeyPoolApplicationStatus,
  LockParticipantsResponse,
  OwnerContractPayload,
  PageResponse,
  Tournament,
  TournamentParticipant,
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

export async function getOwnerHorsesPage(params: {
  page: number;
  size: number;
  query?: string;
  status?: string;
  gender?: string;
}): Promise<PageResponse<Horse>> {
  const response = await httpClient.get<PageResponse<Horse>>("/owner/horses", { params });
  return response.data;
}

export async function getOwnerHorse(id: number): Promise<Horse> {
  const response = await httpClient.get<Horse>(`/owner/horses/${id}`);
  return response.data;
}

export async function createOwnerHorse(payload: HorseMultipartPayload): Promise<Horse> {
  const formData = new FormData();
  appendFormValue(formData, "name", payload.name);
  appendFormValue(formData, "gender", payload.gender);
  appendFormValue(formData, "breed", payload.breed);
  appendFormValue(formData, "dateOfBirth", payload.dateOfBirth);
  appendFormValue(formData, "color", payload.color);
  appendFormValue(formData, "heightCm", payload.heightCm);
  appendFormValue(formData, "weightKg", payload.weightKg);
  appendFormValue(formData, "healthStatus", payload.healthStatus);
  appendFormValue(formData, "medicalNote", payload.medicalNote);
  appendFormValue(formData, "description", payload.description);
  formData.append("imageFile", payload.imageFile);
  formData.append("evidenceFile", payload.evidenceFile);

  const response = await httpClient.post<Horse>("/owner/horses", formData);
  return response.data;
}

export async function getOwnerHorseDocuments(id: number): Promise<HorseDocument[]> {
  const response = await httpClient.get<HorseDocument[]>(`/owner/horses/${id}/documents`);
  return response.data;
}

export async function createOwnerHorseDocument(id: number, payload: HorseDocumentPayload): Promise<HorseDocument> {
  const formData = new FormData();
  appendFormValue(formData, "documentType", payload.documentType);
  appendFormValue(formData, "referenceNumber", payload.referenceNumber);
  appendFormValue(formData, "issueDate", payload.issueDate);
  appendFormValue(formData, "expiryDate", payload.expiryDate);
  appendFormValue(formData, "issuer", payload.issuer);
  appendFormValue(formData, "notes", payload.notes);
  formData.append("documentFile", payload.documentFile);

  const response = await httpClient.post<HorseDocument>(`/owner/horses/${id}/documents`, formData);
  return response.data;
}

function appendFormValue(formData: FormData, key: string, value: string | number | undefined) {
  if (value === undefined || value === "") {
    return;
  }
  formData.append(key, String(value));
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

export async function getOwnerTournamentRegistrationsPage(params: {
  page: number;
  size: number;
  horseId?: number;
  focusId?: number;
}): Promise<PageResponse<TournamentRegistration>> {
  const response = await httpClient.get<PageResponse<TournamentRegistration>>("/owner/tournament-registrations", {
    params,
  });
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

export async function getAdminJockeyPoolApplications(
  championshipId: number,
  status?: JockeyPoolApplicationStatus,
): Promise<JockeyPoolApplication[]> {
  const response = await httpClient.get<JockeyPoolApplication[]>(
    `/admin/championships/${championshipId}/jockey-pool-applications`,
    { params: { status: status || undefined } },
  );
  return response.data;
}

export async function getJockeyChampionships(): Promise<JockeyChampionship[]> {
  const response = await httpClient.get<JockeyChampionship[]>("/jockey/championships");
  return response.data;
}

export async function getJockeyPoolApplications(): Promise<JockeyPoolApplication[]> {
  const response = await httpClient.get<JockeyPoolApplication[]>("/jockey/championships/applications");
  return response.data;
}

export async function applyToJockeyChampionship(
  championshipId: number,
  message?: string,
): Promise<JockeyPoolApplication> {
  const response = await httpClient.post<JockeyPoolApplication>(
    `/jockey/championships/${championshipId}/pool-applications`,
    { message },
  );
  return response.data;
}

export async function approveAdminJockeyPoolApplication(
  championshipId: number,
  applicationId: number,
): Promise<JockeyPoolApplication> {
  const response = await httpClient.post<JockeyPoolApplication>(
    `/admin/championships/${championshipId}/jockey-pool-applications/${applicationId}/approve`,
  );
  return response.data;
}

export async function rejectAdminJockeyPoolApplication(
  championshipId: number,
  applicationId: number,
  reason: string,
): Promise<JockeyPoolApplication> {
  const response = await httpClient.post<JockeyPoolApplication>(
    `/admin/championships/${championshipId}/jockey-pool-applications/${applicationId}/reject`,
    { reason },
  );
  return response.data;
}

export async function getOwnerAvailableJockeys(championshipId: number): Promise<JockeyPoolApplication[]> {
  const response = await httpClient.get<JockeyPoolApplication[]>(
    `/owner/championships/${championshipId}/jockey-pool`,
  );
  return response.data;
}

export async function sendOwnerContract(
  championshipId: number,
  payload: OwnerContractPayload,
): Promise<JockeyInvitation> {
  const response = await httpClient.post<JockeyInvitation>(
    `/owner/championships/${championshipId}/contracts`,
    payload,
  );
  return response.data;
}

export async function getOwnerContracts(championshipId: number): Promise<JockeyInvitation[]> {
  const response = await httpClient.get<JockeyInvitation[]>(`/owner/championships/${championshipId}/contracts`);
  return response.data;
}

export async function getJockeyContracts(): Promise<JockeyInvitation[]> {
  const response = await httpClient.get<JockeyInvitation[]>("/jockey/contracts");
  return response.data;
}

export async function acceptJockeyContract(contractId: number): Promise<JockeyInvitation> {
  const response = await httpClient.post<JockeyInvitation>(`/jockey/contracts/${contractId}/accept`);
  return response.data;
}

export async function rejectJockeyContract(contractId: number, reason: string): Promise<JockeyInvitation> {
  const response = await httpClient.post<JockeyInvitation>(`/jockey/contracts/${contractId}/reject`, { reason });
  return response.data;
}

export async function lockAdminChampionshipParticipants(championshipId: number): Promise<LockParticipantsResponse> {
  const response = await httpClient.post<LockParticipantsResponse>(
    `/admin/championships/${championshipId}/lock-participants`,
  );
  return response.data;
}

export async function getAdminChampionshipParticipants(championshipId: number): Promise<TournamentParticipant[]> {
  const response = await httpClient.get<TournamentParticipant[]>(`/admin/championships/${championshipId}/participants`);
  return response.data;
}
