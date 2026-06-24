package com.example.horseracingtournamentsystem.wallet.entity;

/**
 * Trạng thái ví. {@code LOCKED} cho phép Admin đóng băng ví khi nghi gian lận /
 * chargeback / KYC fail — mọi thao tác cộng/trừ tiền bị chặn.
 */
public enum WalletStatus {
    ACTIVE,
    LOCKED
}
