package com.example.horseracingtournamentsystem.finance.dto;

import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import java.time.Instant;

public record AdminTopUpReconciliationResponse(
        Long id,
        Long userId,
        String userEmail,
        String userName,
        long amount,
        TopUpStatus status,
        String vnpayTxnRef,
        String vnpayTransactionNo,
        String vnpayResponseCode,
        Instant createdAt,
        Instant paidAt,
        Long walletTransactionId,
        Long walletCreditAmount,
        String reconciliationStatus
) {
}
