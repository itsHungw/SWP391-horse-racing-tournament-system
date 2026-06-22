package com.example.horseracingtournamentsystem.prediction.dto.request;

import lombok.Data;

@Data
public class StreakPredictionLegRequest {
    private Long raceId;
    private Long predictedWinnerId;
}
