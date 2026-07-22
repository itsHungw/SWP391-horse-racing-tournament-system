package com.example.horseracingtournamentsystem.wallet.dto;

public record WithdrawalExportPreviewResponse(
        int operationsRows,
        int reconciliationRows,
        boolean containsSensitiveData
) {
}
