package com.example.horseracingtournamentsystem.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.repository.WalletTransactionRepository;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class StreakWalletAccountingIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private WalletService walletService;
    @Autowired private WalletTransactionRepository transactionRepository;

    @Test
    void raceAndStreakWithSameNumericIdHaveIndependentLedgerEntries() {
        User spectator = User.pending("Streak Spectator", "streak-ledger@test.local", "hash");
        spectator.verifyEmail();
        spectator = userRepository.save(spectator);
        walletService.initializeAccount(spectator, 100_000L);

        walletService.adjust(
                spectator, -10_000L, WalletTransactionType.BET_PLACED,
                WalletTransaction.REF_RACE_PREDICTION, 1L, "Race wager");
        walletService.adjust(
                spectator, -20_000L, WalletTransactionType.BET_PLACED,
                WalletTransaction.REF_STREAK_PREDICTION, 1L, "Streak wager");
        walletService.adjust(
                spectator, 15_000L, WalletTransactionType.BET_PAYOUT,
                WalletTransaction.REF_RACE_PREDICTION, 1L, "Race payout");
        walletService.adjust(
                spectator, 50_000L, WalletTransactionType.BET_PAYOUT,
                WalletTransaction.REF_STREAK_PREDICTION, 1L, "Streak payout");

        assertEquals(135_000L, walletService.getBalance(spectator.getId()));
        assertEquals(4, transactionRepository.findByUserIdOrderByCreatedAtDesc(spectator.getId()).size());

        walletService.adjust(
                spectator, 50_000L, WalletTransactionType.BET_PAYOUT,
                WalletTransaction.REF_STREAK_PREDICTION, 1L, "Duplicate streak payout");

        assertEquals(135_000L, walletService.getBalance(spectator.getId()));
        assertEquals(4, transactionRepository.findByUserIdOrderByCreatedAtDesc(spectator.getId()).size());
    }
}
