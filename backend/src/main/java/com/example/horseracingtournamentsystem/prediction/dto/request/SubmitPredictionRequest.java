package com.example.horseracingtournamentsystem.prediction.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmitPredictionRequest {

    @NotNull(message = "Race ID is required")
    private Long raceId;

    @NotNull(message = "Prediction type is required")
    private String predictionType; // EXACT_POSITION or HEAD_TO_HEAD

    @NotNull(message = "Predicted horse ID is required")
    private Long predictedWinnerId; // race_participants.id

    private Integer predictedPosition; // Required for EXACT_POSITION

    private Long matchupOpponentId;

    private Double handicapSeconds;

    @NotNull(message = "Wager amount is required")
    @Min(value = 10000, message = "Minimum wager is 10000 points")
    private Long wagerAmount;
}
