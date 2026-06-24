package com.example.horseracingtournamentsystem.prediction.entity;

import com.example.horseracingtournamentsystem.prediction.enums.PredictionStatus;
import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "race_predictions")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RacePrediction {


    public static final String TYPE_WINNER = "WINNER"; // DEPRECATED
    public static final String TYPE_EXACT_POSITION = "EXACT_POSITION";
    public static final String TYPE_HEAD_TO_HEAD = "HEAD_TO_HEAD";
    public static final String TYPE_TOP3 = "TOP3";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spectator_id", nullable = false)
    private User spectator;

    @Column(name = "prediction_type", nullable = false, length = 30)
    private String predictionType;

    @Column(name = "predicted_winner_id", nullable = false)
    private Long predictedWinnerId; // Used as horseId for EXACT_POSITION

    @Column(name = "predicted_position")
    private Integer predictedPosition;

    @Column(name = "predicted_second_id")
    private Long predictedSecondId;

    @Column(name = "predicted_third_id")
    private Long predictedThirdId;

    @Column(name = "matchup_opponent_id")
    private Long matchupOpponentId;

    @Column(name = "handicap_seconds")
    private Double handicapSeconds;

    @Column(name = "entry_cost_points", nullable = false)
    private Integer entryCostPoints;

    @Column(name = "reward_points", nullable = false)
    private long rewardPoints = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PredictionStatus status = PredictionStatus.PENDING;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "wager_amount")
    private Integer wagerAmount;

    @Column(name = "locked_odds", precision = 10, scale = 2)
    private BigDecimal lockedOdds;

    public static RacePrediction create(Race race, User spectator, String predictionType, Long predictedWinnerId, Integer predictedPosition, Long predictedSecondId, Long predictedThirdId, Long matchupOpponentId, Double handicapSeconds, int entryCostPoints) {
        if ("WINNER".equals(predictionType) || "EXACT_POSITION".equals(predictionType) || "HEAD_TO_HEAD".equals(predictionType)) {
            if (predictedWinnerId == null) {
                throw new IllegalStateException("Predicted winner must be selected for " + predictionType);
            }
        }
        if ("EXACT_POSITION".equals(predictionType)) {
            if (predictedPosition == null) {
                throw new IllegalStateException("Predicted position must be selected for EXACT_POSITION");
            }
        }
        if ("HEAD_TO_HEAD".equals(predictionType)) {
            if (matchupOpponentId == null || handicapSeconds == null) {
                throw new IllegalStateException("Matchup opponent and handicap must be provided for HEAD_TO_HEAD");
            }
        }
        RacePrediction prediction = new RacePrediction();
        prediction.setRace(race);
        prediction.setSpectator(spectator);
        prediction.setPredictionType(predictionType);
        prediction.setPredictedWinnerId(predictedWinnerId);
        prediction.setPredictedPosition(predictedPosition);
        prediction.setPredictedSecondId(predictedSecondId);
        prediction.setPredictedThirdId(predictedThirdId);
        prediction.setMatchupOpponentId(matchupOpponentId);
        prediction.setHandicapSeconds(handicapSeconds);
        prediction.setEntryCostPoints(entryCostPoints);
        prediction.setRewardPoints(0);
        prediction.setStatus(PredictionStatus.PENDING);
        prediction.setCreatedAt(LocalDateTime.now());
        return prediction;
    }

    public String getResultCategory() {
        if (PredictionStatus.CORRECT != status && PredictionStatus.INCORRECT != status) {
            return status.name(); // PENDING, LOCKED, REFUNDED, etc.
        }
        if (PredictionStatus.INCORRECT == status) {
            return "INCORRECT";
        }
        if ("WINNER".equals(predictionType) || "EXACT_POSITION".equals(predictionType)) {
            return "EXACT_POSITION_CORRECT";
        }
        return rewardPoints == 30 ? "TOP3_EXACT" : "TOP3_ANY_ORDER";
    }
}
