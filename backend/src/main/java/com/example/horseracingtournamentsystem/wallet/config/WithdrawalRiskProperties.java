package com.example.horseracingtournamentsystem.wallet.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "wallet.withdrawal.risk")
public record WithdrawalRiskProperties(
        @Min(2) int velocityCount,
        @NotNull Duration velocityWindow,
        @DecimalMin("1.0") double anomalyMultiplier,
        @Min(1) int anomalyMinHistory,
        @NotNull Duration recentTerminalWindow,
        @NotNull Duration historyWindow
) {
}
