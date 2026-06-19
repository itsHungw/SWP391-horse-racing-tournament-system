package com.example.horseracingtournamentsystem.tournament.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.example.horseracingtournamentsystem.tournament.enums.TournamentStatus;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
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
    private Integer maxHorsesPerOwner;
    private TournamentStatus status;
    private String creatorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
