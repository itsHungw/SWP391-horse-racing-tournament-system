package com.example.horseracingtournamentsystem.wallet.dto;

public record AdminWalletCreditResponse(
        long amount,
        long balanceBefore,
        long balanceAfter
) {
}
