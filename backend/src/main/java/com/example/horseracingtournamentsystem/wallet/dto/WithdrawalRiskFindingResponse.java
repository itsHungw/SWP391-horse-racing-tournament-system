package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;

public record WithdrawalRiskFindingResponse(
        String code,
        WithdrawalRiskLevel severity,
        String title,
        String explanation,
        String evidence,
        String suggestedCheck
) {
}
