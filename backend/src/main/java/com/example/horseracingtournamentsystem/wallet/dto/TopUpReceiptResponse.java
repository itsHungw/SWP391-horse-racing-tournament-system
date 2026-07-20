package com.example.horseracingtournamentsystem.wallet.dto;

import java.time.LocalDateTime;

public record TopUpReceiptResponse(
        String txnRef,
        ReceiptStatus status,
        long amount,
        Long balanceAfter,
        Long walletTransactionId,
        LocalDateTime processedAt,
        String failureReason) {
    public enum ReceiptStatus { PENDING, SUCCESS, FAILED }
}
