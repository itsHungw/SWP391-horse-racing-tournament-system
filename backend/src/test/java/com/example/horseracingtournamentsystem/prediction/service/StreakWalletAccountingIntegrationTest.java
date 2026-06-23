package com.example.horseracingtournamentsystem.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.example.horseracingtournamentsystem.point.entity.PointTransaction;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.point.service.PointAccountService;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class StreakPointAccountingIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private PointAccountService pointsService;
    @Autowired private PointTransactionRepository transactionRepository;

    @Test
    void raceAndStreakWithSameNumericIdHaveIndependentLedgerEntries() {
        User spectator = User.pending("Streak Spectator", "streak-ledger@test.local", "hash");
        spectator.verifyEmail();
        spectator = userRepository.save(spectator);
        pointsService.initializeAccount(spectator, 100_000);

        pointsService.adjustPoints(
                spectator, -10_000, PointTransactionType.PREDICTION_ENTRY,
                PointTransaction.REF_RACE_PREDICTION, 1L, "Race wager");
        pointsService.adjustPoints(
                spectator, -20_000, PointTransactionType.PREDICTION_ENTRY,
                PointTransaction.REF_STREAK_PREDICTION, 1L, "Streak wager");
        pointsService.adjustPoints(
                spectator, 15_000, PointTransactionType.PREDICTION_REWARD,
                PointTransaction.REF_RACE_PREDICTION, 1L, "Race payout");
        pointsService.adjustPoints(
                spectator, 50_000, PointTransactionType.PREDICTION_REWARD,
                PointTransaction.REF_STREAK_PREDICTION, 1L, "Streak payout");

        assertEquals(135_000, pointsService.getBalance(spectator.getId()));
        assertEquals(4, transactionRepository.findByUserIdOrderByCreatedAtDesc(spectator.getId()).size());

        pointsService.adjustPoints(
                spectator, 50_000, PointTransactionType.PREDICTION_REWARD,
                PointTransaction.REF_STREAK_PREDICTION, 1L, "Duplicate streak payout");

        assertEquals(135_000, pointsService.getBalance(spectator.getId()));
        assertEquals(4, transactionRepository.findByUserIdOrderByCreatedAtDesc(spectator.getId()).size());
    }
}
