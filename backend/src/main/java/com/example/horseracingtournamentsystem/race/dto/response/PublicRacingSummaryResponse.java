package com.example.horseracingtournamentsystem.race.dto.response;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class PublicRacingSummaryResponse {
    private long raceCount;
    private long raceDayCount;
    private long championshipCount;
    private LocalDate seasonFinale;
}
