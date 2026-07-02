package com.example.horseracingtournamentsystem.prediction.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class SubmitStreakPredictionRequest {
    private Long tournamentId;
    private Long wagerAmount;
    private List<StreakPredictionLegRequest> legs;
}
