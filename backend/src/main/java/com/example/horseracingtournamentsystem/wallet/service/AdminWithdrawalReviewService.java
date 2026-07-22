package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.wallet.dto.AdminWithdrawalReviewResponse;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalActionHistory;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRequest;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalActionHistoryRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminWithdrawalReviewService {

    private final WithdrawalRequestRepository withdrawalRepository;
    private final WithdrawalActionHistoryRepository actionHistoryRepository;
    private final WalletRepository walletRepository;
    private final WithdrawalRiskAssessmentService riskService;

    @Transactional(readOnly = true)
    public AdminWithdrawalReviewResponse get(Long id) {
        WithdrawalRequest withdrawal = withdrawalRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Withdrawal request not found"));
        Long userId = withdrawal.getUser().getId();
        Wallet wallet = walletRepository.findById(userId).orElse(null);

        List<AdminWithdrawalReviewResponse.RecentWithdrawal> recent = withdrawalRepository
                .findTop5ByUserIdOrderByRequestedAtDesc(userId).stream()
                .map(item -> new AdminWithdrawalReviewResponse.RecentWithdrawal(
                        item.getId(), item.getAmount(), item.getStatus(), item.getRequestedAt()))
                .toList();
        List<AdminWithdrawalReviewResponse.Action> actions = actionHistoryRepository
                .findByWithdrawalIdOrderByCreatedAtAscIdAsc(id).stream()
                .map(this::action)
                .toList();

        return new AdminWithdrawalReviewResponse(
                withdrawal.getId(),
                withdrawal.getAmount(),
                withdrawal.getStatus(),
                withdrawal.getRequestedAt(),
                withdrawal.getReviewedAt(),
                withdrawal.getPaidAt(),
                new AdminWithdrawalReviewResponse.UserContext(
                        userId,
                        withdrawal.getUser().getFullName(),
                        withdrawal.getUser().getEmail(),
                        withdrawal.getUser().getStatus(),
                        withdrawal.getUser().getCreatedAt()),
                new AdminWithdrawalReviewResponse.WalletContext(
                        wallet == null ? 0L : wallet.getBalance(),
                        wallet == null ? null : wallet.getStatus()),
                new AdminWithdrawalReviewResponse.Destination(
                        withdrawal.getBankCode(),
                        withdrawal.getBankName(),
                        withdrawal.getAccountHolder(),
                        withdrawal.getAccountNumber(),
                        withdrawal.getBankInfo(),
                        withdrawal.getBankCode() == null || withdrawal.getAccountNumber() == null),
                riskService.assess(withdrawal),
                aggregates(userId),
                recent,
                actions);
    }

    private AdminWithdrawalReviewResponse.Aggregates aggregates(Long userId) {
        return new AdminWithdrawalReviewResponse.Aggregates(
                withdrawalRepository.countByUserId(userId),
                withdrawalRepository.sumAmountByUser(userId),
                withdrawalRepository.countByUserIdAndStatus(userId, WithdrawalStatus.PAID),
                withdrawalRepository.sumAmountByUserAndStatusIn(userId, List.of(WithdrawalStatus.PAID)),
                withdrawalRepository.countByUserIdAndStatusIn(
                        userId, List.of(WithdrawalStatus.REJECTED, WithdrawalStatus.CANCELLED)));
    }

    private AdminWithdrawalReviewResponse.Action action(WithdrawalActionHistory history) {
        return new AdminWithdrawalReviewResponse.Action(
                history.getId(),
                history.getAction(),
                history.getOldStatus(),
                history.getNewStatus(),
                history.getActor().getId(),
                history.getActorName(),
                history.getPublicReason(),
                history.getInternalNote(),
                history.getTransferReference(),
                history.getRiskLevel(),
                history.getCreatedAt());
    }
}
