export type RoleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RequestedRole = 'HORSE_OWNER' | 'JOCKEY' | 'REFEREE';

export interface RoleRequest {
  id: number;
  userId: number;
  userEmail?: string;
  requestedRole: RequestedRole;
  status: RoleRequestStatus;
  rejectReason?: string;
  createdAt: string;
  updatedAt?: string;
}
