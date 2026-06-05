package com.example.horseracingtournamentsystem.referee.dto;

import java.math.BigDecimal;

public record ParticipantResultEntry(
        Long participantId,
        String horseName,
        String jockeyName,
        Integer position,
        BigDecimal rawFinishTimeSeconds,
        BigDecimal penaltySeconds,
        BigDecimal finishTimeSeconds,
        String status,
        String note
) {
}
