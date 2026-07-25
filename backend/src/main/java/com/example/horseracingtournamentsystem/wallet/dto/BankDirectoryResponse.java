package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.BankDirectory;

public record BankDirectoryResponse(
        String code,
        String bin,
        String name,
        boolean qrSupported
) {
    public static BankDirectoryResponse from(BankDirectory bank) {
        return new BankDirectoryResponse(
                bank.getCode(), bank.getBin(), bank.getDisplayName(), bank.isQrSupported());
    }
}
