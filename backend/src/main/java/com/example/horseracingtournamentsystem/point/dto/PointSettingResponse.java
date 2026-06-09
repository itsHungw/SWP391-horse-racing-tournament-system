package com.example.horseracingtournamentsystem.point.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PointSettingResponse(
        @JsonProperty("FIRST_LOGIN_BONUS") int FIRST_LOGIN_BONUS,
        @JsonProperty("BLOG_REWARD_POINTS") int BLOG_REWARD_POINTS,
        @JsonProperty("DAILY_BLOG_REWARD_LIMIT") int DAILY_BLOG_REWARD_LIMIT,
        @JsonProperty("PREDICTION_WINNER_ENTRY_COST") int PREDICTION_WINNER_ENTRY_COST,
        @JsonProperty("PREDICTION_TOP3_ENTRY_COST") int PREDICTION_TOP3_ENTRY_COST,
        @JsonProperty("PREDICTION_WINNER_REWARD") int PREDICTION_WINNER_REWARD,
        @JsonProperty("PREDICTION_TOP3_EXACT_REWARD") int PREDICTION_TOP3_EXACT_REWARD,
        @JsonProperty("PREDICTION_TOP3_ANY_ORDER_REWARD") int PREDICTION_TOP3_ANY_ORDER_REWARD
) {
}
