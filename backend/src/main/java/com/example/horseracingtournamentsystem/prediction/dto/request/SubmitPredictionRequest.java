package com.example.horseracingtournamentsystem.prediction.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmitPredictionRequest {

    @NotNull(message = "Race ID is required")
    private Long raceId;

    @NotNull(message = "Prediction type is required")
    private String predictionType; // WINNER or TOP3

    @NotNull(message = "Predicted winner ID is required")
    private Long predictedWinnerId; // race_participants.id

    private Long predictedSecondId; // Required for TOP3

    private Long predictedThirdId; // Required for TOP3
}
