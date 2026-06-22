package com.example.horseracingtournamentsystem.notification.dto.response;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String body,
        String referenceType,
        Long referenceId,
        boolean read,
        LocalDateTime createdAt
) {
}
