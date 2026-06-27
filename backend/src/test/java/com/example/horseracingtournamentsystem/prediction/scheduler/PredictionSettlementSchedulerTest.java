package com.example.horseracingtournamentsystem.prediction.scheduler;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.prediction.entity.PredictionSettlementJob;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPredictionLeg;
import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.result.entity.RaceResult;
import com.example.horseracingtournamentsystem.result.enums.ResultFinishStatus;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.user.entity.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PredictionSettlementSchedulerTest {

    @Mock private PredictionSettlementJobRepository jobRepository;
    @Mock private RacePredictionRepository predictionRepository;
    @Mock private RaceResultRepository resultRepository;
    @Mock private WalletService walletService;
    @Mock private StreakPredictionRepository streakRepository;
    @Mock private StreakPredictionLegRepository streakLegRepository;

    private PredictionSettlementScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new PredictionSettlementScheduler(
                jobRepository, predictionRepository, resultRepository,
                walletService, streakRepository, streakLegRepository);
        org.springframework.test.util.ReflectionTestUtils.setField(scheduler, "takeoutRate", new BigDecimal("0.15"));
        org.springframework.test.util.ReflectionTestUtils.setField(scheduler, "streakTakeout", new BigDecimal("0.20"));
        org.springframework.test.util.ReflectionTestUtils.setField(scheduler, "maxTotalOdds", new BigDecimal("100"));
        org.springframework.test.util.ReflectionTestUtils.setField(scheduler, "maxPayout", 1_000_000_000L);
    }

    @Test
    void winningStreakPaysWagerTimesMultiplicativeOddsWithSingleMargin() {
        Fixture fixture = fixture(ResultFinishStatus.FINISHED, 1);

        scheduler.processJob(9L);
        scheduler.processJob(9L);

        assertEquals(StreakPredictionStatus.WON, fixture.streak().getStatus());
        // 1.50 * 2.25 = 3.375 ; * (1 - 0.20 streak takeout) = 2.70
        assertEquals(new BigDecimal("2.70"), fixture.streak().getTotalOdds());
        assertEquals(27_000L, fixture.streak().getRewardPoints());
        verify(walletService, times(1)).adjust(
                eq(fixture.spectator()), eq(27_000L),
                eq(WalletTransactionType.BET_PAYOUT),
                eq(WalletTransaction.REF_STREAK_PREDICTION),
                eq(51L), anyString());
    }

    @Test
    void voidedLegDropsOutOfTheMultiplier() {
        Fixture fixture = fixture(ResultFinishStatus.WITHDRAWN, null);

        scheduler.processJob(9L);

        assertEquals(StreakPredictionStatus.REFUNDED, fixture.currentLeg().getStatus());
        assertEquals(BigDecimal.ZERO, fixture.currentLeg().getLockedOdds());
        // only the surviving 1.50 leg counts ; * (1 - 0.20) = 1.20  (void leg = factor 1.0, not added)
        assertEquals(new BigDecimal("1.20"), fixture.streak().getTotalOdds());
        assertEquals(12_000L, fixture.streak().getRewardPoints());
        verify(walletService).adjust(
                eq(fixture.spectator()), eq(12_000L),
                eq(WalletTransactionType.BET_PAYOUT),
                eq(WalletTransaction.REF_STREAK_PREDICTION),
                eq(51L), anyString());
    }

    private Fixture fixture(ResultFinishStatus finishStatus, Integer position) {
        User spectator = mock(User.class);
        Tournament tournament = mock(Tournament.class);
        Race previousRace = mock(Race.class);
        Race currentRace = mock(Race.class);
        RaceParticipant previousWinner = mock(RaceParticipant.class);
        RaceParticipant currentWinner = participant(1002L);

        when(currentRace.getId()).thenReturn(202L);

        StreakPrediction streak = StreakPrediction.builder()
                .id(51L)
                .spectator(spectator)
                .tournament(tournament)
                .wagerAmount(10_000L)
                .totalOdds(new BigDecimal("3.75"))
                .status(StreakPredictionStatus.PENDING)
                .build();
        StreakPredictionLeg previousLeg = StreakPredictionLeg.builder()
                .id(61L).race(previousRace).predictedWinner(previousWinner)
                .lockedOdds(new BigDecimal("1.50"))
                .status(StreakPredictionStatus.WON).build();
        StreakPredictionLeg currentLeg = StreakPredictionLeg.builder()
                .id(62L).race(currentRace).predictedWinner(currentWinner)
                .lockedOdds(new BigDecimal("2.25"))
                .status(StreakPredictionStatus.PENDING).build();
        streak.addLeg(previousLeg);
        streak.addLeg(currentLeg);

        PredictionSettlementJob job = PredictionSettlementJob.create(currentRace);
        RaceResult result = mock(RaceResult.class);
        when(result.getParticipantId()).thenReturn(1002L);
        when(result.getPosition()).thenReturn(position);
        when(result.getResultStatus()).thenReturn(finishStatus);

        when(jobRepository.findById(9L)).thenReturn(Optional.of(job));
        when(resultRepository.findByRace_Id(202L)).thenReturn(List.of(result));
        when(predictionRepository.findByRace_Id(202L)).thenReturn(List.of());
        when(streakLegRepository.findByRace_Id(202L)).thenReturn(List.of(currentLeg));

        return new Fixture(streak, currentLeg, spectator);
    }

    private RaceParticipant participant(Long id) {
        RaceParticipant participant = mock(RaceParticipant.class);
        when(participant.getId()).thenReturn(id);
        return participant;
    }

    private record Fixture(
            StreakPrediction streak,
            StreakPredictionLeg currentLeg,
            User spectator
    ) {}
}
