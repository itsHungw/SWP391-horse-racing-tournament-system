package com.example.horseracingtournamentsystem.championship.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record JockeyChampionshipResponse(
        Long id,
        String name,
        String code,
        String description,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime registrationStartAt,
        LocalDateTime registrationEndAt,
        Integer maxHorses,
        String status,
        String applicationStatus,
        Long applicationId,
        String applicationMessage,
        String rejectionReason,
        LocalDateTime applicationCreatedAt,
        LocalDateTime reviewedAt,
        long approvedPoolCount,
        boolean applicationWindowOpen,
        boolean canApply
) {
}
