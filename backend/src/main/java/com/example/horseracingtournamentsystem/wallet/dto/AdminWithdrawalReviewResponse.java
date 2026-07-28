package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionType;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import java.time.LocalDateTime;
import java.util.List;

public record AdminWithdrawalReviewResponse(
        Long id,
        long amount,
        WithdrawalStatus status,
        LocalDateTime requestedAt,
        LocalDateTime reviewedAt,
        LocalDateTime paidAt,
        UserContext user,
        WalletContext wallet,
        Destination destination,
        WithdrawalRiskAssessmentResponse risk,
        Aggregates aggregates,
        List<RecentWithdrawal> recentWithdrawals,
        List<Action> actions,
        WithdrawalPaymentInstructionResponse paymentInstruction,
        WithdrawalPaymentEvidenceResponse paymentEvidence
) {
    public record UserContext(
            Long id,
            String name,
            String email,
            UserStatus status,
            LocalDateTime createdAt
    ) {
    }

    public record WalletContext(long balance, WalletStatus status) {
    }

    public record Destination(
            String bankCode,
            String bankName,
            String accountHolder,
            String accountNumber,
            String displayText,
            boolean legacy
    ) {
    }

    public record Aggregates(
            long requestCount,
            long totalRequested,
            long paidCount,
            long totalPaid,
            long rejectedOrCancelledCount
    ) {
    }

    public record RecentWithdrawal(
            Long id,
            long amount,
            WithdrawalStatus status,
            LocalDateTime requestedAt
    ) {
    }

    public record Action(
            Long id,
            WithdrawalActionType action,
            WithdrawalStatus oldStatus,
            WithdrawalStatus newStatus,
            Long actorId,
            String actorName,
            String publicReason,
            String internalNote,
            String transferReference,
            WithdrawalRiskLevel riskLevel,
            WithdrawalRiskAssessmentResponse riskSnapshot,
            LocalDateTime createdAt
    ) {
    }
}
