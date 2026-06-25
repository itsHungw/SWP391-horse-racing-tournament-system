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
  JockeyScheduleItem,
  LockParticipantsResponse,
  Organization,
  RegisterOrganizationPayload,
  RefereeContract,
  RefereeDirectoryEntry,
  InviteRefereePayload,
  OwnerContractPayload,
  OwnerHorseUpdateRequest,
  PageResponse,
  PublicRaceResult,
  PublicRacingSummary,
  Race,
  RacePayload,
  RaceParticipant,
  RaceSummary,
  Tournament,
  TournamentSummary,
  TournamentParticipant,
  TournamentRegistration,
  TournamentRegistrationPayload,
  TournamentRegistrationStatus,
} from "../types/racing";

export async function getPublicTournaments(): Promise<Tournament[]> {
  const response = await httpClient.get<Tournament[]>("/tournaments");
  return response.data;
}

export async function getPublicTournament(id: number): Promise<Tournament> {
  const response = await httpClient.get<Tournament>(`/tournaments/${id}`);
  return response.data;
}

export async function searchPublicTournaments(params: {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  year?: number;
  sortBy?: "ONGOING_FIRST" | "REGISTRATION_CLOSING_SOON" | "LATEST";
}): Promise<PageResponse<TournamentSummary>> {
  const response = await httpClient.get<PageResponse<TournamentSummary>>("/tournaments/search", { params });
  return response.data;
}

export async function getPublicRaces(tournamentId?: number): Promise<Race[]> {
  const response = await httpClient.get<Race[]>("/races", {
    params: tournamentId ? { tournamentId } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getPublicRace(id: number): Promise<Race> {
  const response = await httpClient.get<Race>(`/races/${id}`);
  return response.data;
}

export async function searchPublicRaces(params: {
  scope?: "UPCOMING" | "RESULTS";
  from?: string;
  to?: string;
  tournamentId?: number;
  search?: string;
  sortBy?: "NEXT_RACE" | "LATEST_RESULT";
  page?: number;
  size?: number;
}): Promise<PageResponse<RaceSummary>> {
  const response = await httpClient.get<PageResponse<RaceSummary>>("/races/search", { params });
  return response.data;
}

export async function getPublicRaceResults(id: number): Promise<PublicRaceResult> {
  const response = await httpClient.get<PublicRaceResult>(`/races/${id}/results`);
  return response.data;
}

export async function getPublicRacingSummary(): Promise<PublicRacingSummary> {
  const response = await httpClient.get<PublicRacingSummary>("/racing-summary");
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

export async function updateOwnerHorse(id: number, payload: OwnerHorseUpdateRequest): Promise<Horse> {
  const response = await httpClient.put<Horse>(`/owner/horses/${id}`, payload);
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

export async function uploadAgreementDocument(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<{ url: string }>("/files/upload?category=JOCKEY_AGREEMENT", formData);
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

export async function getJockeyParticipants(): Promise<TournamentParticipant[]> {
  const response = await httpClient.get<TournamentParticipant[]>("/jockey/participants");
  return response.data;
}

export async function getJockeySchedule(): Promise<JockeyScheduleItem[]> {
  const response = await httpClient.get<JockeyScheduleItem[]>("/jockey/schedule");
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

// --- Organizer (Ban tổ chức) onboarding — Cổng 1 ---
export async function registerOrganization(payload: RegisterOrganizationPayload): Promise<Organization> {
  const response = await httpClient.post<Organization>("/organizations", payload);
  return response.data;
}

export async function getMyOrganization(): Promise<Organization> {
  const response = await httpClient.get<Organization>("/organizations/my");
  return response.data;
}

export async function uploadOrganizationLicense(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<{ url: string }>("/files/upload?category=ORGANIZER_LICENSE", formData);
  return response.data;
}

export async function uploadOrganizationLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await httpClient.post<{ url: string }>("/files/upload?category=ORGANIZER_LOGO", formData);
  return response.data;
}

export async function getAdminOrganizations(status?: string): Promise<Organization[]> {
  const response = await httpClient.get<Organization[]>("/admin/organizations", {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function approveOrganization(id: number): Promise<Organization> {
  const response = await httpClient.post<Organization>(`/admin/organizations/${id}/approve`);
  return response.data;
}

export async function rejectOrganization(id: number, reason: string): Promise<Organization> {
  const response = await httpClient.post<Organization>(`/admin/organizations/${id}/reject`, { reason });
  return response.data;
}

export async function suspendOrganization(id: number): Promise<Organization> {
  const response = await httpClient.post<Organization>(`/admin/organizations/${id}/suspend`);
  return response.data;
}

export async function reactivateOrganization(id: number): Promise<Organization> {
  const response = await httpClient.post<Organization>(`/admin/organizations/${id}/reactivate`);
  return response.data;
}

// --- Organizer tournaments — Cổng 2 ---
export async function getMyOrganizerTournaments(): Promise<Tournament[]> {
  const response = await httpClient.get<Tournament[]>("/organizer/tournaments");
  return response.data;
}

export async function createOrganizerTournament(payload: {
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
}): Promise<Tournament> {
  const response = await httpClient.post<Tournament>("/organizer/tournaments", payload);
  return response.data;
}

export async function submitTournamentForApproval(id: number): Promise<Tournament> {
  const response = await httpClient.post<Tournament>(`/organizer/tournaments/${id}/submit`);
  return response.data;
}

export async function updateOrganizerTournamentStatus(id: number, status: string): Promise<void> {
  await httpClient.put(`/organizer/tournaments/${id}/status`, null, { params: { status } });
}

export async function approveTournamentLaunch(id: number): Promise<Tournament> {
  const response = await httpClient.post<Tournament>(`/admin/tournaments/${id}/approve`);
  return response.data;
}

export async function rejectTournamentLaunch(id: number, reason: string): Promise<Tournament> {
  const response = await httpClient.post<Tournament>(`/admin/tournaments/${id}/reject`, { reason });
  return response.data;
}

// --- Referee contracts — thuê trọng tài (BR-07/08/14) ---
export async function getLicensedReferees(): Promise<RefereeDirectoryEntry[]> {
  const response = await httpClient.get<RefereeDirectoryEntry[]>("/organizer/referees");
  return response.data;
}

export async function inviteReferee(tournamentId: number, payload: InviteRefereePayload): Promise<RefereeContract> {
  const response = await httpClient.post<RefereeContract>(
    `/organizer/tournaments/${tournamentId}/referee-contracts`,
    payload,
  );
  return response.data;
}

export async function getTournamentRefereeContracts(tournamentId: number): Promise<RefereeContract[]> {
  const response = await httpClient.get<RefereeContract[]>(
    `/organizer/tournaments/${tournamentId}/referee-contracts`,
  );
  return response.data;
}

export async function terminateRefereeContract(contractId: number, reason?: string): Promise<RefereeContract> {
  const response = await httpClient.post<RefereeContract>(
    `/organizer/referee-contracts/${contractId}/terminate`,
    reason ? { reason } : {},
  );
  return response.data;
}

export async function getMyRefereeContracts(): Promise<RefereeContract[]> {
  const response = await httpClient.get<RefereeContract[]>("/referee/contracts");
  return response.data;
}

// --- Organizer registration gate (duyệt đăng ký giải của mình, BR-15) ---
export async function getOrganizerTournamentRegistrations(
  tournamentId: number,
  status?: TournamentRegistrationStatus,
): Promise<TournamentRegistration[]> {
  const response = await httpClient.get<TournamentRegistration[]>("/organizer/tournament-registrations", {
    params: { tournamentId, status: status || undefined },
  });
  return response.data;
}

export async function approveOrganizerTournamentRegistration(id: number): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(
    `/organizer/tournament-registrations/${id}/approve`,
  );
  return response.data;
}

export async function rejectOrganizerTournamentRegistration(
  id: number,
  reason: string,
): Promise<TournamentRegistration> {
  const response = await httpClient.post<TournamentRegistration>(
    `/organizer/tournament-registrations/${id}/reject`,
    { reason },
  );
  return response.data;
}

// --- Organizer race card + chốt kết quả (BR-09 / BR-16) ---
export async function getOrganizerRaces(tournamentId: number): Promise<Race[]> {
  const response = await httpClient.get<Race[]>("/organizer/races", { params: { tournamentId } });
  return response.data;
}

export async function createOrganizerRace(payload: RacePayload): Promise<Race> {
  const response = await httpClient.post<Race>("/organizer/races", payload);
  return response.data;
}

export async function updateOrganizerRace(id: number, payload: RacePayload): Promise<Race> {
  const response = await httpClient.put<Race>(`/organizer/races/${id}`, payload);
  return response.data;
}

export async function deleteOrganizerRace(id: number): Promise<void> {
  await httpClient.delete(`/organizer/races/${id}`);
}

export async function assignOrganizerRaceReferee(id: number, refereeId: number): Promise<Race> {
  const response = await httpClient.put<Race>(`/organizer/races/${id}/referee`, null, {
    params: { refereeId },
  });
  return response.data;
}

export async function confirmOrganizerRaceResults(id: number): Promise<Race> {
  const response = await httpClient.post<Race>(`/organizer/races/${id}/confirm-results`);
  return response.data;
}

export async function publishOrganizerRaceResults(id: number): Promise<Race> {
  const response = await httpClient.post<Race>(`/organizer/races/${id}/publish-results`);
  return response.data;
}

export async function reopenOrganizerRaceResults(id: number, reason: string): Promise<Race> {
  const response = await httpClient.post<Race>(`/organizer/races/${id}/reopen-results`, { reason });
  return response.data;
}

export async function getOrganizerRaceParticipants(raceId: number): Promise<RaceParticipant[]> {
  const response = await httpClient.get<RaceParticipant[]>(`/organizer/races/${raceId}/participants`);
  return response.data;
}

// --- Organizer jockey pool gate + lock the field (BR-09) ---
export async function getOrganizerJockeyApplications(
  tournamentId: number,
  status?: JockeyPoolApplicationStatus,
): Promise<JockeyPoolApplication[]> {
  const response = await httpClient.get<JockeyPoolApplication[]>(
    `/organizer/tournaments/${tournamentId}/jockey-applications`,
    { params: { status: status || undefined } },
  );
  return response.data;
}

export async function approveOrganizerJockeyApplication(
  tournamentId: number,
  applicationId: number,
): Promise<JockeyPoolApplication> {
  const response = await httpClient.post<JockeyPoolApplication>(
    `/organizer/tournaments/${tournamentId}/jockey-applications/${applicationId}/approve`,
  );
  return response.data;
}

export async function rejectOrganizerJockeyApplication(
  tournamentId: number,
  applicationId: number,
  reason: string,
): Promise<JockeyPoolApplication> {
  const response = await httpClient.post<JockeyPoolApplication>(
    `/organizer/tournaments/${tournamentId}/jockey-applications/${applicationId}/reject`,
    { reason },
  );
  return response.data;
}

export async function getOrganizerParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
  const response = await httpClient.get<TournamentParticipant[]>(
    `/organizer/tournaments/${tournamentId}/participants`,
  );
  return response.data;
}

export async function lockOrganizerParticipants(tournamentId: number): Promise<LockParticipantsResponse> {
  const response = await httpClient.post<LockParticipantsResponse>(
    `/organizer/tournaments/${tournamentId}/lock-participants`,
  );
  return response.data;
}

export async function acceptRefereeContract(contractId: number): Promise<RefereeContract> {
  const response = await httpClient.post<RefereeContract>(`/referee/contracts/${contractId}/accept`);
  return response.data;
}

export async function declineRefereeContract(contractId: number, reason?: string): Promise<RefereeContract> {
  const response = await httpClient.post<RefereeContract>(
    `/referee/contracts/${contractId}/decline`,
    reason ? { reason } : {},
  );
  return response.data;
}
