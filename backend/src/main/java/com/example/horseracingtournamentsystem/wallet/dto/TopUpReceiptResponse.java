package com.example.horseracingtournamentsystem.wallet.dto;

import java.time.LocalDateTime;

public record TopUpReceiptResponse(
        String txnRef,
        /** Mã giao dịch phía VNPay. Null khi đơn chưa/không thành công. */
        String transactionNo,
        ReceiptStatus status,
        long amount,
        Long balanceAfter,
        Long walletTransactionId,
        LocalDateTime processedAt,
        String failureReason) {
    public enum ReceiptStatus { PENDING, SUCCESS, FAILED }
}
