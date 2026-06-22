package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class AdminRaceDetailResponse {
    private Long raceId;
    private String raceName;
    private String roundName;
    private String tournamentName;
    private String raceStatus;
    private String predictionStatus; // OPEN, LOCKED, SETTLEMENT_PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED

    private SummaryInfo summary;
    private SettlementJobInfo settlementJob;

    @Getter
    @Setter
    public static class SummaryInfo {
        private long totalPredictions;
        private long winnerPickCount;
        private long top3PickCount;
        
        private long winnerCorrectCount;
        private long exactTop3Count;
        private long top3AnyOrderCount;
        private long incorrectCount;
        private long refundedCount;

        private long rewardedPoints;
    }

    @Getter
    @Setter
    public static class SettlementJobInfo {
        private Long id;
        private com.example.horseracingtournamentsystem.prediction.enums.PredictionSettlementJobStatus status; // PENDING, PROCESSING, COMPLETED, FAILED
        private int processedCount;
        private int rewardedCount;
        private int failedCount;
        private int retryCount;
        private String errorMessage;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
    }
}
