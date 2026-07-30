package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import java.time.LocalDateTime;

public record AdminWalletTransactionResponse(
        Long id,
        long amount,
        String type,
        String referenceType,
        Long referenceId,
        Long balanceBefore,
        Long balanceAfter,
        String description,
        LocalDateTime createdAt
) {
    public static AdminWalletTransactionResponse from(WalletTransaction transaction) {
        Long balanceAfter = transaction.getBalanceAfter();
        return new AdminWalletTransactionResponse(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getTransactionType().name(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                balanceAfter == null ? null : balanceAfter - transaction.getAmount(),
                balanceAfter,
                transaction.getDescription(),
                transaction.getCreatedAt()
        );
    }
}
