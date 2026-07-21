package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;

@Data
@Builder
public class AdminStreakPredictionResponse {
    private Long id;
    private Long spectatorId;
    private String spectatorName;
    private String spectatorEmail;
    private Long tournamentId;
    private String tournamentName;
    private Long wagerAmount;
    private BigDecimal totalOdds;
    private StreakPredictionStatus status;
    private Long rewardPoints;
    private LocalDateTime createdAt;
    private LocalDateTime evaluatedAt;
    private List<AdminStreakPredictionLegResponse> legs;
}
