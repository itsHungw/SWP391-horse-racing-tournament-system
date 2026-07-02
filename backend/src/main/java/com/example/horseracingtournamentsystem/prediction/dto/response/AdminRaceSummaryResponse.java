package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class AdminRaceSummaryResponse {
    private Long raceId;
    private String raceName;
    private String roundName;
    private Long tournamentId;
    private String tournamentName;
    private LocalDateTime raceAt;
    private String raceStatus;
    private String predictionStatus; // OPEN, LOCKED, SETTLEMENT_PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
    private long totalPredictions;
    private long winnerPickCount;
    private long correctWinnerCount;
    private long incorrectCount;
    private String settlementJobStatus;
}
