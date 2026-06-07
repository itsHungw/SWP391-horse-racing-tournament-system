package com.example.horseracingtournamentsystem.point.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdatePointSettingsRequest(
        @NotNull @Min(0) Integer FIRST_LOGIN_BONUS,
        @NotNull @Min(0) Integer BLOG_REWARD_POINTS,
        @NotNull @Min(0) Integer DAILY_BLOG_REWARD_LIMIT,
        @NotNull @Min(0) Integer PREDICTION_ENTRY_COST,
        @NotNull @Min(0) Integer PREDICTION_CORRECT_REWARD
) {
}
