package com.example.horseracingtournamentsystem.race.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PublicRaceResultResponse {
    private Long raceId;
    private boolean official;
    private LocalDateTime publishedAt;
    private List<Entry> entries;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Entry {
        private Integer position;
        private String horseName;
        private String jockeyName;
        private BigDecimal finishTimeSeconds;
        private BigDecimal penaltySeconds;
        private int points;
        private String resultStatus;
    }
}
