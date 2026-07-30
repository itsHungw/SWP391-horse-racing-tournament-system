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
  lastLoginAt?: string | null;
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
}

export type AccountEnforcementAction = "suspend" | "restore" | "ban" | "reopen";

export interface AccountStatusHistoryItem {
  id: number;
  oldStatus: string;
  newStatus: string;
  publicReason: string;
  internalNote?: string;
  changedById: number;
  changedByName: string;
  changedAt: string;
  walletLocked: boolean;
}

export interface AccountTransitionRequest {
  reason: string;
  internalNote?: string;
  lockWallet?: boolean;
}

export interface WalletControl {
  userId: number;
  walletStatus: "ACTIVE" | "LOCKED";
  canWithdraw: boolean;
  balance: number;
}

export interface AdminWalletCreditResponse {
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface AdminWalletTransaction {
  id: number;
  amount: number;
  type: string;
  referenceType?: string | null;
  referenceId?: number | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  description?: string | null;
  createdAt: string;
}

export interface WalletStatusHistoryItem {
  id: number;
  oldStatus: "ACTIVE" | "LOCKED";
  newStatus: "ACTIVE" | "LOCKED";
  publicReason: string;
  internalNote?: string;
  changedById: number;
  changedByName: string;
  changedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
