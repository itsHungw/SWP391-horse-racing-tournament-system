package com.example.horseracingtournamentsystem.wallet.dto;

import com.example.horseracingtournamentsystem.wallet.entity.WithdrawalRiskLevel;
import java.util.List;

public record WithdrawalRiskAssessmentResponse(
        WithdrawalRiskLevel level,
        List<WithdrawalRiskFindingResponse> findings,
        List<String> contextMarkers
) {
    public WithdrawalRiskAssessmentResponse {
        findings = List.copyOf(findings);
        contextMarkers = List.copyOf(contextMarkers);
    }
}
