package com.example.horseracingtournamentsystem.wallet.dto;

import java.time.LocalDateTime;

public record WithdrawalPaymentEvidenceResponse(
        String transferReference,
        String receiptUrl,
        String checksum,
        LocalDateTime paidAt
) {
}
