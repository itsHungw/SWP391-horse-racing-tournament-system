package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.UserBankAccount;

public record BankAccountResponse(
        Long id,
        String bankCode,
        String bankName,
        String bankBin,
        String accountNumber,
        String accountHolder,
        String label
) {
    public static BankAccountResponse from(UserBankAccount account) {
        return new BankAccountResponse(
                account.getId(),
                account.getBankCode(),
                account.getBankName(),
                account.getBankBin(),
                account.getAccountNumber(),
                account.getAccountHolder(),
                account.getLabel()
        );
    }
}
