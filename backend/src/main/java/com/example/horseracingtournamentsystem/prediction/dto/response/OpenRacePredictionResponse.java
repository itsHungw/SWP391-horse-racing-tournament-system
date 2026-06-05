package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class OpenRacePredictionResponse {
    private Long raceId;
    private String raceName;
    private String roundName;
    private Long tournamentId;
    private String tournamentName;
    private LocalDateTime raceAt;
    private String status;
    private Long totalPredictions;
    private UserPredictionStatus predictedByUser;

    @Getter
    @Setter
    public static class UserPredictionStatus {
        private boolean hasPredicted;
        private List<String> types; // "WINNER", "TOP3"
    }
}
