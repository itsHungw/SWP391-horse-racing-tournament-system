package com.example.horseracingtournamentsystem.finance.dto;

public enum FinanceReconciliationStatus {
    MISSING_WALLET_CREDIT,
    AMOUNT_MISMATCH,
    UNEXPECTED_WALLET_CREDIT,
    ORPHAN_WALLET_CREDIT,
    STALE_PENDING
}
