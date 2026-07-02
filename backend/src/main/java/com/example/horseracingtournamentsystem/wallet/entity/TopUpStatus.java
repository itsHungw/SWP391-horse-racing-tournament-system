package com.example.horseracingtournamentsystem.wallet.entity;

/** Vòng đời đơn nạp tiền VNPay (xem BA Mục 5.1). */
public enum TopUpStatus {
    INITIATED,
    PENDING,
    SUCCESS,
    FAILED,
    EXPIRED
}
