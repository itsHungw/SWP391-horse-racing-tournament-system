package com.example.horseracingtournamentsystem.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectWithdrawalRequest(
        @NotBlank @Size(max = 500) String publicReason,
        @Size(max = 1000) String internalNote,
        Boolean noTransferConfirmed
) {
}
