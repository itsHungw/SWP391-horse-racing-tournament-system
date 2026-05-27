export interface AdminUserDetail {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  status: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface UserRoleHistoryItem {
  id: number;
  roleName: string;
  oldStatus?: string;
  newStatus: string;
  changedAt: string;
  reason?: string;
  changedBy?: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface CreateUserAdminRequest {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  roleIds: number[];
}

export interface UpdateUserProfileAdminRequest {
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
