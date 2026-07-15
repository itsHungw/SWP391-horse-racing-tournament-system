package com.example.horseracingtournamentsystem.tournament.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Data;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentSummaryResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime registrationEndAt;
    private Integer maxHorses;
    private TournamentStatus status;
    private long totalPrizePool;
    private long raceCount;
    private long participantCount;
    private NextRaceSummary nextRace;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class NextRaceSummary {
        private Long id;
        private String name;
        private LocalDateTime raceDateTime;
        private com.example.horseracingtournamentsystem.race.enums.RaceStatus status;
    }
}
