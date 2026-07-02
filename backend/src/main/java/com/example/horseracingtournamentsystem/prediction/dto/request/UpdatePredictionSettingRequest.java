package com.example.horseracingtournamentsystem.prediction.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class UpdatePredictionSettingRequest {

    @NotNull(message = "Display seed cannot be null")
    @Min(value = 0, message = "Display seed must be greater than or equal to 0")
    private Double displaySeed;

    @NotNull(message = "Takeout rate cannot be null")
    @DecimalMin(value = "0.0", message = "Takeout rate must be at least 0.0")
    @DecimalMax(value = "0.9", message = "Takeout rate cannot exceed 0.9 (90%)")
    private BigDecimal takeoutRate;

    public Double getDisplaySeed() {
        return displaySeed;
    }

    public void setDisplaySeed(Double displaySeed) {
        this.displaySeed = displaySeed;
    }

    public BigDecimal getTakeoutRate() {
        return takeoutRate;
    }

    public void setTakeoutRate(BigDecimal takeoutRate) {
        this.takeoutRate = takeoutRate;
    }
}
