package com.example.horseracingtournamentsystem.prediction.service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

import com.example.horseracingtournamentsystem.prediction.repository.RacePredictionRepository;
import com.example.horseracingtournamentsystem.result.repository.RaceResultRepository;

class OddsCalculationServiceTest {
    
    private final OddsCalculationService service = new OddsCalculationService(
            mock(RaceResultRepository.class),
            mock(RacePredictionRepository.class)
    );

    @Test
    void testCalculateOdds() {
        // vPool = 10000, R = 0.85
        // horse initial probability P = 0.5 -> vHorse = 5000
        // No real bets yet
        BigDecimal odds = service.calculateOdds(10000, 0, 0.85, 5000, 0);
        // Formula: (10000 + 0) * 0.85 / (5000 + 0) = 8500 / 5000 = 1.70
        assertEquals(new BigDecimal("1.70"), odds);

        // With real bets: Total real bets = 1000. Real bets on this horse = 1000
        BigDecimal oddsAfterBet = service.calculateOdds(10000, 1000, 0.85, 5000, 1000);
        // Formula: (10000 + 1000) * 0.85 / (5000 + 1000) = 9350 / 6000 = 1.5583 -> 1.56
        assertEquals(new BigDecimal("1.56"), oddsAfterBet);
    }
}
