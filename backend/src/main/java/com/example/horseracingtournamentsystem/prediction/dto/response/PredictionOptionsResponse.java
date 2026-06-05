package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class PredictionOptionsResponse {
    private Long raceId;
    private String raceName;
    private String raceStatus;
    private boolean predictionOpen;
    private EntryCost entryCost = new EntryCost();
    private Object myPredictions; // Renamed from myPrediction
    private boolean winnerDistributionVisible;
    private boolean top3DistributionVisible;
    private List<Option> options;

    @Getter
    @Setter
    public static class EntryCost {
        private int winner = 5;
        private int top3 = 10;
    }

    @Getter
    @Setter
    public static class Option {
        private Long raceParticipantId;
        private Integer startNumber;
        private Integer laneNumber;
        private String horseName;
        private String jockeyName;
        private Double communityWinnerRate;
        private Double communityTop3Rate;
    }
}
