export interface AdminRoleRequestUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  status?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  ageVerified?: boolean;
  profileCompleted?: boolean;
  roles?: string[];
  createdAt?: string | null;
  lastLoginAt?: string | null;
}

export interface AdminRoleRequestReviewer {
  id: number;
  fullName: string;
  email: string;
}

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
  reviewedAt?: string | null;
  reviewedBy?: AdminRoleRequestReviewer | null;
  user?: AdminRoleRequestUser | null;
}
