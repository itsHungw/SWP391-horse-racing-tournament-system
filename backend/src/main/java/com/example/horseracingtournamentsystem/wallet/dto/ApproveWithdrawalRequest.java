package com.example.horseracingtournamentsystem.wallet.dto;

import jakarta.validation.constraints.Size;

public record ApproveWithdrawalRequest(
        boolean riskAcknowledged,
        @Size(max = 1000) String internalNote
) {
}
