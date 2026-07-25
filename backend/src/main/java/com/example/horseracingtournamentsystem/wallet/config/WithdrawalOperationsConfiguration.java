package com.example.horseracingtournamentsystem.wallet.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties({WithdrawalRiskProperties.class, WithdrawalPaymentProperties.class})
public class WithdrawalOperationsConfiguration {
}
