package com.example.horseracingtournamentsystem.prediction.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.horseracingtournamentsystem.horse.entity.Horse;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransaction;
import com.example.horseracingtournamentsystem.wallet.entity.WalletTransactionType;
import com.example.horseracingtournamentsystem.wallet.service.WalletService;
import com.example.horseracingtournamentsystem.prediction.dto.request.StreakPredictionLegRequest;
import com.example.horseracingtournamentsystem.prediction.dto.request.SubmitStreakPredictionRequest;
import com.example.horseracingtournamentsystem.prediction.dto.response.StreakPredictionResponse;
import com.example.horseracingtournamentsystem.prediction.entity.StreakPrediction;
import com.example.horseracingtournamentsystem.prediction.repository.StreakPredictionRepository;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import com.example.horseracingtournamentsystem.race.enums.ParticipantStatus;
import com.example.horseracingtournamentsystem.race.enums.RaceStatus;
import com.example.horseracingtournamentsystem.race.repository.RaceParticipantRepository;
import com.example.horseracingtournamentsystem.race.repository.RaceRepository;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import com.example.horseracingtournamentsystem.tournament.repository.TournamentRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StreakPredictionServiceTest {

    @Mock private StreakPredictionRepository streakRepository;
    @Mock private UserRepository userRepository;
    @Mock private TournamentRepository tournamentRepository;
    @Mock private RaceRepository raceRepository;
    @Mock private RaceParticipantRepository participantRepository;
    @Mock private OddsCalculationService oddsService;
    @Mock private WalletService walletService;

    private StreakPredictionService service;

    @BeforeEach
    void setUp() {
        service = new StreakPredictionService(
                streakRepository, userRepository, tournamentRepository,
                raceRepository, participantRepository, oddsService, walletService);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "parlayTakeout", new BigDecimal("0.20"));
        org.springframework.test.util.ReflectionTestUtils.setField(service, "maxTotalOdds", new BigDecimal("100"));
    }

    @Test
    void submitSumsCurrentStreakLegOdds() {
        User spectator = mock(User.class);
        Tournament tournament = mock(Tournament.class);
        Race raceOne = race(101L, "Race One");
        Race raceTwo = race(102L, "Race Two");
        RaceParticipant horseOne = participant(1001L, "Alpha");
        RaceParticipant horseTwo = participant(1002L, "Bravo");

        when(spectator.getId()).thenReturn(7L);
        when(tournament.getId()).thenReturn(3L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(spectator));
        when(tournamentRepository.findById(3L)).thenReturn(Optional.of(tournament));
        when(raceRepository.findById(101L)).thenReturn(Optional.of(raceOne));
        when(raceRepository.findById(102L)).thenReturn(Optional.of(raceTwo));
        when(participantRepository.findById(1001L)).thenReturn(Optional.of(horseOne));
        when(participantRepository.findById(1002L)).thenReturn(Optional.of(horseTwo));
        when(participantRepository.findAllByRaceAndStatusNotOrderByLane(
                anyLong(), any(ParticipantStatus.class)))
                .thenReturn(List.of(horseOne, horseTwo));
        when(oddsService.calculateStreakOddsMatrix(anyLong(), any())).thenReturn(Map.of(
                1001L, new BigDecimal("2.00"),
                1002L, new BigDecimal("2.50")));
        when(walletService.getBalance(7L)).thenReturn(100_000L);
        when(streakRepository.saveAndFlush(any(StreakPrediction.class))).thenAnswer(invocation -> {
            StreakPrediction streak = invocation.getArgument(0);
            streak.setId(41L);
            return streak;
        });

        SubmitStreakPredictionRequest request = new SubmitStreakPredictionRequest();
        request.setTournamentId(3L);
        request.setWagerAmount(10_000L);
        request.setLegs(List.of(leg(101L, 1001L), leg(102L, 1002L)));

        StreakPredictionResponse response = service.submitStreakPrediction(7L, request);

        assertEquals(new BigDecimal("4.50"), response.getTotalOdds());
        verify(walletService).adjust(
                spectator, -10_000L, WalletTransactionType.BET_PLACED,
                WalletTransaction.REF_STREAK_PREDICTION, 41L,
                "Placed streak bet of 10000 VND #41");
    }

    private Race race(Long id, String name) {
        Race race = mock(Race.class);
        when(race.getId()).thenReturn(id);
        when(race.getName()).thenReturn(name);
        when(race.getStatus()).thenReturn(RaceStatus.SCHEDULED);
        return race;
    }

    private RaceParticipant participant(Long id, String horseName) {
        RaceParticipant participant = mock(RaceParticipant.class);
        Horse horse = mock(Horse.class);
        when(participant.getId()).thenReturn(id);
        when(participant.getStatus()).thenReturn(ParticipantStatus.APPROVED);
        when(participant.getHorse()).thenReturn(horse);
        when(horse.getName()).thenReturn(horseName);
        return participant;
    }

    private StreakPredictionLegRequest leg(Long raceId, Long participantId) {
        StreakPredictionLegRequest leg = new StreakPredictionLegRequest();
        leg.setRaceId(raceId);
        leg.setPredictedWinnerId(participantId);
        return leg;
    }
}
