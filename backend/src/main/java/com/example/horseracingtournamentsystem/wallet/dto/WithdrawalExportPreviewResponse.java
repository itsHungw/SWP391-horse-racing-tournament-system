package com.example.horseracingtournamentsystem.wallet.dto;

public record WithdrawalExportPreviewResponse(
        int operationsRows,
        int paymentQueueRows,
        int paidReconciliationRows,
        boolean containsSensitiveData
) {
}
