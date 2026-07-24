package com.example.horseracingtournamentsystem.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdminFinanceResponse(
        LocalDate from,
        LocalDate to,
        long settledWagers,
        long payouts,
        long refunds,
        long ggr,
        BigDecimal ggrMargin,
        long successfulTopUps,
        long paidWithdrawals,
        long netCashMovement,
        long walletLiability,
        long previousSettledWagers,
        long previousPayouts,
        long previousGgr,
        BigDecimal ggrChangePercent
) {
}
