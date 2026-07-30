package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;

public record WalletControlResponse(Long userId, WalletStatus walletStatus, boolean canWithdraw, long balance) {
    public static WalletControlResponse of(Long userId, WalletStatus status, long balance) {
        return new WalletControlResponse(userId, status, status == WalletStatus.ACTIVE, balance);
    }
}
