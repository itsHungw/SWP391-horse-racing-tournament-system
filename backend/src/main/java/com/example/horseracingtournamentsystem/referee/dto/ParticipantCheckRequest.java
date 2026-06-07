package com.example.horseracingtournamentsystem.referee.dto;

import java.math.BigDecimal;

public record ParticipantCheckRequest(
        Long participantId,
        String horseName,
        String jockeyName,
        BigDecimal jockeyWeight,
        Boolean gearOk,
        Boolean healthOk,
        String status,
        String note
) {
}
