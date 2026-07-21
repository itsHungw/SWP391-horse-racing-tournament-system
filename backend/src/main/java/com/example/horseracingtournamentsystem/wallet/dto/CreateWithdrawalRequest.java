package com.example.horseracingtournamentsystem.wallet.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateWithdrawalRequest(
        @Positive long amount,
        @NotNull Long bankAccountId
) {
}
