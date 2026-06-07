package com.example.horseracingtournamentsystem.point.dto;

public record PointSettingResponse(
        int FIRST_LOGIN_BONUS,
        int BLOG_REWARD_POINTS,
        int DAILY_BLOG_REWARD_LIMIT,
        int PREDICTION_ENTRY_COST,
        int PREDICTION_CORRECT_REWARD
) {
}
