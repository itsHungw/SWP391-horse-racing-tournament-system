package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import java.time.LocalDateTime;

public record WithdrawalResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        long amount,
        String status,
        String bankInfo,
        String bankCode,
        String bankName,
        String accountHolder,
        String maskedAccountNumber,
        String reviewNote,
        String reviewedByName,
        LocalDateTime requestedAt,
        LocalDateTime reviewedAt,
        LocalDateTime paidAt
) {
    public static WithdrawalResponse from(WithdrawalRequest request) {
        User user = request.getUser();
        User reviewer = request.getReviewedBy();
        return new WithdrawalResponse(
                request.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getFullName() : null,
                user != null ? user.getEmail() : null,
                request.getAmount(),
                request.getStatus().name(),
                request.getBankInfo(),
                request.getBankCode(),
                request.getBankName(),
                request.getAccountHolder(),
                mask(request.getAccountNumber()),
                request.getReviewNote(),
                reviewer != null ? reviewer.getFullName() : null,
                request.getRequestedAt(),
                request.getReviewedAt(),
                request.getPaidAt()
        );
    }

    private static String mask(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        String normalized = accountNumber.trim();
        if (normalized.length() <= 4) {
            return normalized;
        }
        return "•••• " + normalized.substring(normalized.length() - 4);
    }
}
