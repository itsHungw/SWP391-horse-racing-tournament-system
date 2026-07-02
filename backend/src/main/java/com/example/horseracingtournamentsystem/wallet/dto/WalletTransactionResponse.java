package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import java.time.LocalDateTime;

public record WalletTransactionResponse(
        Long id,
        long amount,
        String type,
        String referenceType,
        Long referenceId,
        Long balanceAfter,
        String description,
        LocalDateTime createdAt
) {
    public static WalletTransactionResponse from(WalletTransaction tx) {
        return new WalletTransactionResponse(
                tx.getId(),
                tx.getAmount(),
                tx.getTransactionType().name(),
                tx.getReferenceType(),
                tx.getReferenceId(),
                tx.getBalanceAfter(),
                tx.getDescription(),
                tx.getCreatedAt()
        );
    }
}
