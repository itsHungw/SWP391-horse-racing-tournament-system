export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type RequestedRole = 'HORSE_OWNER' | 'JOCKEY' | 'REFEREE';

export interface RoleRequest {
  id: number;
  userId: number;
  userEmail?: string;
  requestedRole: RequestedRole;
  status: RoleRequestStatus;
  reason?: string;
  rejectReason?: string;
  evidenceUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
