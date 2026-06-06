package com.example.horseracingtournamentsystem.referee.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SubmitResultsRequest(
        Boolean requiresAdminReview,
        String reviewReason,
        String reportTitle,
        String reportSummary,
        @NotEmpty(message = "Result list cannot be empty")
        List<@Valid ParticipantResultEntry> results
) {
}
