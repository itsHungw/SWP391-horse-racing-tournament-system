package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;

public record WithdrawalPaymentInstructionResponse(
        boolean available,
        String unavailableReason,
        String payload,
        String transferContent,
        String bankCode,
        String bankName,
        String accountHolder,
        String accountNumber,
        long amount
) {
    public static WithdrawalPaymentInstructionResponse qr(
            String payload,
            String transferContent,
            WithdrawalRequest request
    ) {
        return from(true, null, payload, transferContent, request);
    }

    public static WithdrawalPaymentInstructionResponse manual(
            String unavailableReason,
            String transferContent,
            WithdrawalRequest request
    ) {
        return from(false, unavailableReason, null, transferContent, request);
    }

    private static WithdrawalPaymentInstructionResponse from(
            boolean available,
            String unavailableReason,
            String payload,
            String transferContent,
            WithdrawalRequest request
    ) {
        return new WithdrawalPaymentInstructionResponse(
                available,
                unavailableReason,
                payload,
                transferContent,
                request.getBankCode(),
                request.getBankName(),
                request.getAccountHolder(),
                request.getAccountNumber(),
                request.getAmount());
    }
}
