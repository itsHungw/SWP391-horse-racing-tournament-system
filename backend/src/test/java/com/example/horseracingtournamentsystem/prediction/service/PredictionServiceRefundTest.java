package com.example.horseracingtournamentsystem.prediction.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.prediction.repository.PredictionSettlementJobRepository;
import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionLegRepository;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import java.util.List;
import org.junit.jupiter.api.Test;

class PredictionServiceRefundTest {

    @Test
    void cancelledRaceRecordsRefundAsEvaluatedFinanceEvent() {
        RacePredictionRepository predictions = mock(RacePredictionRepository.class);
        RacePrediction prediction = RacePrediction.create(
                mock(com.example.horseracingtournamentsystem.race.entity.Race.class),
                mock(User.class), RacePrediction.TYPE_EXACT_POSITION,
                1L, 1, null, null, 10_000L);
        prediction.setWagerAmount(10_000L);
        prediction.setStatus(PredictionStatus.LOCKED);
        when(predictions.findByRace_Id(202L)).thenReturn(List.of(prediction));
        PredictionService service = new PredictionService(
                predictions,
                mock(PredictionSettlementJobRepository.class),
                mock(RaceRepository.class),
                mock(WalletService.class),
                mock(OddsCalculationService.class),
                mock(RaceParticipantRepository.class),
                mock(StreakPredictionLegRepository.class),
                mock(StreakPredictionRepository.class));

        service.refundCancelledRace(202L);

        assertThat(prediction.getStatus()).isEqualTo(PredictionStatus.REFUNDED);
        assertThat(prediction.getEvaluatedAt()).isNotNull();
    }
}
