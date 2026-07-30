import type { WalletTransactionType } from "../../types/wallet";

/** Dùng chung giữa bảng ledger và modal chi tiết — để thêm một loại bút toán chỉ phải sửa một chỗ. */
export const TX_LABEL: Record<WalletTransactionType, string> = {
  TOPUP: "Top-up",
  BET_PLACED: "Prediction entry",
  BET_PAYOUT: "Race payout",
  BET_REFUND: "Prediction refund",
  WITHDRAWAL_HOLD: "Withdrawal hold",
  WITHDRAWAL_REFUND: "Withdrawal refund",
  ADMIN_ADJUSTMENT: "Adjustment",
};

/** `vnp_CardType` của VNPay. Mã lạ thì hiện nguyên trạng thay vì nuốt mất thông tin. */
export function cardTypeLabel(code: string): string {
  const known: Record<string, string> = {
    ATM: "Domestic ATM card",
    QRCODE: "QR code",
    IntCard: "International card",
  };
  return known[code] ?? code;
}
