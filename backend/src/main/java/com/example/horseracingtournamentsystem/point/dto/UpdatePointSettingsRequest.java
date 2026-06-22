package com.example.horseracingtournamentsystem.point.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdatePointSettingsRequest(
        @JsonProperty("FIRST_LOGIN_BONUS") @NotNull @Min(0) Integer FIRST_LOGIN_BONUS,
        @JsonProperty("BLOG_REWARD_POINTS") @NotNull @Min(0) Integer BLOG_REWARD_POINTS,
        @JsonProperty("DAILY_BLOG_REWARD_LIMIT") @NotNull @Min(0) Integer DAILY_BLOG_REWARD_LIMIT,
        @JsonProperty("PREDICTION_WINNER_ENTRY_COST") @NotNull @Min(0) Integer PREDICTION_WINNER_ENTRY_COST,
        @JsonProperty("PREDICTION_TOP3_ENTRY_COST") @NotNull @Min(0) Integer PREDICTION_TOP3_ENTRY_COST,
        @JsonProperty("PREDICTION_WINNER_REWARD") @NotNull @Min(0) Integer PREDICTION_WINNER_REWARD,
        @JsonProperty("PREDICTION_TOP3_EXACT_REWARD") @NotNull @Min(0) Integer PREDICTION_TOP3_EXACT_REWARD,
        @JsonProperty("PREDICTION_TOP3_ANY_ORDER_REWARD") @NotNull @Min(0) Integer PREDICTION_TOP3_ANY_ORDER_REWARD
) {
}
