import { httpClient } from "./httpClient";

export type DisputeStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "REJECTED";
export type DisputeRole = "SPECTATOR" | "JOCKEY" | "HORSE_OWNER" | "ADMIN" | "REFEREE" | "ORGANIZER" | "ACCOUNT_HOLDER";
export type DisputeCategory = "FINANCE" | "PREDICTION" | "RACING_RULES" | "SYSTEM" | "DISCIPLINARY" | "GENERAL";
export type DisputeReferenceType = "RACE_PREDICTION" | "WALLET_TRANSACTION" | "RACE_RESULT" | "ACCOUNT_ENFORCEMENT" | "GENERAL";
export type DisputePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface DisputeAttachmentResponse {
  id: number;
  fileUrl: string;
  createdAt: string;
}

export interface DisputeResponse {
  id: number;
  requesterId: number;
  requesterName: string;
  requesterEmail: string;
  requesterRole: DisputeRole;
  handlerRole: DisputeRole;
  tournamentId: number | null;
  organizationId: number | null;
  referenceType: DisputeReferenceType;
  referenceId: number;
  category: DisputeCategory;
  title: string;
  description: string;
  status: DisputeStatus;
  priority: DisputePriority;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: DisputeAttachmentResponse[];
}

export interface CreateDisputeRequest {
  referenceType: DisputeReferenceType;
  referenceId: number;
  category: DisputeCategory;
  title: string;
  description: string;
  tournamentId?: number | null;
  organizationId?: number | null;
  evidenceUrls?: string[];
}

export const disputeApi = {
  createSpectatorDispute: async (data: CreateDisputeRequest) => {
    const response = await httpClient.post<DisputeResponse>("/spectator/disputes", data);
    return response.data;
  },
  
  getSpectatorDisputes: async () => {
    const response = await httpClient.get<DisputeResponse[]>("/spectator/disputes");
    return response.data;
  },
  
  uploadEvidence: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await httpClient.post<{ url: string }>("/files/upload?category=DISPUTE_EVIDENCE", formData);
    return response.data;
  },

  getAdminDisputes: async () => {
    const response = await httpClient.get<DisputeResponse[]>("/admin/disputes");
    return response.data;
  },

  updateDisputeStatus: async (id: number, data: { status: DisputeStatus; priority?: DisputePriority; resolutionNote?: string }) => {
    const response = await httpClient.put<DisputeResponse>(`/admin/disputes/${id}/status`, data);
    return response.data;
  }
};
