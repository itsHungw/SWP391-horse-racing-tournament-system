package com.example.horseracingtournamentsystem.wallet.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record AdminWalletCreditRequest(
        @Positive @Max(50_000_000) long amount,
        @NotBlank String reason
) {
}
