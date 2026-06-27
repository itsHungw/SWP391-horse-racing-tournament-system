package com.example.horseracingtournamentsystem.prediction.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
import com.example.horseracingtournamentsystem.race.entity.RaceParticipant;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;

@Entity
@Table(name = "streak_prediction_legs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreakPredictionLeg {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "streak_prediction_id", nullable = false)
    private StreakPrediction streakPrediction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "predicted_winner_id", nullable = false)
    private RaceParticipant predictedWinner;

    @Column(name = "locked_odds", nullable = false, precision = 18, scale = 4)
    private BigDecimal lockedOdds;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StreakPredictionStatus status = StreakPredictionStatus.PENDING;
}
