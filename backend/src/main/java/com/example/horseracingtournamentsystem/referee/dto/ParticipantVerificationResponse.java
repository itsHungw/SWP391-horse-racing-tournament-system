package com.example.horseracingtournamentsystem.referee.dto;

import java.math.BigDecimal;

public record ParticipantVerificationResponse(
        Long participantId,
        String horseName,
        String jockeyName,
        BigDecimal jockeyWeight,
        boolean gearOk,
        boolean healthOk,
        String status
) {
}
