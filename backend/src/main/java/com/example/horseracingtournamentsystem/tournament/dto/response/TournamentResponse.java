package com.example.horseracingtournamentsystem.tournament.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class TournamentResponse {
    private Long id;
    private String name;
    private String code;
    private String description;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime registrationStartAt;
    private LocalDateTime registrationEndAt;
    private Integer maxHorses;
    private String status;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
