package com.example.horseracingtournamentsystem.prediction.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
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

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_LOCKED = "LOCKED";
    public static final String STATUS_CORRECT = "CORRECT";
    public static final String STATUS_INCORRECT = "INCORRECT";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REFUNDED = "REFUNDED";

    public static final String TYPE_WINNER = "WINNER";
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
    private Long predictedWinnerId;

    @Column(name = "predicted_second_id")
    private Long predictedSecondId;

    @Column(name = "predicted_third_id")
    private Long predictedThirdId;

    @Column(name = "entry_cost_points", nullable = false)
    private Integer entryCostPoints;

    @Column(name = "reward_points", nullable = false)
    private Integer rewardPoints = 0;

    @Column(name = "status", nullable = false, length = 30)
    private String status = STATUS_PENDING;

    @Column(name = "locked_at")
    private LocalDateTime lockedAt;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static RacePrediction create(Race race, User spectator, String predictionType, Long predictedWinnerId, Long predictedSecondId, Long predictedThirdId, int entryCostPoints) {
        RacePrediction prediction = new RacePrediction();
        prediction.setRace(race);
        prediction.setSpectator(spectator);
        prediction.setPredictionType(predictionType);
        prediction.setPredictedWinnerId(predictedWinnerId);
        prediction.setPredictedSecondId(predictedSecondId);
        prediction.setPredictedThirdId(predictedThirdId);
        prediction.setEntryCostPoints(entryCostPoints);
        prediction.setRewardPoints(0);
        prediction.setStatus(STATUS_PENDING);
        prediction.setCreatedAt(LocalDateTime.now());
        return prediction;
    }

    public String getResultCategory() {
        if (!"CORRECT".equals(status) && !"INCORRECT".equals(status)) {
            return status; // PENDING, LOCKED, REFUNDED, etc.
        }
        if ("INCORRECT".equals(status)) {
            return "INCORRECT";
        }
        if ("WINNER".equals(predictionType)) {
            return "WINNER_CORRECT";
        }
        return rewardPoints == 30 ? "TOP3_EXACT" : "TOP3_ANY_ORDER";
    }
}
