package com.example.horseracingtournamentsystem.dispute.dto;

import com.example.horseracingtournamentsystem.user.enums.UserStatus;
import java.time.LocalDateTime;

public record AccountAppealResponse(
        Long decisionId,
        UserStatus decisionStatus,
        String decisionReason,
        LocalDateTime decisionAt,
        DisputeResponse appeal) {
}
