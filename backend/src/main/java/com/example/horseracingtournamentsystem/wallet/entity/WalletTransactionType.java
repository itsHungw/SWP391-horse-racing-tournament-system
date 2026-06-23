package com.example.horseracingtournamentsystem.wallet.entity;

/**
 * Loại bút toán ví (tiền thật VND). Đã gỡ FIRST_LOGIN_BONUS và BLOG_REWARD khi
 * loại bỏ gamification điểm.
 */
public enum WalletTransactionType {
    TOPUP,              // nạp VNPay -> +cash
    BET_PLACED,         // đặt cược -> -cash
    BET_PAYOUT,         // thắng cược -> +cash
    BET_REFUND,         // hủy race / ngựa rút / lỗi hệ thống -> +cash
    WITHDRAWAL_HOLD,    // tạo yêu cầu rút -> -cash (giữ tiền)
    WITHDRAWAL_REFUND,  // từ chối rút -> +cash
    ADMIN_ADJUSTMENT    // điều chỉnh thủ công
}
