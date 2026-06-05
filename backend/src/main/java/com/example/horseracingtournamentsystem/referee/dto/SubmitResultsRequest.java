package com.example.horseracingtournamentsystem.referee.dto;

import java.util.List;

public record SubmitResultsRequest(
        Boolean requiresAdminReview,
        String reviewReason,
        String reportTitle,
        String reportSummary,
        List<ParticipantResultEntry> results
) {
}
