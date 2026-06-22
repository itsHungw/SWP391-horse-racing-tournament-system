package com.example.horseracingtournamentsystem.prediction.dto.response;

import com.example.horseracingtournamentsystem.prediction.entity.RacePrediction;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;

public record UserPredictionResponse(
        Long id,
        Long raceId,
        String raceName,
        String roundName,
        Integer roundNumber,
        String roundCode,
        String championshipName,
        String predictionType,
        Long predictedWinnerId,
        String predictedWinnerName,
        Long predictedSecondId,
        String predictedSecondName,
        Long predictedThirdId,
        String predictedThirdName,
        Integer entryCostPoints,
        Integer rewardPoints,
        PredictionStatus status,
        String resultCategory,
        LocalDateTime lockedAt,
        LocalDateTime evaluatedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Integer wagerAmount,
        java.math.BigDecimal lockedOdds
) {
    public static UserPredictionResponse from(RacePrediction prediction) {
        return from(prediction, java.util.Map.of(), null);
    }

    public static UserPredictionResponse from(RacePrediction prediction, java.util.Map<Long, String> horseNames, Integer roundNumber) {
        return new UserPredictionResponse(
                prediction.getId(),
                prediction.getRace().getId(),
                prediction.getRace().getName(),
                prediction.getRace().getRoundName(),
                roundNumber,
                prediction.getRace().getCode(),
                prediction.getRace().getTournament() != null ? prediction.getRace().getTournament().getName() : null,
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
                prediction.getUpdatedAt(),
                prediction.getWagerAmount(),
                prediction.getLockedOdds()
        );
    }
}
