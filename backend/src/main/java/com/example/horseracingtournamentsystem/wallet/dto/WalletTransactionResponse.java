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
    public static WalletTransactionResponse from(WalletTransaction transaction) {
        return new WalletTransactionResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getTransactionType().name(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getBalanceAfter(),
                UserLedgerDescription.of(transaction),
                transaction.getCreatedAt()
        );
    }
}
