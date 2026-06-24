package com.example.horseracingtournamentsystem.wallet.service;

import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.dto.WalletSummaryResponse;
import com.example.horseracingtournamentsystem.wallet.entity.Wallet;
import com.example.horseracingtournamentsystem.wallet.entity.WalletStatus;
import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalStatus;
import com.example.horseracingtournamentsystem.wallet.repository.WalletRepository;
import com.example.horseracingtournamentsystem.wallet.repository.WithdrawalRequestRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Tổng hợp trạng thái tiền cho dải hero (available / in-play / pending). */
@Service
@RequiredArgsConstructor
public class WalletSummaryService {

    private final WalletRepository walletRepository;
    private final RacePredictionRepository racePredictionRepository;
    private final StreakPredictionRepository streakPredictionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;

    @Transactional(readOnly = true)
    public WalletSummaryResponse getSummary(User user) {
        Wallet wallet = walletRepository.findById(user.getId()).orElse(null);
        long balance = wallet != null ? wallet.getBalance() : 0L;
        String status = wallet != null ? wallet.getStatus().name() : WalletStatus.ACTIVE.name();

        long inPlay = racePredictionRepository.sumOpenStakeBySpectator(user.getId())
                + streakPredictionRepository.sumOpenStakeBySpectator(user.getId());
        long pendingWithdrawal = withdrawalRequestRepository.sumAmountByUserAndStatusIn(
                user.getId(), List.of(WithdrawalStatus.REQUESTED, WithdrawalStatus.APPROVED));

        return new WalletSummaryResponse(balance, status, inPlay, pendingWithdrawal);
    }
}
