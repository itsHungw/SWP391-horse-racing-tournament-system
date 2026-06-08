package com.example.horseracingtournamentsystem.blog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record BlogRewardClaimRequest(
        @NotNull(message = "Reading seconds is required")
        @Min(value = 30, message = "You must read the blog for at least 30 seconds")
        Integer readingSeconds,

        @NotNull(message = "Scroll percent is required")
        @Min(value = 80, message = "You must scroll at least 80 percent of the blog")
        @Max(value = 100, message = "Scroll percent cannot exceed 100")
        Integer scrollPercent
) {
}
