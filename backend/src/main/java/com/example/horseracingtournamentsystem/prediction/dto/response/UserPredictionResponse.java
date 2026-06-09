package com.example.horseracingtournamentsystem.prediction.dto.response;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import java.time.LocalDateTime;

public record UserPredictionResponse(
        Long id,
        Long raceId,
        String raceName,
        String predictionType,
        Long predictedWinnerId,
        String predictedWinnerName,
        Long predictedSecondId,
        String predictedSecondName,
        Long predictedThirdId,
        String predictedThirdName,
        Integer entryCostPoints,
        Integer rewardPoints,
        String status,
        String resultCategory,
        LocalDateTime lockedAt,
        LocalDateTime evaluatedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserPredictionResponse from(RacePrediction prediction) {
        return from(prediction, java.util.Map.of());
    }

    public static UserPredictionResponse from(RacePrediction prediction, java.util.Map<Long, String> horseNames) {
        return new UserPredictionResponse(
                prediction.getId(),
                prediction.getRace().getId(),
                prediction.getRace().getName(),
                prediction.getPredictionType(),
                prediction.getPredictedWinnerId(),
                horseNames.get(prediction.getPredictedWinnerId()),
                prediction.getPredictedSecondId(),
                prediction.getPredictedSecondId() != null ? horseNames.get(prediction.getPredictedSecondId()) : null,
                prediction.getPredictedThirdId(),
                prediction.getPredictedThirdId() != null ? horseNames.get(prediction.getPredictedThirdId()) : null,
                prediction.getEntryCostPoints(),
                prediction.getRewardPoints(),
                prediction.getStatus(),
                prediction.getResultCategory(),
                prediction.getLockedAt(),
                prediction.getEvaluatedAt(),
                prediction.getCreatedAt(),
                prediction.getUpdatedAt()
        );
    }
}
