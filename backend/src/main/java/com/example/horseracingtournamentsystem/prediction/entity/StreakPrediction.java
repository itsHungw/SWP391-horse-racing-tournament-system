package com.example.horseracingtournamentsystem.prediction.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.tournament.entity.Tournament;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.horseracingtournamentsystem.prediction.enums.StreakPredictionStatus;

/**
 * Entity lưu trữ thông tin Vé cược Xiên/Chuỗi (Streak Prediction) của người chơi.
 * Người chơi chọn một giải đấu (tournament) và dự đoán chuỗi các trận thắng liên tiếp.
 */
@Entity
@Table(name = "streak_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreakPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spectator_id", nullable = false)
    private User spectator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "wager_amount", nullable = false)
    private Long wagerAmount; // Số tiền cược thực tế (VND)

    @Column(name = "total_odds", nullable = false, precision = 18, scale = 4)
    private BigDecimal totalOdds; // Tổng tỷ lệ cược của cả vé xiên (Nhân các chặng lại với nhau)

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StreakPredictionStatus status = StreakPredictionStatus.PENDING; // Trạng thái của vé xiên (PENDING, WON, LOST, CANCELLED)

    @Builder.Default
    @Column(name = "reward_points")
    private long rewardPoints = 0; // Số tiền thắng cược (0 nếu thua 1 chặng)

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "streakPrediction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StreakPredictionLeg> legs = new ArrayList<>(); // Danh sách các chặng đua (legs) trong vé xiên này

    public void addLeg(StreakPredictionLeg leg) {
        legs.add(leg);
        leg.setStreakPrediction(this);
    }

    public void removeLeg(StreakPredictionLeg leg) {
        legs.remove(leg);
        leg.setStreakPrediction(null);
    }
}
