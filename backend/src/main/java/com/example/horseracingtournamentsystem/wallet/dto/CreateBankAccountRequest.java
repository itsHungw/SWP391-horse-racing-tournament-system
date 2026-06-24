package com.example.horseracingtournamentsystem.wallet.dto;

public record CreateBankAccountRequest(
        String bankCode,
        String bankName,
        String accountNumber,
        String accountHolder,
        String label
) {
}
