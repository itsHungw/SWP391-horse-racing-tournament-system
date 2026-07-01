package com.example.horseracingtournamentsystem.prediction.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PredictionSettingResponse {

    private double displaySeed;
    private BigDecimal takeoutRate;
    private LocalDateTime updatedAt;
    private String updatedByUserName;

    public double getDisplaySeed() {
        return displaySeed;
    }

    public void setDisplaySeed(double displaySeed) {
        this.displaySeed = displaySeed;
    }

    public BigDecimal getTakeoutRate() {
        return takeoutRate;
    }

    public void setTakeoutRate(BigDecimal takeoutRate) {
        this.takeoutRate = takeoutRate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUpdatedByUserName() {
        return updatedByUserName;
    }

    public void setUpdatedByUserName(String updatedByUserName) {
        this.updatedByUserName = updatedByUserName;
    }
}
