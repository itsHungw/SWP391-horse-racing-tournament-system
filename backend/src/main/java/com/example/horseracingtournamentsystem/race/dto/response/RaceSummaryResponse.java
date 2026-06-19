package com.example.horseracingtournamentsystem.race.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.example.horseracingtournamentsystem.race.enums.RaceStatus;

@Data
@Builder
@NoArgsConstructor
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
    private Long participantCount;
    private RaceStatus status;
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
