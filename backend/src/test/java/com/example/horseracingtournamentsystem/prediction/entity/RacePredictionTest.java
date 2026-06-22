package com.example.horseracingtournamentsystem.prediction.entity;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.assertEquals;

class RacePredictionTest {
    @Test
    void testVariableWagerAndLockedOdds() {
        RacePrediction prediction = new RacePrediction();
        prediction.setWagerAmount(50000);
        prediction.setLockedOdds(new BigDecimal("1.85"));
        
        assertEquals(50000, prediction.getWagerAmount());
        assertEquals(new BigDecimal("1.85"), prediction.getLockedOdds());
    }
}
