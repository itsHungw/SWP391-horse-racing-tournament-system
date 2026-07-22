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
  bankBin: string | null;
  accountNumber: string;
  accountHolder: string;
  label: string | null;
}

export interface BankDirectoryItem {
  code: string;
  bin: string;
  name: string;
  qrSupported: boolean;
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
  bankCode?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  maskedAccountNumber?: string | null;
  reviewNote: string | null;
  reviewedByName: string | null;
  transferReference?: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
}

export type WithdrawalRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type WithdrawalSort = "newest" | "oldest" | "amount_desc" | "risk_desc";

export interface WithdrawalAdminFilters {
  query?: string;
  status?: WithdrawalStatus;
  risk?: WithdrawalRiskLevel;
  from?: string;
  to?: string;
  sort?: WithdrawalSort;
  page: number;
  size: number;
}

export type WithdrawalExportFilters = Omit<WithdrawalAdminFilters, "page" | "size">;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface WithdrawalRiskFinding {
  code: string;
  severity: WithdrawalRiskLevel;
  title: string;
  explanation: string;
  evidence: string;
  suggestedCheck: string;
}

export interface WithdrawalRiskAssessment {
  level: WithdrawalRiskLevel;
  findings: WithdrawalRiskFinding[];
  contextMarkers: string[];
}

export interface AdminWithdrawalRow {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  status: WithdrawalStatus;
  bankCode: string | null;
  bankName: string | null;
  accountHolder: string | null;
  maskedAccountNumber: string;
  risk: WithdrawalRiskAssessment;
  requestedAt: string;
}

export interface AdminWithdrawalSummary {
  needsReview: number;
  readyToPay: number;
  pendingValue: number;
  highRisk: number;
}

export type WithdrawalUserStatus =
  | "ACTIVE"
  | "PENDING_EMAIL_VERIFY"
  | "SUSPENDED"
  | "INACTIVE"
  | "BANNED";

export interface AdminWithdrawalAction {
  id: number;
  action: "CREATED" | "APPROVED" | "REJECTED" | "MARKED_PAID" | "CANCELLED";
  oldStatus: WithdrawalStatus | null;
  newStatus: WithdrawalStatus;
  actorId: number;
  actorName: string;
  publicReason: string | null;
  internalNote: string | null;
  transferReference: string | null;
  riskLevel: WithdrawalRiskLevel;
  createdAt: string;
}

export interface AdminWithdrawalReview {
  id: number;
  amount: number;
  status: WithdrawalStatus;
  requestedAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
  user: {
    id: number;
    name: string;
    email: string;
    status: WithdrawalUserStatus;
    createdAt: string;
  };
  wallet: {
    balance: number;
    status: WalletStatus | null;
  };
  destination: {
    bankCode: string | null;
    bankName: string | null;
    accountHolder: string | null;
    accountNumber: string | null;
    displayText: string;
    legacy: boolean;
  };
  risk: WithdrawalRiskAssessment;
  aggregates: {
    requestCount: number;
    totalRequested: number;
    paidCount: number;
    totalPaid: number;
    rejectedOrCancelledCount: number;
  };
  recentWithdrawals: Array<{
    id: number;
    amount: number;
    status: WithdrawalStatus;
    requestedAt: string;
  }>;
  actions: AdminWithdrawalAction[];
  paymentInstruction: WithdrawalPaymentInstruction | null;
  paymentEvidence: WithdrawalPaymentEvidence | null;
}

export interface WithdrawalPaymentInstruction {
  available: boolean;
  unavailableReason: string | null;
  payload: string | null;
  transferContent: string;
  bankCode: string | null;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  amount: number;
}

export interface WithdrawalPaymentEvidence {
  transferReference: string;
  receiptUrl: string;
  checksum: string;
  paidAt: string;
}

export interface ApproveWithdrawalBody {
  riskAcknowledged: boolean;
  internalNote: string;
}

export interface RejectWithdrawalBody {
  publicReason: string;
  internalNote: string;
}

export interface ConfirmWithdrawalPayment {
  transferReference: string;
  internalNote: string;
  mismatchAcknowledged: boolean;
  idempotencyKey: string;
  receipt: File;
}

export interface WithdrawalExportPreview {
  operationsRows: number;
  paymentQueueRows: number;
  paidReconciliationRows: number;
  containsSensitiveData: boolean;
}

export interface WithdrawalExportDownload {
  blob: Blob;
  filename: string;
}
