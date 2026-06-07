package com.example.horseracingtournamentsystem.prediction.dto.response;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import java.time.LocalDateTime;

public record UserPredictionResponse(
        Long id,
        Long raceId,
        String raceName,
        String predictionType,
        Long predictedWinnerId,
        Long predictedSecondId,
        Long predictedThirdId,
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
        return new UserPredictionResponse(
                prediction.getId(),
                prediction.getRace().getId(),
                prediction.getRace().getName(),
                prediction.getPredictionType(),
                prediction.getPredictedWinnerId(),
                prediction.getPredictedSecondId(),
                prediction.getPredictedThirdId(),
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
