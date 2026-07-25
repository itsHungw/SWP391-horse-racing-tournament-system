import type { WalletTransactionType } from "./wallet";

export type { WalletTransactionType };

export type FinanceRange = { from: string; to: string };

export interface AdminFinanceSummary extends FinanceRange {
  settledWagers: number;
  payouts: number;
  refunds: number;
  ggr: number;
  ggrMargin: number;
  successfulTopUps: number;
  paidWithdrawals: number;
  netCashMovement: number;
  walletLiability: number;
  previousSettledWagers: number;
  previousPayouts: number;
  previousGgr: number;
  ggrChangePercent: number;
}

export type FinanceReconciliationIssue =
  | "MISSING_WALLET_CREDIT"
  | "AMOUNT_MISMATCH"
  | "UNEXPECTED_WALLET_CREDIT"
  | "ORPHAN_WALLET_CREDIT"
  | "STALE_PENDING";

export interface AdminFinanceReconciliationSummary {
  missingWalletCredits: number;
  amountMismatches: number;
  unexpectedWalletCredits: number;
  orphanWalletCredits: number;
  stalePendingOrders: number;
}

export interface AdminFinanceTransaction {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  amount: number;
  balanceBefore: number | null;
  balanceAfter: number | null;
  transactionType: WalletTransactionType;
  referenceType: string | null;
  referenceId: number | null;
  description: string | null;
  createdAt: string;
  sourceStatus?: string | null;
  sourceTrace?: string | null;
}

export type TopUpStatus = "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

export interface AdminTopUpReconciliation {
  id: number;
  userId: number;
  userEmail: string;
  userName: string;
  amount: number;
  status: TopUpStatus;
  vnpayTxnRef: string;
  vnpayTransactionNo: string | null;
  vnpayResponseCode: string | null;
  createdAt: string;
  paidAt: string | null;
  walletTransactionId: number | null;
  walletCreditAmount: number | null;
  reconciliationStatus:
    | "MATCHED"
    | "MISSING_WALLET_CREDIT"
    | "AMOUNT_MISMATCH"
    | "UNEXPECTED_WALLET_CREDIT"
    | "STALE_PENDING"
    | TopUpStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FinanceTransactionFilters extends FinanceRange {
  query?: string;
  type?: WalletTransactionType;
  referenceType?: string;
  referenceId?: number;
  userId?: number;
  minAmount?: number;
  maxAmount?: number;
  page: number;
  size: number;
}

export interface FinanceTopUpFilters extends FinanceRange {
  query?: string;
  status?: TopUpStatus;
  reconciliationStatus?: FinanceReconciliationIssue;
  page: number;
  size: number;
}

export interface FinanceExportDownload {
  blob: Blob;
  filename: string;
}
