package com.example.horseracingtournamentsystem.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MarkWithdrawalPaidRequest(
        @NotBlank @Size(max = 120) String transferReference,
        @Size(max = 1000) String internalNote
) {
}
