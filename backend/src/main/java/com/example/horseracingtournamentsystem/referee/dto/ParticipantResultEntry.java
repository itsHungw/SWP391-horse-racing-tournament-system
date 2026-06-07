package com.example.horseracingtournamentsystem.referee.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ParticipantResultEntry(
        @NotNull(message = "Participant ID is required")
        Long participantId,
        String horseName,
        String jockeyName,
        @Min(value = 1, message = "Position must be at least 1")
        Integer position,
        @DecimalMin(value = "0.000", message = "Raw finish time cannot be negative")
        BigDecimal rawFinishTimeSeconds,
        @DecimalMin(value = "0.000", message = "Penalty seconds cannot be negative")
        BigDecimal penaltySeconds,
        @DecimalMin(value = "0.000", message = "Finish time cannot be negative")
        BigDecimal finishTimeSeconds,
        String status,
        String note
) {
}
