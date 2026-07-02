package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

import com.example.horseracingtournamentsystem.race.enums.RaceStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OpenRacePredictionResponse {
    private Long raceId;
    private String raceName;
    private String roundName;
    private Long tournamentId;
    private String tournamentName;
    private LocalDateTime raceAt;
    private RaceStatus status;
    private Long totalPredictions;
    private UserPredictionStatus predictedByUser;

    @Getter
    @Setter
    public static class UserPredictionStatus {
        private boolean hasPredicted;
        private List<String> types; // e.g. "EXACT_POSITION", "HEAD_TO_HEAD"
    }
}
