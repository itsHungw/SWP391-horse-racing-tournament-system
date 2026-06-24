package com.example.horseracingtournamentsystem.wallet.entity;

/** Vòng đời yêu cầu rút tiền (BA Mục 5.2). */
public enum WithdrawalStatus {
    REQUESTED,
    APPROVED,
    REJECTED,
    PAID,
    CANCELLED
}
