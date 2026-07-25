package com.example.horseracingtournamentsystem.finance.dto;

public record AdminFinanceReconciliationSummary(
        long missingWalletCredits,
        long amountMismatches,
        long unexpectedWalletCredits,
        long orphanWalletCredits,
        long stalePendingOrders
) {
}
