package com.example.horseracingtournamentsystem.race.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RaceSummaryResponse {
    private Long id;
    private String name;
    private String roundName;
    private String code;
    private Long tournamentId;
    private String tournamentName;
    private LocalDateTime raceDateTime;
    private String location;
    private Integer distanceMeters;
    private Integer maxParticipants;
    private long participantCount;
    private String status;
    private boolean predictionOpen;
    private LocalDateTime predictionCloseTime;
    private boolean resultOfficial;
    private WinnerSummary winner;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class WinnerSummary {
        private String horseName;
        private String jockeyName;
        private BigDecimal finishTimeSeconds;
    }
}
