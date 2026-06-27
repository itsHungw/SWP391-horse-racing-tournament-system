package com.example.horseracingtournamentsystem.prediction.dto.response;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PredictionQuoteResponse {
    private boolean accepted = true;
    private Long raceId;
    private String predictionType;
    private Long predictedWinnerId;
    private Integer predictedPosition;
    private Long wagerAmount;

    private BigDecimal currentOdds;
    private BigDecimal oddsAfterStake;
    private BigDecimal priceImpactPercent;

    private Long estimatedReturn;
    private Long estimatedProfit;
    private Long potentialLoss;

    private Long playerPoolBefore;
    private Long playerPoolAfter;
    private Long houseFeeAmount;
    private Long netPlayerPoolAfter;
    private Long pricingLiquidity;
    private Integer houseFeePercent;

    private String liquidityNote;
}
