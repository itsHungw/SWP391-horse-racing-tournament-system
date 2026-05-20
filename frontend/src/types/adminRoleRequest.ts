export interface RoleRequest {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  requestedRole: 'JOCKEY' | 'OWNER' | 'REFEREE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason: string;
  evidenceUrl?: string;
  adminNote?: string;
  createdAt: string;
}
