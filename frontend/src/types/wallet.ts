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

export interface WalletSummary {
  balance: number;
  status: WalletStatus;
  inPlay: number;
  pendingWithdrawal: number;
}

export interface TopUpReceipt {
  txnRef: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: number;
  balanceAfter: number | null;
  walletTransactionId: number | null;
  processedAt: string | null;
  failureReason: string | null;
}

export interface BankAccount {
  id: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  label: string | null;
}

export type WithdrawalStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";

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
