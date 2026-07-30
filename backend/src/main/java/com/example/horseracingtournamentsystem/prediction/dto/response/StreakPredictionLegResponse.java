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
    private java.time.LocalDateTime raceStartTime;
    private Long predictedWinnerId;
    private String predictedWinnerName;
    private BigDecimal placedOdds;
    private BigDecimal expectedOdds;
    private BigDecimal lockedOdds;
    private StreakPredictionStatus status;
}
