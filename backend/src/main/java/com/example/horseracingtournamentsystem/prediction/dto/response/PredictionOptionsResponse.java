package com.example.horseracingtournamentsystem.prediction.dto.response;

import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

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
    private List<Option> options;

    // horseId -> (position -> odds)
    private Map<Long, Map<Integer, BigDecimal>> positionOddsMatrix;
    private List<HeadToHeadMatchup> h2hMatchups;

    @Getter
    @Setter
    public static class EntryCost {
        private int winner;
    }

    @Getter
    @Setter
    public static class RewardConfig {
        private int winnerReward;
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
        // Fair win (position-1) decimal odds = 1 / P(win). Used to price streak parlay legs
        // consistently end-to-end (the streak is fixed-odds; single-race markets are pari-mutuel).
        private BigDecimal winOdds;
    }

    @Getter
    @Setter
    public static class HeadToHeadMatchup {
        private Long participantAId;
        private Long participantBId;
        private Double handicapSeconds; // A gives B this many seconds (if positive, A must beat B by more than this)
        private BigDecimal oddsA;
        private BigDecimal oddsB;
    }
}
