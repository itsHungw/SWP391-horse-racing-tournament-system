import { httpClient } from "./httpClient";

export type RaceSummary = {
  id: number;
  name: string;
  code: string;
  distanceMeters: number;
  status: string;
  scheduledAt?: string;
  venue?: string;
};

export async function getAssignedRaces(): Promise<RaceSummary[]> {
  const response = await httpClient.get<RaceSummary[]>("/referee/races");
  return response.data;
}

export async function getAssignedRace(raceId: number): Promise<RaceSummary> {
  const response = await httpClient.get<RaceSummary>(`/referee/races/${raceId}`);
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
  const response = await httpClient.get<ParticipantVerification[]>(`/referee/races/${raceId}/participants`);
  return response.data;
}

export async function savePreRaceChecks(raceId: number, checks: ParticipantVerification[]): Promise<void> {
  await httpClient.post(`/referee/races/${raceId}/pre-checks`, checks);
}

export type ParticipantResultEntry = {
  participantId: number;
  horseName: string;
  jockeyName: string;
  position: number | "";
  rawFinishTimeSeconds?: number | "";
  penaltySeconds?: number | "";
  finishTimeSeconds: number | "";
  status: "FINISHED" | "DISQUALIFIED" | "DID_NOT_FINISH" | "WITHDRAWN";
  note?: string | null;
};

export async function getRaceResultEntries(raceId: number): Promise<ParticipantResultEntry[]> {
  const response = await httpClient.get<ParticipantResultEntry[]>(`/referee/races/${raceId}/result-entries`);
  return response.data;
}

export async function submitRaceResults(raceId: number, results: ParticipantResultEntry[]): Promise<void> {
  await httpClient.post(`/referee/races/${raceId}/results`, results);
}

export type SubmitRaceResultPackageRequest = {
  results: ParticipantResultEntry[];
  requiresAdminReview: boolean;
  reviewReason?: string | null;
  reportTitle?: string | null;
  reportSummary?: string | null;
};

export async function submitRaceResultPackage(
  raceId: number,
  payload: SubmitRaceResultPackageRequest
): Promise<void> {
  await httpClient.post(`/referee/races/${raceId}/results/submit`, payload);
}

export type ViolationEntry = {
  offenderId: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
};

export type RefereeReportEntry = {
  title: string;
  summary: string;
};

export async function submitViolation(raceId: number, violation: ViolationEntry): Promise<void> {
  await httpClient.post(`/referee/races/${raceId}/violations`, violation);
}

export async function submitRefereeReport(raceId: number, report: RefereeReportEntry): Promise<void> {
  await httpClient.post(`/referee/races/${raceId}/reports`, report);
}

export async function transitionRaceState(raceId: number): Promise<string> {
  const response = await httpClient.post<{ status: string }>(`/referee/races/${raceId}/next-step`);
  return response.data.status;
}

export async function startRace(raceId: number): Promise<string> {
  const response = await httpClient.post<{ status: string }>(`/referee/races/${raceId}/start`);
  return response.data.status;
}

export async function finishRace(raceId: number): Promise<string> {
  const response = await httpClient.post<{ status: string }>(`/referee/races/${raceId}/finish`);
  return response.data.status;
}
