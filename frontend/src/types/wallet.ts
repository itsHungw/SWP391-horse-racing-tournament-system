export type WalletStatus = "ACTIVE" | "LOCKED";

export interface Wallet {
  userId: number;
  balance: number;
  status: WalletStatus;
}

export type WalletTransactionType =
  | "TOPUP"
  | "BET_PLACED"
  | "BET_PAYOUT"
  | "BET_REFUND"
  | "WITHDRAWAL_HOLD"
  | "WITHDRAWAL_REFUND"
  | "ADMIN_ADJUSTMENT";

export interface WalletTransaction {
  id: number;
  amount: number;
  type: WalletTransactionType;
  referenceType: string | null;
  referenceId: number | null;
  balanceAfter: number | null;
  description: string | null;
  createdAt: string;
}

export type WithdrawalStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PAID";

export interface Withdrawal {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  amount: number;
  status: WithdrawalStatus;
  bankInfo: string;
  reviewNote: string | null;
  reviewedByName: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
}
