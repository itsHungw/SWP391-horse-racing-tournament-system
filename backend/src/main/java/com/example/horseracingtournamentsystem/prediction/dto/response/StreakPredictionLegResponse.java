package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;

@Data
@Builder
public class StreakPredictionLegResponse {
    private Long id;
    private Long raceId;
    private String raceName;
    private Long predictedWinnerId;
    private String predictedWinnerName;
    private BigDecimal lockedOdds;
    private StreakPredictionStatus status;
}
