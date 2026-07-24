package com.example.horseracingtournamentsystem.finance.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import java.time.LocalDateTime;

public record AdminFinanceTransactionResponse(
        Long id,
        Long userId,
        String userEmail,
        String userName,
        long amount,
        Long balanceBefore,
        Long balanceAfter,
        WalletTransactionType transactionType,
        String referenceType,
        Long referenceId,
        String description,
        LocalDateTime createdAt,
        String sourceStatus,
        String sourceTrace
) {
    public static AdminFinanceTransactionResponse from(WalletTransaction transaction) {
        Long after = transaction.getBalanceAfter();
        Long before = after == null ? null : Math.subtractExact(after, transaction.getAmount());
        return new AdminFinanceTransactionResponse(
                transaction.getId(),
                transaction.getUser().getId(),
                transaction.getUser().getEmail(),
                transaction.getUser().getFullName(),
                transaction.getAmount(),
                before,
                after,
                transaction.getTransactionType(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getDescription(),
                transaction.getCreatedAt(),
                null,
                null
        );
    }

    public AdminFinanceTransactionResponse withSource(String status, String trace) {
        return new AdminFinanceTransactionResponse(
                id, userId, userEmail, userName, amount, balanceBefore, balanceAfter,
                transactionType, referenceType, referenceId, description, createdAt, status, trace);
    }
}
