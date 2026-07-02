package com.example.horseracingtournamentsystem.wallet.dto;

/**
 * Trạng thái tiền cho dải hero (kiểu Stripe available/pending):
 * {@code balance} = rút/cược được; {@code inPlay} = đang đặt trong kèo mở;
 * {@code pendingWithdrawal} = đang giữ chờ chi.
 */
public record WalletSummaryResponse(
        long balance,
        String status,
        long inPlay,
        long pendingWithdrawal
) {
}
