package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import java.time.LocalDateTime;

public record AdminWithdrawalRowResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        long amount,
        WithdrawalStatus status,
        String bankCode,
        String bankName,
        String accountHolder,
        String maskedAccountNumber,
        WithdrawalRiskAssessmentResponse risk,
        LocalDateTime requestedAt
) {
    public static AdminWithdrawalRowResponse from(
            WithdrawalRequest withdrawal,
            WithdrawalRiskAssessmentResponse risk
    ) {
        return new AdminWithdrawalRowResponse(
                withdrawal.getId(),
                withdrawal.getUser().getId(),
                withdrawal.getUser().getFullName(),
                withdrawal.getUser().getEmail(),
                withdrawal.getAmount(),
                withdrawal.getStatus(),
                withdrawal.getBankCode(),
                withdrawal.getBankName(),
                withdrawal.getAccountHolder(),
                mask(withdrawal.getAccountNumber()),
                risk,
                withdrawal.getRequestedAt());
    }

    private static String mask(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return "Legacy destination";
        }
        String normalized = accountNumber.trim();
        return normalized.length() <= 4
                ? normalized
                : "\u2022\u2022\u2022\u2022 " + normalized.substring(normalized.length() - 4);
    }
}
