package com.example.horseracingtournamentsystem.blog.dto;

public record BlogRewardClaimResponse(
        String outcome,
        int pointsAwarded,
        int balance
) {

    public static final String CLAIMED = "CLAIMED";
    public static final String ALREADY_CLAIMED = "ALREADY_CLAIMED";
    public static final String DAILY_LIMIT_REACHED = "DAILY_LIMIT_REACHED";

    public static BlogRewardClaimResponse claimed(int pointsAwarded, int balance) {
        return new BlogRewardClaimResponse(CLAIMED, pointsAwarded, balance);
    }

    public static BlogRewardClaimResponse alreadyClaimed(int balance) {
        return new BlogRewardClaimResponse(ALREADY_CLAIMED, 0, balance);
    }

    public static BlogRewardClaimResponse dailyLimitReached(int balance) {
        return new BlogRewardClaimResponse(DAILY_LIMIT_REACHED, 0, balance);
    }
}
