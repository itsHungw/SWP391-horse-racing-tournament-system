package com.example.horseracingtournamentsystem.prediction.entity;

import com.example.horseracingtournamentsystem.race.entity.Race;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus;

/**
 * Entity lưu trữ thông tin về một Job trả thưởng (Settlement Job) cho một cuộc đua.
 * Dùng để theo dõi tiến trình chạy ngầm phân bổ tiền thắng cược sau khi đua xong.
 */
@Entity
@Table(name = "prediction_settlement_jobs")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PredictionSettlementJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PredictionSettlementJobStatus status = PredictionSettlementJobStatus.PENDING; // Trạng thái Job (PENDING, PROCESSING, COMPLETED, FAILED)

    @Column(name = "processed_count", nullable = false)
    private Integer processedCount = 0; // Số vé cược đã duyệt qua

    @Column(name = "rewarded_count", nullable = false)
    private Integer rewardedCount = 0; // Số vé cược thắng/được trả thưởng

    @Column(name = "failed_count", nullable = false)
    private Integer failedCount = 0; // Số vé cược xử lý lỗi

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0; // Số lần thử chạy lại (retry) khi bị lỗi

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static PredictionSettlementJob create(Race race) {
        PredictionSettlementJob job = new PredictionSettlementJob();
        job.setRace(race);
        job.setStatus(PredictionSettlementJobStatus.PENDING);
        job.setProcessedCount(0);
        job.setRewardedCount(0);
        job.setFailedCount(0);
        job.setRetryCount(0);
        job.setCreatedAt(LocalDateTime.now());
        return job;
    }
}
