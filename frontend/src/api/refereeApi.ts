import { httpClient } from "./httpClient";

export type RaceSummary = {
  id: number;
  name: string;
  code: string;
  distanceMeters: number;
  status: string;
  scheduledAt?: string;
  venue?: string;
  /** Khác null khi Ban tổ chức đã trả hồ sơ về cho trọng tài sửa (BR-16). */
  returnedReason?: string | null;
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
  position: number | "" | null;
  rawFinishTimeSeconds?: number | "" | null;
  penaltySeconds?: number | "" | null;
  finishTimeSeconds: number | "" | null;
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
  /**
   * OBJECTION_INTERFERENCE -> offenderId là bên BỊ khiếu nại.
   * OBJECTION_GENERAL      -> offenderId là bên ĐỨNG ĐƠN (không có bị đơn).
   * INCIDENT               -> trọng tài tự ghi nhận.
   */
  violationType?: string;
  /** Phán quyết của trọng tài: NO_CHANGE | RIDER_PENALTY | RESULT_AMENDED. */
  penalty?: string;
};

export type ObjectionKind = "OBJECTION_INTERFERENCE" | "OBJECTION_GENERAL";
export type ObjectionDecision = "NO_CHANGE" | "RIDER_PENALTY" | "RESULT_AMENDED";

/** Nhãn hiển thị của phán quyết — dùng chung cho form trọng tài và panel Ban tổ chức. */
export const OBJECTION_DECISION_LABELS: Record<ObjectionDecision, string> = {
  NO_CHANGE: "No change to result",
  RIDER_PENALTY: "Rider penalty, result stands",
  RESULT_AMENDED: "Result amended",
};

export type RaceObjectionDraft = {
  kind: ObjectionKind;
  raisedByParticipantId: number;
  raisedByName: string;
  againstParticipantId?: number;
  againstName?: string;
  foulType?: string;
  subject?: string;
  videoMarkSeconds?: number | "";
  detail: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  decision: ObjectionDecision;
};

/**
 * Dựng phần mô tả lưu vào Violation.description. Các dropdown ở form chỉ để trọng tài
 * chọn thay vì gõ tay — dữ liệu cuối cùng vẫn là text, không cần bảng riêng.
 */
export function buildObjectionDescription(draft: Partial<RaceObjectionDraft>): string {
  if (draft.kind === "OBJECTION_INTERFERENCE") {
    const mark =
      draft.videoMarkSeconds === "" || draft.videoMarkSeconds == null
        ? ""
        : ` — video mark ${draft.videoMarkSeconds}s`;
    return [
      `[Objection] ${draft.raisedByName} vs ${draft.againstName}`,
      `Foul: ${draft.foulType}${mark}`,
      `Detail: ${draft.detail}`,
      `Decision: ${draft.decision}`,
    ].join("\n");
  }

  return [
    `[Objection] ${draft.raisedByName} — target: ${draft.subject}`,
    `Detail: ${draft.detail}`,
    `Decision: ${draft.decision}`,
  ].join("\n");
}

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
