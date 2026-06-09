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
    private RewardConfig rewardConfig = new RewardConfig();
    private List<UserPredictionResponse> myPredictions;
    private boolean winnerDistributionVisible;
    private boolean top3DistributionVisible;
    private List<Option> options;

    @Getter
    @Setter
    public static class EntryCost {
        private int winner;
        private int top3;
    }

    @Getter
    @Setter
    public static class RewardConfig {
        private int winnerReward;
        private int top3ExactReward;
        private int top3AnyOrderReward;
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
