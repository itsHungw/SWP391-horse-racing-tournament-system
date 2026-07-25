package com.example.horseracingtournamentsystem.wallet.dto;

public record AdminWithdrawalSummaryResponse(
        long needsReview,
        long readyToPay,
        long pendingValue,
        long highRisk
) {
}
