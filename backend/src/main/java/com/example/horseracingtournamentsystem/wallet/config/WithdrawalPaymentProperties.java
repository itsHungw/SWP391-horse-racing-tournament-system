package com.example.horseracingtournamentsystem.wallet.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "wallet.withdrawal.payment")
public record WithdrawalPaymentProperties(
        @NotBlank String transferContentTemplate,
        @Min(1) long receiptMaxBytes,
        @NotEmpty Set<String> allowedReceiptTypes,
        @NotNull Duration orphanReceiptExpiry
) {
}
