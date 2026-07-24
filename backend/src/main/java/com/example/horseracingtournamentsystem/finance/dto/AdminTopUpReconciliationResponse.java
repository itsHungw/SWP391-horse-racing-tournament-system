package com.example.horseracingtournamentsystem.finance.dto;

import com.example.horseracingtournamentsystem.wallet.entity.TopUpStatus;
import java.time.LocalDateTime;

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
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        Long walletTransactionId,
        Long walletCreditAmount,
        String reconciliationStatus
) {
}
